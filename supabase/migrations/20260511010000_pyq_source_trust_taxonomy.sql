alter table public.pyq_questions
  add column if not exists source_name text,
  add column if not exists source_url text,
  add column if not exists verification_status text,
  add column if not exists reviewed_by text,
  add column if not exists reviewed_at timestamptz;

update public.pyq_questions
set source = 'ai_generated'
where source is null;

update public.pyq_questions
set verification_status = case
  when source = 'verified_pyq' and is_verified = true then 'official_verified'
  when source = 'trusted_third_party' then 'in_review'
  when source = 'memory_based' then 'memory_based'
  else 'ai_practice'
end
where verification_status is null;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'pyq_questions_source_check'
      and conrelid = 'public.pyq_questions'::regclass
  ) then
    alter table public.pyq_questions
      drop constraint pyq_questions_source_check;
  end if;
end $$;

alter table public.pyq_questions
  add constraint pyq_questions_source_check
  check (source in ('verified_pyq', 'trusted_third_party', 'memory_based', 'ai_generated'))
  not valid;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'pyq_questions_verification_status_check'
      and conrelid = 'public.pyq_questions'::regclass
  ) then
    alter table public.pyq_questions
      drop constraint pyq_questions_verification_status_check;
  end if;
end $$;

alter table public.pyq_questions
  add constraint pyq_questions_verification_status_check
  check (
    verification_status in (
      'official_verified',
      'third_party_reviewed',
      'in_review',
      'memory_based',
      'ai_practice'
    )
  )
  not valid;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'pyq_source_verification_check'
      and conrelid = 'public.pyq_questions'::regclass
  ) then
    alter table public.pyq_questions
      drop constraint pyq_source_verification_check;
  end if;
end $$;

alter table public.pyq_questions
  add constraint pyq_source_verification_check
  check (
    (
      source = 'verified_pyq'
      and is_verified = true
      and verification_status = 'official_verified'
      and exam_id is not null
      and year is not null
      and subject_id is not null
      and chapter_id is not null
      and length(btrim(question)) > 0
      and length(btrim(coalesce(answer, ''))) > 0
      and length(btrim(coalesce(source_reference, ''))) > 0
    )
    or
    (
      source = 'trusted_third_party'
      and is_verified = false
      and verification_status in ('third_party_reviewed', 'in_review')
      and length(btrim(coalesce(source_reference, ''))) > 0
      and length(btrim(coalesce(source_name, ''))) > 0
    )
    or
    (
      source = 'memory_based'
      and is_verified = false
      and verification_status = 'memory_based'
      and length(btrim(coalesce(source_reference, ''))) > 0
    )
    or
    (
      source = 'ai_generated'
      and is_verified = false
      and verification_status = 'ai_practice'
    )
  )
  not valid;
