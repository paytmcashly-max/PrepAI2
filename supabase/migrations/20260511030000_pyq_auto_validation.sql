alter table public.pyq_questions
  add column if not exists auto_review_score integer,
  add column if not exists auto_review_flags text[] not null default '{}',
  add column if not exists auto_reviewed_at timestamptz,
  add column if not exists auto_rejection_reason text;

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
      'system_validated',
      'needs_manual_review',
      'third_party_reviewed',
      'in_review',
      'memory_based',
      'ai_practice',
      'auto_rejected'
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
      and verification_status in (
        'system_validated',
        'needs_manual_review',
        'third_party_reviewed',
        'in_review',
        'auto_rejected'
      )
      and (
        verification_status in ('needs_manual_review', 'auto_rejected')
        or (
          length(btrim(coalesce(source_reference, ''))) > 0
          and length(btrim(coalesce(source_name, ''))) > 0
        )
      )
    )
    or
    (
      source = 'memory_based'
      and is_verified = false
      and verification_status in ('memory_based', 'needs_manual_review', 'auto_rejected')
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
