alter table public.pyq_questions
  add column if not exists source_reference text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'pyq_questions_source_check'
      and conrelid = 'public.pyq_questions'::regclass
  ) then
    alter table public.pyq_questions
      add constraint pyq_questions_source_check
      check (source in ('ai_generated', 'verified_pyq'))
      not valid;
  end if;
end $$;

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
      source = 'ai_generated'
      and is_verified = false
    )
  )
  not valid;
