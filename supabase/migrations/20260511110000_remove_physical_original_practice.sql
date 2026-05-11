do $$
begin
  if to_regclass('public.original_practice_attempts') is not null
     and to_regclass('public.original_practice_questions') is not null then
    delete from public.original_practice_attempts
    where question_id::text in (
      select id::text
      from public.original_practice_questions
      where source_type = 'prepai_original'
        and subject_id = 'physical'
    );
  end if;

  if to_regclass('public.original_practice_questions') is not null then
    delete from public.original_practice_questions
    where source_type = 'prepai_original'
      and subject_id = 'physical';
  end if;

  if to_regclass('public.original_practice_questions') is not null
     and exists (
       select 1
       from public.original_practice_questions
       where source_type = 'prepai_original'
         and subject_id = 'physical'
     ) then
    raise exception 'Legacy physical PrepAI Original practice questions remain after cleanup.';
  end if;
end $$;
