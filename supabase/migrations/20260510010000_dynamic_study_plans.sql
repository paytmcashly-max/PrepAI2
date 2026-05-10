create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists full_name text,
  add column if not exists exam_target text,
  add column if not exists daily_study_hours integer not null default 3,
  add column if not exists start_date date,
  add column if not exists target_days integer not null default 90,
  add column if not exists maths_level text not null default 'average' check (maths_level in ('weak', 'average', 'good')),
  add column if not exists physical_level text not null default 'average' check (physical_level in ('weak', 'average', 'good')),
  add column if not exists english_background boolean not null default false,
  add column if not exists current_education text,
  add column if not exists onboarding_completed boolean not null default false;

update public.profiles
set start_date = coalesce(start_date, current_date)
where start_date is null;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'first_name'
  ) then
    execute $sql$
      update public.profiles
      set full_name = coalesce(full_name, nullif(trim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')), ''))
      where full_name is null
    $sql$;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'exam_type'
  ) then
    execute $sql$
      update public.profiles
      set
        exam_target = coalesce(exam_target, exam_type),
        onboarding_completed = coalesce(onboarding_completed, exam_type is not null)
      where exam_target is null or onboarding_completed is false
    $sql$;
  end if;
end $$;

alter table public.exams
  alter column focus set default '{}',
  alter column selection_stages set default '{}';

alter table public.chapters
  add column if not exists exam_id text references public.exams(id) on delete cascade,
  add column if not exists priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  add column if not exists difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  add column if not exists estimated_minutes integer not null default 45;

create table if not exists public.task_templates (
  id uuid primary key default gen_random_uuid(),
  exam_id text references public.exams(id) on delete cascade,
  subject_id text references public.subjects(id) on delete cascade,
  task_type text not null check (task_type in ('concept', 'practice', 'revision', 'mock', 'physical', 'pyq', 'notes')),
  title_template text not null,
  description_template text,
  estimated_minutes integer not null default 30,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  created_at timestamptz not null default now()
);

create table if not exists public.revision_rules (
  id uuid primary key default gen_random_uuid(),
  exam_id text references public.exams(id) on delete cascade,
  frequency text not null default 'weekly',
  rule_config jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.mock_rules (
  id uuid primary key default gen_random_uuid(),
  exam_id text references public.exams(id) on delete cascade,
  start_after_phase text not null default 'foundation',
  frequency_days integer not null default 7,
  mock_type text not null default 'sectional',
  created_at timestamptz not null default now()
);

create table if not exists public.physical_rules (
  id uuid primary key default gen_random_uuid(),
  exam_id text references public.exams(id) on delete cascade,
  level text not null check (level in ('weak', 'average', 'good')),
  rule_config jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.user_study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exam_id text not null references public.exams(id) on delete restrict,
  target_days integer not null check (target_days > 0),
  daily_study_hours integer not null check (daily_study_hours > 0),
  start_date date not null,
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'archived')),
  created_at timestamptz not null default now()
);

create table if not exists public.user_daily_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.user_study_plans(id) on delete cascade,
  day_number integer not null check (day_number > 0),
  task_date date not null,
  exam_id text not null references public.exams(id) on delete restrict,
  subject_id text references public.subjects(id) on delete set null,
  chapter_id text references public.chapters(id) on delete set null,
  title text not null,
  description text,
  task_type text not null check (task_type in ('concept', 'practice', 'revision', 'mock', 'physical', 'pyq', 'notes')),
  estimated_minutes integer not null default 30,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  how_to_study jsonb not null default '[]',
  status text not null default 'pending' check (status in ('pending', 'completed', 'skipped')),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.mock_tests
  alter column id drop default,
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists test_date date,
  add column if not exists total_marks integer,
  add column if not exists marks_obtained integer,
  add column if not exists weak_areas jsonb not null default '[]',
  add column if not exists mistakes text,
  add column if not exists notes text;

alter table public.mock_test_attempts
  add column if not exists test_date date not null default current_date,
  add column if not exists total_marks integer,
  add column if not exists marks_obtained integer,
  add column if not exists status text not null default 'completed',
  add column if not exists weak_areas text[] not null default '{}',
  add column if not exists mistakes text,
  add column if not exists notes text,
  add column if not exists started_at timestamptz not null default now(),
  add column if not exists completed_at timestamptz,
  add column if not exists created_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'mock_test_attempts' and column_name = 'attempted_at'
  ) then
    execute $sql$
      update public.mock_test_attempts
      set
        test_date = coalesce(test_date, attempted_at::date, current_date),
        completed_at = coalesce(completed_at, attempted_at),
        created_at = coalesce(created_at, attempted_at, now())
      where attempted_at is not null
    $sql$;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'mock_test_attempts' and column_name = 'score'
  ) then
    execute $sql$
      update public.mock_test_attempts
      set marks_obtained = coalesce(marks_obtained, score)
    $sql$;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'mock_test_attempts' and column_name = 'total_questions'
  ) then
    execute $sql$
      update public.mock_test_attempts
      set total_marks = coalesce(total_marks, total_questions)
    $sql$;
  end if;
end $$;

alter table public.notes
  add column if not exists chapter_id text references public.chapters(id) on delete set null;

alter table public.pyq_questions
  add column if not exists chapter_id text references public.chapters(id) on delete set null;

create index if not exists chapters_exam_id_idx on public.chapters(exam_id);
create index if not exists user_study_plans_user_id_idx on public.user_study_plans(user_id);
create index if not exists user_daily_tasks_user_plan_day_idx on public.user_daily_tasks(user_id, plan_id, day_number);
create index if not exists user_daily_tasks_user_date_idx on public.user_daily_tasks(user_id, task_date);
create index if not exists user_daily_tasks_subject_idx on public.user_daily_tasks(subject_id);

alter table public.task_templates enable row level security;
alter table public.revision_rules enable row level security;
alter table public.mock_rules enable row level security;
alter table public.physical_rules enable row level security;
alter table public.user_study_plans enable row level security;
alter table public.user_daily_tasks enable row level security;

drop policy if exists "Public read exams" on public.exams;
drop policy if exists "Authenticated read exams" on public.exams;
create policy "Authenticated read exams" on public.exams
  for select to authenticated using (true);

drop policy if exists "Public read subjects" on public.subjects;
drop policy if exists "Authenticated read subjects" on public.subjects;
create policy "Authenticated read subjects" on public.subjects
  for select to authenticated using (true);

drop policy if exists "Public read chapters" on public.chapters;
drop policy if exists "Authenticated read chapters" on public.chapters;
create policy "Authenticated read chapters" on public.chapters
  for select to authenticated using (true);

drop policy if exists "Public read motivational quotes" on public.motivational_quotes;
drop policy if exists "Authenticated read motivational quotes" on public.motivational_quotes;
create policy "Authenticated read motivational quotes" on public.motivational_quotes
  for select to authenticated using (true);

drop policy if exists "Authenticated read task templates" on public.task_templates;
create policy "Authenticated read task templates" on public.task_templates
  for select to authenticated using (true);

drop policy if exists "Authenticated read revision rules" on public.revision_rules;
create policy "Authenticated read revision rules" on public.revision_rules
  for select to authenticated using (true);

drop policy if exists "Authenticated read mock rules" on public.mock_rules;
create policy "Authenticated read mock rules" on public.mock_rules
  for select to authenticated using (true);

drop policy if exists "Authenticated read physical rules" on public.physical_rules;
create policy "Authenticated read physical rules" on public.physical_rules
  for select to authenticated using (true);

drop policy if exists "Users manage own study plans" on public.user_study_plans;
create policy "Users manage own study plans" on public.user_study_plans
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own daily tasks" on public.user_daily_tasks;
create policy "Users manage own daily tasks" on public.user_daily_tasks
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Public read mock tests" on public.mock_tests;
drop policy if exists "Authenticated read global and own mock tests" on public.mock_tests;
create policy "Authenticated read global and own mock tests" on public.mock_tests
  for select to authenticated using (user_id is null or auth.uid() = user_id);

drop policy if exists "Users manage own mock tests" on public.mock_tests;
create policy "Users manage own mock tests" on public.mock_tests
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Public read mock test questions" on public.mock_test_questions;
drop policy if exists "Authenticated read mock test questions" on public.mock_test_questions;
create policy "Authenticated read mock test questions" on public.mock_test_questions
  for select to authenticated using (true);

drop policy if exists "Authenticated read pyq questions" on public.pyq_questions;
create policy "Authenticated read pyq questions" on public.pyq_questions
  for select to authenticated using (true);

drop policy if exists "Public read pyq questions" on public.pyq_questions;

insert into public.exams (id, name, level, focus, selection_stages)
values
  ('bihar-si', 'Bihar Police SI', 'State Police', array['GK/GS', 'Hindi', 'Maths', 'Reasoning', 'Physical'], array['Prelims', 'Mains', 'Physical Test']),
  ('up-police', 'UP Police', 'State Police', array['GK/GS', 'Hindi', 'Maths', 'Reasoning', 'Physical'], array['Written Exam', 'Document Verification', 'Physical Test']),
  ('ssc-gd', 'SSC GD', 'Matriculation', array['General Intelligence', 'General Knowledge', 'Elementary Maths', 'Hindi/English'], array['Computer Based Exam', 'Physical Efficiency Test', 'Medical']),
  ('ssc-cgl', 'SSC CGL', 'Graduate', array['Maths', 'English', 'Reasoning', 'General Awareness', 'Computer'], array['Tier 1', 'Tier 2', 'Document Verification'])
on conflict (id) do update set
  name = excluded.name,
  level = excluded.level,
  focus = excluded.focus,
  selection_stages = excluded.selection_stages;

insert into public.subjects (id, name, icon, color)
values
  ('maths', 'Maths', 'Calculator', '#2563EB'),
  ('gk-gs', 'GK / GS', 'Globe2', '#059669'),
  ('hindi', 'Hindi', 'Languages', '#DC2626'),
  ('reasoning', 'Reasoning', 'Brain', '#7C3AED'),
  ('physical', 'Physical', 'Dumbbell', '#EA580C'),
  ('english', 'English', 'BookOpen', '#0891B2'),
  ('general-awareness', 'General Awareness', 'Newspaper', '#65A30D'),
  ('computer', 'Computer', 'Monitor', '#4F46E5')
on conflict (id) do update set
  name = excluded.name,
  icon = excluded.icon,
  color = excluded.color;

insert into public.chapters (id, exam_id, subject_id, name, priority, difficulty, estimated_minutes, order_index)
values
  ('bihar-si-maths-percentage', 'bihar-si', 'maths', 'Percentage', 'high', 'medium', 80, 1),
  ('bihar-si-maths-ratio', 'bihar-si', 'maths', 'Ratio and Proportion', 'high', 'medium', 75, 2),
  ('bihar-si-maths-profit-loss', 'bihar-si', 'maths', 'Profit and Loss', 'high', 'medium', 85, 3),
  ('bihar-si-gkgs-history', 'bihar-si', 'gk-gs', 'Modern Indian History', 'high', 'medium', 90, 4),
  ('bihar-si-gkgs-polity', 'bihar-si', 'gk-gs', 'Indian Polity', 'high', 'medium', 90, 5),
  ('bihar-si-hindi-grammar', 'bihar-si', 'hindi', 'Hindi Grammar', 'high', 'medium', 80, 6),
  ('bihar-si-reasoning-series', 'bihar-si', 'reasoning', 'Series and Analogy', 'medium', 'easy', 65, 7),
  ('up-police-gkgs-current', 'up-police', 'gk-gs', 'Current Affairs', 'high', 'medium', 90, 1),
  ('up-police-hindi-grammar', 'up-police', 'hindi', 'Hindi Grammar', 'high', 'medium', 80, 2),
  ('up-police-maths-arithmetic', 'up-police', 'maths', 'Arithmetic Basics', 'high', 'easy', 90, 3),
  ('up-police-reasoning-verbal', 'up-police', 'reasoning', 'Verbal Reasoning', 'medium', 'medium', 70, 4),
  ('ssc-gd-maths-number-system', 'ssc-gd', 'maths', 'Number System', 'high', 'easy', 75, 1),
  ('ssc-gd-reasoning-analogy', 'ssc-gd', 'reasoning', 'Analogy and Classification', 'high', 'easy', 65, 2),
  ('ssc-gd-gkgs-static', 'ssc-gd', 'gk-gs', 'Static GK', 'high', 'medium', 80, 3),
  ('ssc-gd-hindi-english-basics', 'ssc-gd', 'hindi', 'Hindi / English Basics', 'medium', 'easy', 70, 4),
  ('ssc-cgl-maths-algebra', 'ssc-cgl', 'maths', 'Algebra', 'high', 'hard', 100, 1),
  ('ssc-cgl-maths-geometry', 'ssc-cgl', 'maths', 'Geometry', 'high', 'hard', 110, 2),
  ('ssc-cgl-english-grammar', 'ssc-cgl', 'english', 'English Grammar', 'high', 'medium', 90, 3),
  ('ssc-cgl-reasoning-puzzles', 'ssc-cgl', 'reasoning', 'Puzzles and Seating', 'medium', 'medium', 80, 4),
  ('ssc-cgl-ga-polity', 'ssc-cgl', 'general-awareness', 'Indian Polity', 'medium', 'medium', 80, 5),
  ('ssc-cgl-computer-basics', 'ssc-cgl', 'computer', 'Computer Basics', 'low', 'easy', 55, 6)
on conflict (id) do update set
  exam_id = excluded.exam_id,
  subject_id = excluded.subject_id,
  name = excluded.name,
  priority = excluded.priority,
  difficulty = excluded.difficulty,
  estimated_minutes = excluded.estimated_minutes,
  order_index = excluded.order_index;

insert into public.revision_rules (exam_id, frequency, rule_config)
values
  ('bihar-si', 'weekly', '{"revision_day_interval": 7}'),
  ('up-police', 'weekly', '{"revision_day_interval": 7}'),
  ('ssc-gd', 'weekly', '{"revision_day_interval": 7}'),
  ('ssc-cgl', 'weekly', '{"revision_day_interval": 7}')
on conflict do nothing;

insert into public.mock_rules (exam_id, start_after_phase, frequency_days, mock_type)
values
  ('bihar-si', 'foundation', 7, 'sectional'),
  ('up-police', 'foundation', 7, 'sectional'),
  ('ssc-gd', 'foundation', 7, 'sectional'),
  ('ssc-cgl', 'foundation', 7, 'sectional')
on conflict do nothing;

insert into public.physical_rules (exam_id, level, rule_config)
values
  ('bihar-si', 'weak', '{"base_minutes": 20, "weekly_increment": 5}'),
  ('bihar-si', 'average', '{"base_minutes": 30, "weekly_increment": 7}'),
  ('bihar-si', 'good', '{"base_minutes": 40, "weekly_increment": 10}'),
  ('up-police', 'weak', '{"base_minutes": 20, "weekly_increment": 5}'),
  ('up-police', 'average', '{"base_minutes": 30, "weekly_increment": 7}'),
  ('up-police', 'good', '{"base_minutes": 40, "weekly_increment": 10}'),
  ('ssc-gd', 'weak', '{"base_minutes": 20, "weekly_increment": 5}'),
  ('ssc-gd', 'average', '{"base_minutes": 30, "weekly_increment": 7}'),
  ('ssc-gd', 'good', '{"base_minutes": 40, "weekly_increment": 10}')
on conflict do nothing;

insert into public.motivational_quotes (id, quote, author)
values
  ('discipline-1', 'Discipline is choosing your target again when motivation fades.', 'PrepAI'),
  ('progress-1', 'Small daily wins become exam-day confidence.', 'PrepAI'),
  ('revision-1', 'Revision turns effort into recall.', 'PrepAI')
on conflict (id) do update set quote = excluded.quote, author = excluded.author;
