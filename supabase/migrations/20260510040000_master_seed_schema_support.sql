alter table public.exams
  add column if not exists category text,
  add column if not exists primary_language text,
  add column if not exists recommended_for text[] not null default '{}',
  add column if not exists source_notes text;

alter table public.subjects
  add column if not exists order_index integer not null default 0;

create table if not exists public.exam_subjects (
  exam_id text not null references public.exams(id) on delete cascade,
  subject_id text not null references public.subjects(id) on delete cascade,
  weight integer not null default 0,
  is_core boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (exam_id, subject_id)
);

alter table public.chapters
  add column if not exists chapter_key text,
  add column if not exists tags text[] not null default '{}',
  add column if not exists aliases text[] not null default '{}';

create unique index if not exists chapters_chapter_key_unique
  on public.chapters(chapter_key)
  where chapter_key is not null;

alter table public.task_templates
  add column if not exists how_to_study jsonb not null default '[]';

alter table public.mock_rules
  add column if not exists rule_config jsonb not null default '{}';

create table if not exists public.quote_bank (
  id text primary key,
  text text not null,
  category text,
  author text,
  created_at timestamptz not null default now()
);

insert into public.quote_bank (id, text, author)
select id, quote, author
from public.motivational_quotes
on conflict (id) do nothing;

create table if not exists public.planner_rules (
  id text primary key,
  rule_config jsonb not null default '{}',
  source_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.exam_subjects enable row level security;
alter table public.quote_bank enable row level security;
alter table public.planner_rules enable row level security;

drop policy if exists "Authenticated read exam subjects" on public.exam_subjects;
create policy "Authenticated read exam subjects" on public.exam_subjects
  for select to authenticated using (true);

drop policy if exists "Authenticated read quote bank" on public.quote_bank;
create policy "Authenticated read quote bank" on public.quote_bank
  for select to authenticated using (true);

drop policy if exists "Authenticated read planner rules" on public.planner_rules;
create policy "Authenticated read planner rules" on public.planner_rules
  for select to authenticated using (true);

create index if not exists exam_subjects_subject_id_idx on public.exam_subjects(subject_id);
create index if not exists subjects_order_index_idx on public.subjects(order_index);
create index if not exists quote_bank_category_idx on public.quote_bank(category);
