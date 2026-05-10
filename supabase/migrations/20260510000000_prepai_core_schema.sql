create extension if not exists pgcrypto;

create table if not exists public.exams (
  id text primary key,
  name text not null,
  level text,
  focus text[] not null default '{}',
  selection_stages text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id text primary key,
  name text not null,
  icon text,
  color text,
  created_at timestamptz not null default now()
);

create table if not exists public.chapters (
  id text primary key,
  subject_id text references public.subjects(id) on delete cascade,
  name text not null,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.roadmap_phases (
  id text primary key,
  name text not null,
  start_day integer not null,
  end_day integer not null,
  goal text,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_plans (
  id text primary key,
  day integer not null unique,
  phase_id text references public.roadmap_phases(id) on delete set null,
  is_revision_day boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_tasks (
  id text primary key,
  daily_plan_id text not null references public.daily_plans(id) on delete cascade,
  subject_id text references public.subjects(id) on delete set null,
  title text not null,
  chapter text,
  task text,
  how_to_study text[] not null default '{}',
  estimated_minutes integer not null default 30,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  exam_target text,
  daily_study_hours integer not null default 3,
  start_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.task_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  daily_task_id text not null references public.daily_tasks(id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, daily_task_id)
);

create table if not exists public.mock_tests (
  id text primary key,
  exam_id text references public.exams(id) on delete set null,
  title text not null,
  description text,
  total_questions integer not null default 0,
  duration_minutes integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.mock_test_questions (
  id text primary key,
  mock_test_id text not null references public.mock_tests(id) on delete cascade,
  subject_id text references public.subjects(id) on delete set null,
  question text not null,
  options text[] not null default '{}',
  correct_answer text not null,
  explanation text,
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.mock_test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mock_test_id text not null references public.mock_tests(id) on delete cascade,
  test_date date not null default current_date,
  total_marks integer,
  marks_obtained integer,
  correct_answers integer not null default 0,
  wrong_answers integer not null default 0,
  unanswered integer not null default 0,
  time_taken_seconds integer,
  answers jsonb not null default '{}',
  weak_areas text[] not null default '{}',
  mistakes text,
  notes text,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  subject_id text references public.subjects(id) on delete set null,
  chapter text,
  content text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pyq_questions (
  id text primary key,
  exam_id text references public.exams(id) on delete set null,
  year integer not null,
  subject_id text references public.subjects(id) on delete set null,
  chapter text,
  topic text,
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  question text not null,
  options text[] not null default '{}',
  answer text,
  explanation text,
  source text,
  is_verified boolean not null default false,
  frequency integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.motivational_quotes (
  id text primary key,
  quote text not null,
  author text,
  created_at timestamptz not null default now()
);

create index if not exists chapters_subject_id_idx on public.chapters(subject_id);
create index if not exists daily_tasks_daily_plan_id_idx on public.daily_tasks(daily_plan_id);
create index if not exists task_completions_user_id_idx on public.task_completions(user_id);
create index if not exists mock_test_attempts_user_id_idx on public.mock_test_attempts(user_id);
create index if not exists notes_user_id_idx on public.notes(user_id);
create index if not exists pyq_questions_subject_id_idx on public.pyq_questions(subject_id);

alter table public.exams enable row level security;
alter table public.subjects enable row level security;
alter table public.chapters enable row level security;
alter table public.roadmap_phases enable row level security;
alter table public.daily_plans enable row level security;
alter table public.daily_tasks enable row level security;
alter table public.profiles enable row level security;
alter table public.task_completions enable row level security;
alter table public.mock_tests enable row level security;
alter table public.mock_test_questions enable row level security;
alter table public.mock_test_attempts enable row level security;
alter table public.notes enable row level security;
alter table public.pyq_questions enable row level security;
alter table public.motivational_quotes enable row level security;

drop policy if exists "Public read exams" on public.exams;
create policy "Public read exams" on public.exams for select using (true);

drop policy if exists "Public read subjects" on public.subjects;
create policy "Public read subjects" on public.subjects for select using (true);

drop policy if exists "Public read chapters" on public.chapters;
create policy "Public read chapters" on public.chapters for select using (true);

drop policy if exists "Public read roadmap phases" on public.roadmap_phases;
create policy "Public read roadmap phases" on public.roadmap_phases for select using (true);

drop policy if exists "Public read daily plans" on public.daily_plans;
create policy "Public read daily plans" on public.daily_plans for select using (true);

drop policy if exists "Public read daily tasks" on public.daily_tasks;
create policy "Public read daily tasks" on public.daily_tasks for select using (true);

drop policy if exists "Public read mock tests" on public.mock_tests;
create policy "Public read mock tests" on public.mock_tests for select using (true);

drop policy if exists "Public read mock test questions" on public.mock_test_questions;
create policy "Public read mock test questions" on public.mock_test_questions for select using (true);

drop policy if exists "Public read pyq questions" on public.pyq_questions;
create policy "Public read pyq questions" on public.pyq_questions for select using (true);

drop policy if exists "Public read motivational quotes" on public.motivational_quotes;
create policy "Public read motivational quotes" on public.motivational_quotes for select using (true);

drop policy if exists "Users manage own profile" on public.profiles;
create policy "Users manage own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users manage own task completions" on public.task_completions;
create policy "Users manage own task completions" on public.task_completions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own mock attempts" on public.mock_test_attempts;
create policy "Users manage own mock attempts" on public.mock_test_attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own notes" on public.notes;
create policy "Users manage own notes" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
