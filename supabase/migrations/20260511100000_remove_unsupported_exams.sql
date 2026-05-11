do $$
declare
  supported_exam_ids text[] := array['bihar_si', 'up_police', 'ssc_gd'];
begin
  update public.profiles
  set
    exam_target = null,
    onboarding_completed = false
  where exam_target is not null
    and exam_target <> all(supported_exam_ids);

  if to_regclass('public.original_practice_attempts') is not null
     and to_regclass('public.original_practice_questions') is not null then
    delete from public.original_practice_attempts
    where question_id::text in (
      select id::text
      from public.original_practice_questions
      where source_type = 'prepai_original'
        and exam_id = any(supported_exam_ids)
        and (
          question ilike '%sabse pehle kya identify%'
          or question ilike '%exam question solve karte waqt%'
          or answer = 'Topic rule/pattern'
          or options = '["Topic rule/pattern", "Random guess", "Options ignore karna", "Question skip karna"]'::jsonb
          or options @> '["Topic rule/pattern", "Random guess", "Options ignore karna", "Question skip karna"]'::jsonb
        )
    );
  end if;

  if to_regclass('public.original_practice_questions') is not null then
    delete from public.original_practice_questions
    where source_type = 'prepai_original'
      and exam_id = any(supported_exam_ids)
      and (
        question ilike '%sabse pehle kya identify%'
        or question ilike '%exam question solve karte waqt%'
        or answer = 'Topic rule/pattern'
        or options = '["Topic rule/pattern", "Random guess", "Options ignore karna", "Question skip karna"]'::jsonb
        or options @> '["Topic rule/pattern", "Random guess", "Options ignore karna", "Question skip karna"]'::jsonb
      );
  end if;

  if to_regclass('public.user_daily_tasks') is not null then
    delete from public.user_daily_tasks
    where exam_id is not null
      and exam_id <> all(supported_exam_ids);
  end if;

  if to_regclass('public.user_study_plans') is not null then
    delete from public.user_study_plans
    where exam_id is not null
      and exam_id <> all(supported_exam_ids);
  end if;

  if to_regclass('public.notes') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public'
         and table_name = 'notes'
         and column_name = 'exam_id'
     ) then
    execute 'delete from public.notes where exam_id is not null and exam_id <> all($1)'
    using supported_exam_ids;
  end if;

  if to_regclass('public.mock_test_attempts') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public'
         and table_name = 'mock_test_attempts'
         and column_name = 'mock_test_id'
     )
     and to_regclass('public.mock_tests') is not null then
    execute $sql$
      delete from public.mock_test_attempts
      where mock_test_id::text in (
        select id::text from public.mock_tests
        where exam_id is not null and exam_id <> all($1)
      )
    $sql$
    using supported_exam_ids;
  end if;

  if to_regclass('public.mock_test_questions') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public'
         and table_name = 'mock_test_questions'
         and column_name = 'mock_test_id'
     )
     and to_regclass('public.mock_tests') is not null then
    execute $sql$
      delete from public.mock_test_questions
      where mock_test_id::text in (
        select id::text from public.mock_tests
        where exam_id is not null and exam_id <> all($1)
      )
    $sql$
    using supported_exam_ids;
  end if;

  if to_regclass('public.mock_test_questions') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public'
         and table_name = 'mock_test_questions'
         and column_name = 'exam_id'
     ) then
    execute 'delete from public.mock_test_questions where exam_id is not null and exam_id <> all($1)'
    using supported_exam_ids;
  end if;

  if to_regclass('public.mock_tests') is not null then
    delete from public.mock_tests
    where exam_id is not null
      and exam_id <> all(supported_exam_ids);
  end if;

  if to_regclass('public.original_practice_attempts') is not null
     and to_regclass('public.original_practice_questions') is not null then
    delete from public.original_practice_attempts
    where question_id::text in (
      select id::text from public.original_practice_questions
      where exam_id is not null and exam_id <> all(supported_exam_ids)
    );
  end if;

  if to_regclass('public.original_practice_questions') is not null then
    delete from public.original_practice_questions
    where exam_id is not null
      and exam_id <> all(supported_exam_ids);
  end if;

  if to_regclass('public.study_resources') is not null then
    delete from public.study_resources
    where exam_id is not null
      and exam_id <> all(supported_exam_ids);
  end if;

  if to_regclass('public.resource_generation_jobs') is not null then
    delete from public.resource_generation_jobs
    where exam_id is not null
      and exam_id <> all(supported_exam_ids);
  end if;

  if to_regclass('public.user_pyq_attempts') is not null
     and to_regclass('public.pyq_questions') is not null then
    delete from public.user_pyq_attempts
    where pyq_question_id::text in (
      select id::text from public.pyq_questions
      where exam_id is not null and exam_id <> all(supported_exam_ids)
    );
  end if;

  if to_regclass('public.pyq_questions') is not null then
    delete from public.pyq_questions
    where exam_id is not null
      and exam_id <> all(supported_exam_ids);
  end if;

  if to_regclass('public.chapters') is not null then
    delete from public.chapters
    where exam_id is not null
      and exam_id <> all(supported_exam_ids);
  end if;

  if to_regclass('public.exam_subjects') is not null then
    delete from public.exam_subjects
    where exam_id is not null
      and exam_id <> all(supported_exam_ids);
  end if;

  if to_regclass('public.task_templates') is not null then
    delete from public.task_templates
    where exam_id is not null
      and exam_id <> all(supported_exam_ids);
  end if;

  if to_regclass('public.revision_rules') is not null then
    delete from public.revision_rules
    where exam_id is not null
      and exam_id <> all(supported_exam_ids);
  end if;

  if to_regclass('public.mock_rules') is not null then
    delete from public.mock_rules
    where exam_id is not null
      and exam_id <> all(supported_exam_ids);
  end if;

  if to_regclass('public.physical_rules') is not null then
    delete from public.physical_rules
    where exam_id is not null
      and exam_id <> all(supported_exam_ids);
  end if;

  if to_regclass('public.planner_rules') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public'
         and table_name = 'planner_rules'
         and column_name = 'exam_id'
     ) then
    execute 'delete from public.planner_rules where exam_id is not null and exam_id <> all($1)'
    using supported_exam_ids;
  end if;

  if to_regclass('public.official_pyq_sources') is not null then
    delete from public.official_pyq_sources
    where exam_id is not null
      and exam_id <> all(supported_exam_ids);
  end if;

  if to_regclass('public.exam_content_packs') is not null then
    delete from public.exam_content_packs
    where exam_id is not null
      and exam_id <> all(supported_exam_ids);
  end if;

  delete from public.exams
  where id <> all(supported_exam_ids);

  if exists (select 1 from public.exams where id <> all(supported_exam_ids)) then
    raise exception 'Unsupported exams remain after cleanup.';
  end if;

  if exists (select 1 from public.chapters where exam_id <> all(supported_exam_ids)) then
    raise exception 'Unsupported chapters remain after cleanup.';
  end if;

  if to_regclass('public.study_resources') is not null
     and exists (select 1 from public.study_resources where exam_id is not null and exam_id <> all(supported_exam_ids)) then
    raise exception 'Unsupported study resources remain after cleanup.';
  end if;

  if to_regclass('public.original_practice_questions') is not null
     and exists (select 1 from public.original_practice_questions where exam_id <> all(supported_exam_ids)) then
    raise exception 'Unsupported original practice questions remain after cleanup.';
  end if;

  if to_regclass('public.pyq_questions') is not null
     and exists (select 1 from public.pyq_questions where exam_id <> all(supported_exam_ids)) then
    raise exception 'Unsupported PYQ questions remain after cleanup.';
  end if;

  if to_regclass('public.original_practice_questions') is not null
     and exists (
       select 1
       from public.original_practice_questions
       where source_type = 'prepai_original'
         and exam_id = any(supported_exam_ids)
         and (
           question ilike '%sabse pehle kya identify%'
           or question ilike '%exam question solve karte waqt%'
           or answer = 'Topic rule/pattern'
           or options = '["Topic rule/pattern", "Random guess", "Options ignore karna", "Question skip karna"]'::jsonb
           or options @> '["Topic rule/pattern", "Random guess", "Options ignore karna", "Question skip karna"]'::jsonb
         )
     ) then
    raise exception 'Weak generic PrepAI original questions remain after cleanup.';
  end if;
end $$;
