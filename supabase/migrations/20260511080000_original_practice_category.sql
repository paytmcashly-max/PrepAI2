alter table public.original_practice_questions
  add column if not exists practice_category text not null default 'concept_practice';

do $$
begin
  alter table public.original_practice_questions
    drop constraint if exists original_practice_questions_practice_category_check;

  alter table public.original_practice_questions
    add constraint original_practice_questions_practice_category_check
    check (practice_category in ('study_method', 'fact_practice', 'concept_practice'));
end $$;

update public.original_practice_questions
set practice_category = 'study_method'
where subject_id in ('gk_gs', 'general_awareness')
  and (
    id like 'opq-%current_affairs-%'
    or chapter_id in (
      select id
      from public.chapters
      where name ilike '%current affairs%'
    )
  );

update public.original_practice_questions
set practice_category = 'concept_practice'
where practice_category is null
   or practice_category not in ('study_method', 'fact_practice', 'concept_practice');
