create table if not exists public.study_resources (
  id text primary key,
  exam_id text references public.exams(id) on delete cascade,
  subject_id text references public.subjects(id) on delete cascade,
  chapter_id text references public.chapters(id) on delete cascade,
  title text not null,
  description text,
  resource_type text not null,
  source_name text not null,
  source_url text,
  embed_url text,
  video_provider text,
  video_id text,
  language text not null default 'hindi',
  trust_level text not null default 'prepai_original',
  content_md text,
  how_to_study text[] not null default '{}',
  priority integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint study_resources_resource_type_check check (
    resource_type in (
      'concept_note',
      'pdf_note',
      'video_embed',
      'external_link',
      'mcq_practice',
      'current_affairs',
      'physical_training'
    )
  ),
  constraint study_resources_trust_level_check check (
    trust_level in ('prepai_original', 'official', 'trusted_third_party', 'general_reference')
  )
);

create index if not exists idx_study_resources_exam_subject_chapter
  on public.study_resources(exam_id, subject_id, chapter_id, priority);

create index if not exists idx_study_resources_type_active
  on public.study_resources(resource_type, is_active, priority);

alter table public.study_resources enable row level security;

drop policy if exists "Authenticated users can read active study resources" on public.study_resources;
create policy "Authenticated users can read active study resources"
  on public.study_resources
  for select
  to authenticated
  using (is_active = true);

create table if not exists public.original_practice_questions (
  id text primary key,
  exam_id text not null references public.exams(id) on delete cascade,
  subject_id text not null references public.subjects(id) on delete cascade,
  chapter_id text references public.chapters(id) on delete cascade,
  question text not null,
  options jsonb not null default '[]'::jsonb,
  answer text not null,
  explanation text,
  difficulty text not null default 'medium',
  language text not null default 'hindi',
  source_type text not null default 'prepai_original',
  exam_pattern_note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint original_practice_questions_difficulty_check check (difficulty in ('easy', 'medium', 'hard')),
  constraint original_practice_questions_source_type_check check (source_type = 'prepai_original')
);

create index if not exists idx_original_practice_questions_exam_subject_chapter
  on public.original_practice_questions(exam_id, subject_id, chapter_id, difficulty);

create index if not exists idx_original_practice_questions_active
  on public.original_practice_questions(is_active);

alter table public.original_practice_questions enable row level security;

drop policy if exists "Authenticated users can read active original practice" on public.original_practice_questions;
create policy "Authenticated users can read active original practice"
  on public.original_practice_questions
  for select
  to authenticated
  using (is_active = true);

create table if not exists public.original_practice_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null references public.original_practice_questions(id) on delete cascade,
  selected_answer text,
  is_correct boolean,
  marked_for_revision boolean not null default false,
  mistake_note text,
  attempted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, question_id)
);

create index if not exists idx_original_practice_attempts_user_id
  on public.original_practice_attempts(user_id);

create index if not exists idx_original_practice_attempts_question_id
  on public.original_practice_attempts(question_id);

create index if not exists idx_original_practice_attempts_user_is_correct
  on public.original_practice_attempts(user_id, is_correct);

create index if not exists idx_original_practice_attempts_user_marked_revision
  on public.original_practice_attempts(user_id, marked_for_revision);

create index if not exists idx_original_practice_attempts_user_attempted_at
  on public.original_practice_attempts(user_id, attempted_at desc);

alter table public.original_practice_attempts enable row level security;

drop policy if exists "Users can read own original practice attempts" on public.original_practice_attempts;
create policy "Users can read own original practice attempts"
  on public.original_practice_attempts
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own original practice attempts" on public.original_practice_attempts;
create policy "Users can insert own original practice attempts"
  on public.original_practice_attempts
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own original practice attempts" on public.original_practice_attempts;
create policy "Users can update own original practice attempts"
  on public.original_practice_attempts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own original practice attempts" on public.original_practice_attempts;
create policy "Users can delete own original practice attempts"
  on public.original_practice_attempts
  for delete
  using (auth.uid() = user_id);

with resource_seed as (
  select *
  from (values
    ('res-bihar-si-number-system-note', 'bihar_si', 'maths', 'bihar_si_maths_number_system_basics', 'Number System Basics - PrepAI Short Notes', 'concept_note', 'PrepAI Original', 'hindi', 10,
     '# Number System Basics\n\nNatural numbers counting numbers hote hain: 1, 2, 3...\n\nWhole numbers me 0 bhi include hota hai.\n\nIntegers me negative, zero aur positive numbers aate hain.\n\nEven numbers 2 se divide hote hain, odd numbers 2 se divide nahi hote.\n\nPrime number ke exactly 2 factors hote hain: 1 aur number itself. Composite number ke 2 se zyada factors hote hain.\n\nFactors number ko exactly divide karte hain. Multiples kisi number ke table me aate hain.\n\nDivisibility rules: 2 ke liye last digit even, 3 ke liye digit sum 3 se divisible, 5 ke liye last digit 0/5, 9 ke liye digit sum 9 se divisible, 10 ke liye last digit 0.\n\nLCM common multiple ka smallest value hai. HCF common factor ka largest value hai.\n\nExam approach: definition yaad karo, divisibility quickly check karo, prime factorization se LCM/HCF nikalo, aur wrong answers note karo.',
     array['Definitions read karo', 'Divisibility rules revise karo', 'Examples solve karo', 'MCQ attempt karo', 'Wrong answers note karo']),
    ('res-up-police-number-system-note', 'up_police', 'maths', 'up_police_maths_number_system_basics', 'Number System Basics - PrepAI Short Notes', 'concept_note', 'PrepAI Original', 'hindi', 10,
     '# Number System Basics\n\nNatural, whole, integer, even/odd, prime/composite, factors/multiples aur LCM/HCF written exam ke base topics hain.\n\nNatural numbers 1 se start hote hain. Whole numbers me 0 include hota hai. Integers me negative aur positive dono aate hain.\n\nDivisibility rules ko daily 5 minute revise karo. LCM/HCF ke liye prime factorization clean tarike se likho.\n\nExam approach: pehle category identify karo, phir shortest rule apply karo, last me option elimination use karo.',
     array['Definitions read karo', 'Divisibility rules revise karo', 'Examples solve karo', 'MCQ attempt karo', 'Wrong answers note karo']),
    ('res-ssc-gd-number-system-note', 'ssc_gd', 'maths', 'ssc_gd_maths_number_system', 'Number System - PrepAI Short Notes', 'concept_note', 'PrepAI Original', 'hindi', 10,
     '# Number System\n\nSSC GD me number system se basic calculation, factors, multiples, divisibility, LCM aur HCF type questions aa sakte hain.\n\nEven/odd, prime/composite aur divisibility rules ko fast recall level par rakho.\n\nLCM generally together timing/repetition questions me use hota hai. HCF largest equal grouping questions me use hota hai.',
     array['Definitions read karo', 'Divisibility rules revise karo', 'Examples solve karo', 'MCQ attempt karo', 'Wrong answers note karo']),
    ('res-bihar-si-hindi-vilom-note', 'bihar_si', 'hindi', 'bihar_si_hindi_विलोम_शब्द', 'विलोम शब्द - PrepAI Short Notes', 'concept_note', 'PrepAI Original', 'hindi', 10,
     '# विलोम शब्द\n\nकिसी शब्द के विपरीत अर्थ वाले शब्द को विलोम शब्द कहते हैं। परीक्षा में सीधे शब्द देकर उसका विलोम पूछा जाता है या वाक्य के अर्थ के अनुसार सही विपरीत शब्द चुनना होता है।\n\nCommon mistake: मिलता-जुलता शब्द देखकर जल्दी option mark kar dena. हमेशा अर्थ का उल्टा देखो।\n\nCommon pairs: अंधकार-प्रकाश, आरंभ-अंत, लाभ-हानि, सत्य-असत्य, सरल-कठिन, उच्च-निम्न, स्वच्छ-गंदा, सफल-असफल, प्रवेश-निकास, स्थायी-अस्थायी.\n\nRevision method: रोज 20 शब्द पढ़ो, कल वाले 20 शब्द revise करो, और गलत शब्दों की अलग list बनाओ.',
     array['अर्थ समझो', '20 शब्द याद करो', 'कल के 20 शब्द revise करो', 'MCQ attempt करो', 'गलत शब्द notebook me लिखो']),
    ('res-up-police-hindi-vilom-note', 'up_police', 'hindi', 'up_police_hindi_विलोम_और_पर्यायवाची', 'विलोम और पर्यायवाची - PrepAI Short Notes', 'concept_note', 'PrepAI Original', 'hindi', 10,
     '# विलोम और पर्यायवाची\n\nविलोम में विपरीत अर्थ चुनना होता है। पर्यायवाची में समान अर्थ वाला शब्द चुनना होता है। Dono me jaldi me option mark karna common mistake hai.\n\nपहले शब्द का अर्थ पक्का करो, फिर option compare karo.\n\nCommon विलोम: आरंभ-अंत, लाभ-हानि, सरल-कठिन, सत्य-असत्य, स्थायी-अस्थायी.\n\nCommon पर्यायवाची: जल-पानी, अग्नि-आग, आकाश-गगन, पृथ्वी-धरती.',
     array['विलोम/पर्याय meaning अलग करो', '20 शब्द याद करो', 'कल के शब्द revise करो', 'MCQ attempt करो', 'गलत शब्द notebook me लिखो']),
    ('res-ssc-gd-hindi-vilom-note', 'ssc_gd', 'hindi', 'ssc_gd_hindi_विलोम_पर्यायवाची', 'विलोम/पर्यायवाची - PrepAI Short Notes', 'concept_note', 'PrepAI Original', 'hindi', 10,
     '# विलोम/पर्यायवाची\n\nविलोम opposite meaning hota hai, पर्यायवाची similar meaning hota hai. SSC GD me direct vocabulary questions me speed important hai.\n\nDaily revision list banao: 10 विलोम + 10 पर्यायवाची. Galat answers ko next day repeat karo.',
     array['अर्थ समझो', '10 विलोम और 10 पर्यायवाची revise करो', 'MCQ attempt करो', 'गलत शब्द repeat करो']),
    ('res-bihar-si-current-affairs-method', 'bihar_si', 'gk_gs', 'bihar_si_gk_gs_current_affairs___national_and_bihar', 'Current Affairs Method - National & Bihar', 'current_affairs', 'PrepAI Original', 'hindi', 10,
     '# Current Affairs Study Method\n\nFake/latest facts yaad karne ke bajay daily format follow karo.\n\nDaily 10-point note format:\n1. National policy/scheme\n2. Bihar state update\n3. Appointment/award\n4. Sports/event\n5. Science/tech\n6. Economy/budget term\n7. Environment\n8. Important date\n9. Report/index type fact\n10. One revision fact\n\nNational aur Bihar ko अलग headings me लिखो. News ko exam point me convert karo: who, what, where, why important.\n\nDo not write unverified social-media facts.',
     array['10-point note banao', 'National aur Bihar अलग रखो', 'One-line exam point लिखो', 'Weekly revision करो']),
    ('res-up-police-current-affairs-method', 'up_police', 'gk_gs', 'up_police_gk_gs_current_affairs___national_and_up', 'Current Affairs Method - National & UP', 'current_affairs', 'PrepAI Original', 'hindi', 10,
     '# Current Affairs Study Method\n\nDaily current affairs ko National aur UP headings me divide karo. Har news ko one-line exam point banao.\n\nStable topics par focus: schemes, appointments, awards, sports, important days, reports, state initiatives.\n\nUnverified ya viral facts ko notes me final mat mano.',
     array['10-point note banao', 'National aur UP अलग रखो', 'One-line exam point लिखो', 'Weekly revision करो']),
    ('res-ssc-gd-current-affairs-method', 'ssc_gd', 'gk_gs', 'ssc_gd_gk_gs_current_affairs', 'Current Affairs Method - SSC GD', 'current_affairs', 'PrepAI Original', 'hindi', 10,
     '# Current Affairs Study Method\n\nSSC GD ke liye current affairs me important days, awards, sports, government schemes, reports aur defence/security related stable facts revise karo.\n\nDaily 10 facts likho. Weekly unhi facts ka self-test lo. Latest fact tabhi final karo jab trusted source se confirm ho.',
     array['10 facts likho', 'Important days/schemes mark karo', 'Weekly self-test लो', 'Unverified facts avoid करो']),
    ('res-bihar-si-physical-beginner', 'bihar_si', 'physical', 'bihar_si_physical_walking_jogging_habit', 'Beginner Physical Foundation Routine', 'physical_training', 'PrepAI Original', 'hindi', 10,
     '# Beginner Physical Foundation Routine\n\nSafety first: pain, dizziness, chest discomfort ya unusual breathing issue ho to stop karo aur qualified professional se advice lo.\n\nRoutine:\n- 5 min warmup: neck, shoulder, hip, ankle rotation\n- 10-15 min slow jog ya fast walk\n- 5 min mobility: high knees slow, leg swings, arm circles\n- 5 min stretching: calf, hamstring, quad, shoulder\n\nWeekly progression: har week total easy running/walking time me 5 minute se zyada jump mat karo. Consistency speed se important hai.',
     array['Warmup karo', 'Slow jog/fast walk karo', 'Mobility drills karo', 'Stretching karo', 'Pain/dizziness ho to stop karo']),
    ('res-up-police-physical-beginner', 'up_police', 'physical', 'up_police_physical_walking_jogging_habit', 'Beginner Physical Foundation Routine', 'physical_training', 'PrepAI Original', 'hindi', 10,
     '# Beginner Physical Foundation Routine\n\nSafety first: pain, dizziness, chest discomfort ya unusual breathing issue ho to stop karo.\n\nRoutine: 5 min warmup, 10-15 min slow jog/fast walk, 5 min mobility, 5 min stretching. Weekly progression slow rakho.',
     array['Warmup karo', 'Slow jog/fast walk karo', 'Mobility drills karo', 'Stretching karo', 'Pain/dizziness ho to stop karo']),
    ('res-ssc-gd-physical-beginner', 'ssc_gd', 'physical', 'ssc_gd_physical_walking_jogging_habit', 'Beginner Physical Foundation Routine', 'physical_training', 'PrepAI Original', 'hindi', 10,
     '# Beginner Physical Foundation Routine\n\nSafety first: pain, dizziness, chest discomfort ya unusual breathing issue ho to stop karo.\n\nRoutine: 5 min warmup, 10-15 min slow jog/fast walk, 5 min mobility, 5 min stretching. Weekly progression slow rakho.',
     array['Warmup karo', 'Slow jog/fast walk karo', 'Mobility drills karo', 'Stretching karo', 'Pain/dizziness ho to stop karo'])
  ) as seed(id, exam_id, subject_id, chapter_key, title, resource_type, source_name, language, priority, content_md, how_to_study)
)
insert into public.study_resources (
  id,
  exam_id,
  subject_id,
  chapter_id,
  title,
  description,
  resource_type,
  source_name,
  language,
  trust_level,
  content_md,
  how_to_study,
  priority,
  is_active
)
select
  seed.id,
  seed.exam_id,
  seed.subject_id,
  chapters.id,
  seed.title,
  'PrepAI-owned starter resource mapped automatically to daily tasks.',
  seed.resource_type,
  seed.source_name,
  seed.language,
  'prepai_original',
  seed.content_md,
  seed.how_to_study,
  seed.priority,
  true
from resource_seed seed
join public.chapters chapters
  on chapters.exam_id = seed.exam_id
 and chapters.subject_id = seed.subject_id
 and chapters.chapter_key = seed.chapter_key
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  content_md = excluded.content_md,
  how_to_study = excluded.how_to_study,
  priority = excluded.priority,
  is_active = true,
  updated_at = now();

with topic_map as (
  select *
  from (values
    ('number_system', 'bihar_si', 'maths', 'bihar_si_maths_number_system_basics'),
    ('number_system', 'up_police', 'maths', 'up_police_maths_number_system_basics'),
    ('number_system', 'ssc_gd', 'maths', 'ssc_gd_maths_number_system'),
    ('hindi_vilom', 'bihar_si', 'hindi', 'bihar_si_hindi_विलोम_शब्द'),
    ('hindi_vilom', 'up_police', 'hindi', 'up_police_hindi_विलोम_और_पर्यायवाची'),
    ('hindi_vilom', 'ssc_gd', 'hindi', 'ssc_gd_hindi_विलोम_पर्यायवाची'),
    ('current_affairs', 'bihar_si', 'gk_gs', 'bihar_si_gk_gs_current_affairs___national_and_bihar'),
    ('current_affairs', 'up_police', 'gk_gs', 'up_police_gk_gs_current_affairs___national_and_up'),
    ('current_affairs', 'ssc_gd', 'gk_gs', 'ssc_gd_gk_gs_current_affairs')
  ) as m(topic_key, exam_id, subject_id, chapter_key)
),
question_seed as (
  select *
  from (values
    ('number_system', 1, 'Which number is a whole number but not a natural number in the usual school definition?', '["0","1","2","10"]'::jsonb, '0', 'Whole numbers include 0, while natural numbers usually start from 1.', 'easy'),
    ('number_system', 2, 'Which of these is an even number?', '["35","47","58","73"]'::jsonb, '58', 'A number ending in 0,2,4,6,8 is even. 58 ends in 8.', 'easy'),
    ('number_system', 3, 'Which number is prime?', '["21","29","39","49"]'::jsonb, '29', '29 has only two factors: 1 and 29.', 'easy'),
    ('number_system', 4, 'Which number is composite?', '["2","3","5","9"]'::jsonb, '9', '9 has factors 1, 3, and 9, so it is composite.', 'easy'),
    ('number_system', 5, 'A number is divisible by 3 if:', '["last digit is 3","sum of digits is divisible by 3","number ends in 0","number is odd"]'::jsonb, 'sum of digits is divisible by 3', 'The divisibility rule for 3 checks the sum of digits.', 'easy'),
    ('number_system', 6, 'LCM of 4 and 6 is:', '["8","10","12","24"]'::jsonb, '12', 'Multiples of 4 are 4,8,12 and of 6 are 6,12. Smallest common multiple is 12.', 'easy'),
    ('number_system', 7, 'HCF of 18 and 24 is:', '["3","6","9","12"]'::jsonb, '6', 'Common factors include 1,2,3,6. Highest is 6.', 'easy'),
    ('number_system', 8, 'Which number is divisible by 5?', '["122","134","145","161"]'::jsonb, '145', 'Numbers ending in 0 or 5 are divisible by 5.', 'easy'),
    ('number_system', 9, 'The smallest prime number is:', '["0","1","2","3"]'::jsonb, '2', '2 is the smallest prime number and the only even prime.', 'easy'),
    ('number_system', 10, 'Which pair has HCF 1?', '["8 and 12","9 and 15","14 and 21","8 and 15"]'::jsonb, '8 and 15', '8 and 15 have no common factor except 1.', 'medium'),
    ('number_system', 11, 'LCM of 5, 10 and 15 is:', '["15","20","30","60"]'::jsonb, '30', '30 is the smallest number divisible by 5, 10 and 15.', 'medium'),
    ('number_system', 12, 'Which of these is a multiple of 7?', '["34","42","53","68"]'::jsonb, '42', '7 x 6 = 42.', 'easy'),
    ('number_system', 13, 'If a number is divisible by both 2 and 5, it must end with:', '["0","2","5","8"]'::jsonb, '0', 'Divisible by 2 means even and by 5 means ending 0 or 5; common condition is ending 0.', 'medium'),
    ('number_system', 14, 'Prime factorization of 12 is:', '["2 x 6","3 x 4","2 x 2 x 3","1 x 12"]'::jsonb, '2 x 2 x 3', 'Prime factors must all be prime, so 12 = 2 x 2 x 3.', 'medium'),
    ('number_system', 15, 'Which number is divisible by 9?', '["117","124","136","145"]'::jsonb, '117', '1+1+7 = 9, so 117 is divisible by 9.', 'medium'),
    ('hindi_vilom', 1, '“अंधकार” का विलोम शब्द क्या है?', '["प्रकाश","रात्रि","छाया","काला"]'::jsonb, 'प्रकाश', 'अंधकार का विपरीत अर्थ प्रकाश है।', 'easy'),
    ('hindi_vilom', 2, '“आरंभ” का विलोम शब्द चुनिए।', '["शुरू","प्रारंभ","अंत","मध्य"]'::jsonb, 'अंत', 'आरंभ का विपरीत अंत होता है।', 'easy'),
    ('hindi_vilom', 3, '“लाभ” का विलोम शब्द है:', '["हानि","धन","फायदा","मूल्य"]'::jsonb, 'हानि', 'लाभ का विपरीत हानि है।', 'easy'),
    ('hindi_vilom', 4, '“सत्य” का विलोम शब्द चुनिए।', '["सही","असत्य","तथ्य","न्याय"]'::jsonb, 'असत्य', 'सत्य का विपरीत असत्य है।', 'easy'),
    ('hindi_vilom', 5, '“सरल” का विलोम शब्द है:', '["आसान","कठिन","सीधा","स्पष्ट"]'::jsonb, 'कठिन', 'सरल का विपरीत कठिन है।', 'easy'),
    ('hindi_vilom', 6, '“उच्च” का विलोम शब्द क्या है?', '["ऊपर","निम्न","बड़ा","श्रेष्ठ"]'::jsonb, 'निम्न', 'उच्च का विपरीत निम्न है।', 'easy'),
    ('hindi_vilom', 7, '“स्वच्छ” का विलोम शब्द चुनिए।', '["निर्मल","गंदा","साफ","पवित्र"]'::jsonb, 'गंदा', 'स्वच्छ का विपरीत गंदा है।', 'easy'),
    ('hindi_vilom', 8, '“सफल” का विलोम शब्द है:', '["विजयी","असफल","योग्य","समर्थ"]'::jsonb, 'असफल', 'सफल का विपरीत असफल है।', 'easy'),
    ('hindi_vilom', 9, '“प्रवेश” का विलोम शब्द चुनिए।', '["आगमन","निकास","आना","द्वार"]'::jsonb, 'निकास', 'प्रवेश का विपरीत निकास है।', 'easy'),
    ('hindi_vilom', 10, '“स्थायी” का विलोम शब्द क्या है?', '["अस्थायी","सदैव","निश्चित","मजबूत"]'::jsonb, 'अस्थायी', 'स्थायी का विपरीत अस्थायी है।', 'easy'),
    ('hindi_vilom', 11, '“दिन” का विलोम शब्द है:', '["प्रातः","रात","दोपहर","संध्या"]'::jsonb, 'रात', 'दिन का विपरीत रात है।', 'easy'),
    ('hindi_vilom', 12, '“गरम” का विलोम शब्द चुनिए।', '["उष्ण","ठंडा","गर्माहट","तेज"]'::jsonb, 'ठंडा', 'गरम का विपरीत ठंडा है।', 'easy'),
    ('hindi_vilom', 13, '“नया” का विलोम शब्द है:', '["ताजा","पुराना","अलग","छोटा"]'::jsonb, 'पुराना', 'नया का विपरीत पुराना है।', 'easy'),
    ('hindi_vilom', 14, '“आशा” का विलोम शब्द चुनिए।', '["उम्मीद","निराशा","विश्वास","इच्छा"]'::jsonb, 'निराशा', 'आशा का विपरीत निराशा है।', 'medium'),
    ('hindi_vilom', 15, '“साहस” का विलोम शब्द है:', '["वीरता","डर","बल","धैर्य"]'::jsonb, 'डर', 'साहस का विपरीत डर या भय है।', 'medium'),
    ('current_affairs', 1, 'Current affairs notes me “who, what, where” likhne ka main benefit kya hai?', '["Notes lengthy ho jate hain","Fact exam point me convert hota hai","News ignore hoti hai","Only dates yaad hoti hain"]'::jsonb, 'Fact exam point me convert hota hai', 'Exam revision ke liye news ko short factual point me convert karna useful hota hai.', 'easy'),
    ('current_affairs', 2, 'Daily current affairs ko kaise divide karna best hai?', '["National aur state headings me","Only sports me","Only social media posts me","Random order me"]'::jsonb, 'National aur state headings me', 'Exam-oriented notes me National aur state-specific facts alag rakhna easy revision deta hai.', 'easy'),
    ('current_affairs', 3, 'Unverified viral fact ko notes me kaise treat karna chahiye?', '["Final fact maan lena chahiye","Ignore verification and memorize","Trusted source se confirm karna chahiye","Sirf headline likhni chahiye"]'::jsonb, 'Trusted source se confirm karna chahiye', 'Unverified facts exam prep me risky hote hain.', 'easy'),
    ('current_affairs', 4, 'Current affairs weekly revision ka main goal kya hai?', '["Old facts ko repeat karna","Syllabus chhodna","Sirf new facts padhna","Mock skip karna"]'::jsonb, 'Old facts ko repeat karna', 'Weekly revision retention improve karta hai.', 'easy'),
    ('current_affairs', 5, 'Ek good current affairs note ka format kaisa hona chahiye?', '["Long paragraph only","One-line exam point","Only image","No date/source"]'::jsonb, 'One-line exam point', 'Short exam-point format quick revision me helpful hota hai.', 'easy'),
    ('current_affairs', 6, 'State-specific current affairs kyon important hote hain?', '["State exams me local relevance hoti hai","Kisi exam me nahi aate","Sirf sports ke liye hote hain","Unhe verify nahi karna hota"]'::jsonb, 'State exams me local relevance hoti hai', 'State police exams me state-specific schemes/events useful ho sakte hain.', 'medium'),
    ('current_affairs', 7, 'Current affairs me “important days” ko revise karne ka safe tareeka kya hai?', '["Monthly list banao aur test lo","Random guess karo","Only one day padho","Options na dekho"]'::jsonb, 'Monthly list banao aur test lo', 'Monthly grouping aur self-test recall improve karte hain.', 'medium'),
    ('current_affairs', 8, 'News ko exam point me convert karte waqt kya avoid karna chahiye?', '["Source check","Keyword","Unverified claim","Short note"]'::jsonb, 'Unverified claim', 'Unverified claims wrong learning create kar sakte hain.', 'easy'),
    ('current_affairs', 9, 'Daily 10-point current affairs method me kitne facts target kiye jate hain?', '["5","10","25","100"]'::jsonb, '10', 'Starter method me daily 10 concise points target hain.', 'easy'),
    ('current_affairs', 10, 'Current affairs practice question ka best source kya hona chahiye?', '["Verified/trusted source based notes","Random rumor","Old irrelevant joke","No source"]'::jsonb, 'Verified/trusted source based notes', 'Reliable source-based notes safer exam prep dete hain.', 'medium')
  ) as q(topic_key, question_no, question, options, answer, explanation, difficulty)
)
insert into public.original_practice_questions (
  id,
  exam_id,
  subject_id,
  chapter_id,
  question,
  options,
  answer,
  explanation,
  difficulty,
  language,
  source_type,
  exam_pattern_note,
  is_active
)
select
  'opq-' || topic_map.exam_id || '-' || question_seed.topic_key || '-' || lpad(question_seed.question_no::text, 2, '0'),
  topic_map.exam_id,
  topic_map.subject_id,
  chapters.id,
  question_seed.question,
  question_seed.options,
  question_seed.answer,
  question_seed.explanation,
  question_seed.difficulty,
  'hindi',
  'prepai_original',
  'PrepAI Original Practice for concept reinforcement. Not an official PYQ.',
  true
from question_seed
join topic_map on topic_map.topic_key = question_seed.topic_key
join public.chapters chapters
  on chapters.exam_id = topic_map.exam_id
 and chapters.subject_id = topic_map.subject_id
 and chapters.chapter_key = topic_map.chapter_key
on conflict (id) do update set
  question = excluded.question,
  options = excluded.options,
  answer = excluded.answer,
  explanation = excluded.explanation,
  difficulty = excluded.difficulty,
  exam_pattern_note = excluded.exam_pattern_note,
  is_active = true,
  updated_at = now();
