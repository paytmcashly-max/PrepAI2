alter table public.pyq_questions
  add column if not exists review_note text,
  add column if not exists updated_by text,
  add column if not exists updated_at timestamptz;

update public.pyq_questions
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;
