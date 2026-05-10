alter table public.profiles
  add column if not exists study_language text not null default 'hindi';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_study_language_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_study_language_check
      check (study_language in ('hindi', 'english'));
  end if;
end $$;

do $$
declare
  constraint_name text;
begin
  select conname
  into constraint_name
  from pg_constraint
  where conrelid = 'public.user_study_plans'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%status%'
    and pg_get_constraintdef(oid) ilike '%active%'
    and pg_get_constraintdef(oid) ilike '%archived%'
  limit 1;

  if constraint_name is not null then
    execute format('alter table public.user_study_plans drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.user_study_plans
  add constraint user_study_plans_status_check
  check (status in ('active', 'paused', 'completed', 'archived', 'generating', 'failed'));

create or replace function public.activate_generated_study_plan(p_plan_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  plan_user_id uuid;
begin
  select user_id
  into plan_user_id
  from public.user_study_plans
  where id = p_plan_id
    and status = 'generating';

  if plan_user_id is null then
    raise exception 'Generating study plan not found.';
  end if;

  if auth.uid() is null or auth.uid() <> plan_user_id then
    raise exception 'Not authorized to activate this study plan.';
  end if;

  update public.user_study_plans
  set status = 'archived'
  where user_id = plan_user_id
    and status = 'active'
    and id <> p_plan_id;

  update public.user_study_plans
  set status = 'active'
  where id = p_plan_id
    and user_id = plan_user_id
    and status = 'generating';

  if not found then
    raise exception 'Could not activate generated study plan.';
  end if;
end;
$$;

grant execute on function public.activate_generated_study_plan(uuid) to authenticated;
