-- Post-cleanup verification report for supported exam refocus.
-- Supported exams: bihar_si, up_police, ssc_gd.

select 'exams' as section, id as group_key, count(*) as count
from public.exams
group by id
order by id;

select 'unsupported_exams' as section, coalesce(id, 'none') as group_key, count(*) as count
from public.exams
where id not in ('bihar_si', 'up_police', 'ssc_gd')
group by id;

select 'chapters_by_exam' as section, exam_id as group_key, count(*) as count
from public.chapters
group by exam_id
order by exam_id;

select 'resources_by_exam' as section, coalesce(exam_id, 'global') || ' | ' || resource_type as group_key, count(*) as count
from public.study_resources
group by exam_id, resource_type
order by group_key;

select 'original_practice_by_exam' as section, exam_id || ' | ' || practice_category || ' | ' || source_type as group_key, count(*) as count
from public.original_practice_questions
group by exam_id, practice_category, source_type
order by group_key;

select 'weak_generic_original_questions' as section, 'remaining' as group_key, count(*) as count
from public.original_practice_questions
where source_type = 'prepai_original'
  and (
    question ilike '%sabse pehle kya identify%'
    or question ilike '%exam question solve karte waqt%'
    or answer = 'Topic rule/pattern'
    or options = '["Topic rule/pattern", "Random guess", "Options ignore karna", "Question skip karna"]'::jsonb
    or options @> '["Topic rule/pattern", "Random guess", "Options ignore karna", "Question skip karna"]'::jsonb
  );

select 'pyq_by_exam_source_status' as section, exam_id || ' | ' || source || ' | ' || verification_status || ' | verified=' || is_verified as group_key, count(*) as count
from public.pyq_questions
group by exam_id, source, verification_status, is_verified
order by group_key;

select 'mock_tests_by_exam' as section, coalesce(exam_id, 'global') as group_key, count(*) as count
from public.mock_tests
group by exam_id
order by group_key;

select 'user_study_plans_by_exam_status' as section, exam_id || ' | ' || status as group_key, count(*) as count
from public.user_study_plans
group by exam_id, status
order by group_key;

select 'user_daily_tasks_by_exam_status' as section, exam_id || ' | ' || status as group_key, count(*) as count
from public.user_daily_tasks
group by exam_id, status
order by group_key;
