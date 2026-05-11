create table if not exists public.user_pyq_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pyq_question_id text not null references public.pyq_questions(id) on delete cascade,
  selected_answer text,
  is_correct boolean,
  marked_for_revision boolean not null default false,
  mistake_note text,
  attempted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, pyq_question_id)
);

create index if not exists idx_user_pyq_attempts_user_id
  on public.user_pyq_attempts(user_id);

create index if not exists idx_user_pyq_attempts_pyq_question_id
  on public.user_pyq_attempts(pyq_question_id);

create index if not exists idx_user_pyq_attempts_user_attempted_at
  on public.user_pyq_attempts(user_id, attempted_at desc);

create index if not exists idx_user_pyq_attempts_user_is_correct
  on public.user_pyq_attempts(user_id, is_correct);

create index if not exists idx_user_pyq_attempts_user_marked_revision
  on public.user_pyq_attempts(user_id, marked_for_revision);

alter table public.user_pyq_attempts enable row level security;

drop policy if exists "Users can read own PYQ attempts" on public.user_pyq_attempts;
create policy "Users can read own PYQ attempts"
  on public.user_pyq_attempts
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own PYQ attempts" on public.user_pyq_attempts;
create policy "Users can insert own PYQ attempts"
  on public.user_pyq_attempts
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own PYQ attempts" on public.user_pyq_attempts;
create policy "Users can update own PYQ attempts"
  on public.user_pyq_attempts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own PYQ attempts" on public.user_pyq_attempts;
create policy "Users can delete own PYQ attempts"
  on public.user_pyq_attempts
  for delete
  using (auth.uid() = user_id);
