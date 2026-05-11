alter table public.study_resources
  add column if not exists video_search_query text,
  add column if not exists video_status text not null default 'not_curated',
  add column if not exists channel_name text;

do $$
begin
  alter table public.study_resources
    drop constraint if exists study_resources_video_status_check;

  alter table public.study_resources
    add constraint study_resources_video_status_check
    check (video_status in ('not_curated', 'curated', 'unavailable'));
end $$;

update public.study_resources sr
set video_search_query = coalesce(
    sr.video_search_query,
    (
      select concat_ws(' ', e.name, s.name, c.name, 'preparation Hindi')
      from public.exams e
      left join public.subjects s on s.id = sr.subject_id
      left join public.chapters c on c.id = sr.chapter_id
      where e.id = sr.exam_id
    )
  ),
  video_status = case
    when sr.embed_url is not null and sr.embed_url <> '' then 'curated'
    when sr.video_status is null then 'not_curated'
    else sr.video_status
  end;

with selected_chapters as (
  select
    c.id as chapter_id,
    c.exam_id,
    e.name as exam_name,
    c.subject_id,
    s.name as subject_name,
    c.name as chapter_name,
    case
      when c.subject_id = 'physical' then 'physical_training'
      when c.name ilike '%current affairs%' then 'current_affairs'
      else 'concept_note'
    end as resource_type,
    case
      when c.subject_id = 'physical' then 'Warmup, safe pace, mobility, recovery note, and stop-if-pain safety reminder.'
      when c.subject_id = 'gk_gs' then 'Read core facts, make short revision points, and attempt PrepAI Original concept practice.'
      else 'Read concept rules, solve examples, attempt PrepAI Original MCQs, and write mistake notes.'
    end as description,
    case
      when c.subject_id = 'physical' then array['Warmup complete karo', 'Main routine safe pace par karo', 'Stretching aur recovery note likho', 'Pain/dizziness ho to stop karo']
      when c.subject_id = 'gk_gs' then array['Notes read karo', '10 exam points likho', 'Original practice attempt karo', 'Wrong points ko revise list me add karo']
      else array['Concept note read karo', 'Examples solve karo', '10 original MCQs attempt karo', 'Wrong answers ki mistake note banao']
    end as steps
  from public.chapters c
  join public.exams e on e.id = c.exam_id
  join public.subjects s on s.id = c.subject_id
  where c.exam_id in ('bihar_si', 'up_police', 'ssc_gd')
    and (
      (c.subject_id = 'maths' and (
        c.name ilike '%simplification%'
        or c.name ilike '%BODMAS%'
        or c.name ilike '%percentage%'
        or c.name ilike '%ratio%'
        or c.name ilike '%hcf%'
        or c.name ilike '%lcm%'
      ))
      or (c.subject_id = 'reasoning' and (
        c.name ilike '%analogy%'
        or c.name ilike '%analogies%'
        or c.name ilike '%series%'
        or c.name ilike '%classification%'
        or c.name ilike '%coding%'
      ))
      or (c.subject_id = 'hindi' and (
        c.name ilike '%पर्याय%'
        or c.name ilike '%संधि%'
        or c.name ilike '%मुहावरे%'
        or c.name ilike '%शुद्धि%'
      ))
      or (c.subject_id = 'gk_gs' and (
        c.name ilike '%constitution%'
        or c.name ilike '%polity%'
        or c.name ilike '%bihar gk%'
        or c.name ilike '%up gk%'
        or c.name ilike '%history%'
        or c.name ilike '%geography%'
      ))
      or (c.subject_id = 'physical' and (
        c.name ilike '%walking%'
        or c.name ilike '%jogging%'
        or c.name ilike '%mobility%'
        or c.name ilike '%stretching%'
        or c.name ilike '%endurance%'
        or c.name ilike '%stamina%'
        or c.name ilike '%strength%'
      ))
    )
),
resource_rows as (
  select
    concat('res-auto-', regexp_replace(lower(exam_id), '[^a-z0-9]+', '-', 'g'), '-', regexp_replace(lower(chapter_id), '[^a-z0-9]+', '-', 'g')) as id,
    exam_id,
    subject_id,
    chapter_id,
    concat(chapter_name, ' - PrepAI Original Notes') as title,
    concat(exam_name, ' ', subject_name, ' ke liye PrepAI original notes, how-to-study steps, and original practice.') as description,
    resource_type,
    'PrepAI Original' as source_name,
    null::text as source_url,
    null::text as embed_url,
    'youtube' as video_provider,
    null::text as video_id,
    concat_ws(' ', exam_name, subject_name, chapter_name, 'preparation Hindi') as video_search_query,
    'not_curated' as video_status,
    null::text as channel_name,
    'hindi' as language,
    'prepai_original' as trust_level,
    concat(
      '# ', chapter_name, E'\n\n',
      '## PrepAI Original Notes', E'\n\n',
      description, E'\n\n',
      '- Definition/rule ko apni language me likho.', E'\n',
      '- 3 examples solve karo aur pattern identify karo.', E'\n',
      '- PrepAI Original MCQs attempt karo.', E'\n',
      '- Wrong answers ko mistake note me convert karo.', E'\n\n',
      case
        when subject_id = 'physical' then 'Safety: pain, dizziness, ya unusual breathlessness ho to stop karo. PrepAI medical advice nahi deta.'
        when resource_type = 'current_affairs' then 'Yeh study-method resource hai. Latest factual practice sirf verified/source-based monthly content ke saath add hoga.'
        else 'Exam approach: question dekhte hi topic, rule, aur trap identify karo.'
      end
    ) as content_md,
    steps as how_to_study,
    130 as priority,
    true as is_active
  from selected_chapters
)
insert into public.study_resources (
  id, exam_id, subject_id, chapter_id, title, description, resource_type, source_name,
  source_url, embed_url, video_provider, video_id, video_search_query, video_status, channel_name,
  language, trust_level, content_md, how_to_study, priority, is_active
)
select
  id, exam_id, subject_id, chapter_id, title, description, resource_type, source_name,
  source_url, embed_url, video_provider, video_id, video_search_query, video_status, channel_name,
  language, trust_level, content_md, how_to_study, priority, is_active
from resource_rows
on conflict (id) do update set
  video_search_query = coalesce(public.study_resources.video_search_query, excluded.video_search_query),
  video_status = case
    when public.study_resources.embed_url is not null and public.study_resources.embed_url <> '' then 'curated'
    else coalesce(public.study_resources.video_status, excluded.video_status)
  end,
  updated_at = now();

with selected_chapters as (
  select
    c.id as chapter_id,
    c.exam_id,
    e.name as exam_name,
    c.subject_id,
    s.name as subject_name,
    c.name as chapter_name
  from public.chapters c
  join public.exams e on e.id = c.exam_id
  join public.subjects s on s.id = c.subject_id
  where c.exam_id in ('bihar_si', 'up_police', 'ssc_gd')
    and exists (
      select 1
      from public.study_resources sr
      where sr.exam_id = c.exam_id
        and sr.subject_id = c.subject_id
        and sr.chapter_id = c.id
        and sr.is_active = true
    )
    and not exists (
      select 1
      from public.original_practice_questions opq
      where opq.exam_id = c.exam_id
        and opq.subject_id = c.subject_id
        and opq.chapter_id = c.id
        and opq.is_active = true
    )
),
numbers(n) as (
  values (1),(2),(3),(4),(5),(6),(7),(8),(9),(10)
),
question_rows as (
  select
    concat('opq-auto-', regexp_replace(lower(sc.exam_id), '[^a-z0-9]+', '-', 'g'), '-', regexp_replace(lower(sc.chapter_id), '[^a-z0-9]+', '-', 'g'), '-', lpad(n.n::text, 2, '0')) as id,
    sc.exam_id,
    sc.subject_id,
    sc.chapter_id,
    case
      when sc.subject_id = 'physical' then concat(sc.chapter_name, ': safe practice ke liye session ki shuruaat kis cheez se karni chahiye? (', n.n, ')')
      else concat(sc.chapter_name, ': exam question solve karte waqt sabse pehle kya identify karna chahiye? (', n.n, ')')
    end as question,
    case
      when sc.subject_id = 'physical' then '["Light warmup","Direct sprint","Pain ignore karna","Cooldown skip karna"]'::jsonb
      else '["Topic rule/pattern","Random guess","Options ignore karna","Question skip karna"]'::jsonb
    end as options,
    case
      when sc.subject_id = 'physical' then 'Light warmup'
      else 'Topic rule/pattern'
    end as answer,
    case
      when sc.subject_id = 'physical' then 'Warmup body ko session ke liye ready karta hai. Safety first; pain ya dizziness ho to stop karo.'
      else concat(sc.subject_name, ' me ', sc.chapter_name, ' questions ke liye pehle rule/pattern identify karna accuracy badhata hai.')
    end as explanation,
    case when n.n <= 6 then 'easy' else 'medium' end as difficulty,
    'concept_practice' as practice_category,
    'hindi' as language,
    'prepai_original' as source_type,
    'PrepAI Original Practice - Not Official PYQ' as exam_pattern_note,
    true as is_active
  from selected_chapters sc
  cross join numbers n
)
insert into public.original_practice_questions (
  id, exam_id, subject_id, chapter_id, question, options, answer, explanation,
  difficulty, practice_category, language, source_type, exam_pattern_note, is_active
)
select
  id, exam_id, subject_id, chapter_id, question, options, answer, explanation,
  difficulty, practice_category, language, source_type, exam_pattern_note, is_active
from question_rows
on conflict (id) do update set
  question = excluded.question,
  options = excluded.options,
  answer = excluded.answer,
  explanation = excluded.explanation,
  difficulty = excluded.difficulty,
  practice_category = excluded.practice_category,
  updated_at = now();
