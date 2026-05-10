update public.pyq_questions
set is_verified = false
where coalesce(source, 'ai_generated') <> 'verified_pyq';

alter table public.pyq_questions
  drop constraint if exists pyq_source_verification_check;

alter table public.pyq_questions
  add constraint pyq_source_verification_check
  check (
    (source = 'verified_pyq' and is_verified = true)
    or
    (coalesce(source, 'ai_generated') <> 'verified_pyq' and is_verified = false)
  );

insert into public.exams (id, name, level, focus, selection_stages)
values
  ('bihar-si', 'Bihar Police SI', 'State Police', array['GK/GS', 'Hindi', 'Maths', 'Reasoning', 'Physical'], array['Prelims', 'Mains', 'Physical Test']),
  ('up-police', 'UP Police', 'State Police', array['GK/GS', 'Hindi', 'Maths', 'Reasoning', 'Physical'], array['Written Exam', 'Document Verification', 'Physical Test']),
  ('ssc-gd', 'SSC GD', 'Matriculation', array['General Intelligence', 'General Knowledge', 'Elementary Maths', 'Hindi/English', 'Physical'], array['Computer Based Exam', 'Physical Efficiency Test', 'Medical']),
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
  ('bihar-si-maths-number-system', 'bihar-si', 'maths', 'Number System', 'high', 'medium', 75, 1),
  ('bihar-si-maths-percentage', 'bihar-si', 'maths', 'Percentage', 'high', 'medium', 80, 2),
  ('bihar-si-maths-ratio', 'bihar-si', 'maths', 'Ratio and Proportion', 'high', 'medium', 75, 3),
  ('bihar-si-maths-profit-loss', 'bihar-si', 'maths', 'Profit and Loss', 'high', 'medium', 85, 4),
  ('bihar-si-gkgs-history', 'bihar-si', 'gk-gs', 'Modern Indian History', 'high', 'medium', 90, 5),
  ('bihar-si-gkgs-polity', 'bihar-si', 'gk-gs', 'Indian Polity', 'high', 'medium', 90, 6),
  ('bihar-si-gkgs-bihar-gk', 'bihar-si', 'gk-gs', 'Bihar GK', 'high', 'medium', 95, 7),
  ('bihar-si-hindi-grammar', 'bihar-si', 'hindi', 'Hindi Grammar', 'high', 'medium', 80, 8),
  ('bihar-si-hindi-vocabulary', 'bihar-si', 'hindi', 'Hindi Vocabulary', 'medium', 'easy', 60, 9),
  ('bihar-si-reasoning-series', 'bihar-si', 'reasoning', 'Series and Analogy', 'medium', 'easy', 65, 10),
  ('bihar-si-reasoning-coding', 'bihar-si', 'reasoning', 'Coding Decoding', 'medium', 'medium', 65, 11),
  ('bihar-si-physical-running', 'bihar-si', 'physical', 'Running and Endurance', 'high', 'medium', 45, 12),

  ('up-police-gkgs-current', 'up-police', 'gk-gs', 'Current Affairs', 'high', 'medium', 90, 1),
  ('up-police-gkgs-up-gk', 'up-police', 'gk-gs', 'Uttar Pradesh GK', 'high', 'medium', 95, 2),
  ('up-police-gkgs-constitution', 'up-police', 'gk-gs', 'Indian Constitution', 'high', 'medium', 85, 3),
  ('up-police-hindi-grammar', 'up-police', 'hindi', 'Hindi Grammar', 'high', 'medium', 80, 4),
  ('up-police-hindi-comprehension', 'up-police', 'hindi', 'Hindi Comprehension', 'medium', 'medium', 70, 5),
  ('up-police-maths-arithmetic', 'up-police', 'maths', 'Arithmetic Basics', 'high', 'easy', 90, 6),
  ('up-police-maths-time-work', 'up-police', 'maths', 'Time and Work', 'medium', 'medium', 75, 7),
  ('up-police-reasoning-verbal', 'up-police', 'reasoning', 'Verbal Reasoning', 'medium', 'medium', 70, 8),
  ('up-police-reasoning-non-verbal', 'up-police', 'reasoning', 'Non-Verbal Reasoning', 'medium', 'medium', 70, 9),
  ('up-police-physical-running', 'up-police', 'physical', 'Running and Stamina', 'high', 'medium', 45, 10),

  ('ssc-gd-maths-number-system', 'ssc-gd', 'maths', 'Number System', 'high', 'easy', 75, 1),
  ('ssc-gd-maths-simplification', 'ssc-gd', 'maths', 'Simplification', 'high', 'easy', 70, 2),
  ('ssc-gd-maths-percentage', 'ssc-gd', 'maths', 'Percentage', 'high', 'medium', 75, 3),
  ('ssc-gd-reasoning-analogy', 'ssc-gd', 'reasoning', 'Analogy and Classification', 'high', 'easy', 65, 4),
  ('ssc-gd-reasoning-series', 'ssc-gd', 'reasoning', 'Series', 'high', 'easy', 65, 5),
  ('ssc-gd-gkgs-static', 'ssc-gd', 'gk-gs', 'Static GK', 'high', 'medium', 80, 6),
  ('ssc-gd-gkgs-current', 'ssc-gd', 'gk-gs', 'Current Affairs', 'high', 'medium', 80, 7),
  ('ssc-gd-hindi-english-basics', 'ssc-gd', 'hindi', 'Hindi / English Basics', 'medium', 'easy', 70, 8),
  ('ssc-gd-english-vocabulary', 'ssc-gd', 'english', 'Basic Vocabulary', 'medium', 'easy', 60, 9),
  ('ssc-gd-physical-endurance', 'ssc-gd', 'physical', 'PET Endurance', 'high', 'medium', 45, 10),

  ('ssc-cgl-maths-algebra', 'ssc-cgl', 'maths', 'Algebra', 'high', 'hard', 100, 1),
  ('ssc-cgl-maths-geometry', 'ssc-cgl', 'maths', 'Geometry', 'high', 'hard', 110, 2),
  ('ssc-cgl-maths-trigonometry', 'ssc-cgl', 'maths', 'Trigonometry', 'high', 'hard', 100, 3),
  ('ssc-cgl-maths-data-interpretation', 'ssc-cgl', 'maths', 'Data Interpretation', 'high', 'medium', 90, 4),
  ('ssc-cgl-english-grammar', 'ssc-cgl', 'english', 'English Grammar', 'high', 'medium', 90, 5),
  ('ssc-cgl-english-vocabulary', 'ssc-cgl', 'english', 'Vocabulary and Idioms', 'high', 'medium', 80, 6),
  ('ssc-cgl-english-comprehension', 'ssc-cgl', 'english', 'Reading Comprehension', 'medium', 'medium', 75, 7),
  ('ssc-cgl-reasoning-puzzles', 'ssc-cgl', 'reasoning', 'Puzzles and Seating', 'medium', 'medium', 80, 8),
  ('ssc-cgl-reasoning-analogy', 'ssc-cgl', 'reasoning', 'Analogy and Classification', 'medium', 'easy', 65, 9),
  ('ssc-cgl-ga-polity', 'ssc-cgl', 'general-awareness', 'Indian Polity', 'medium', 'medium', 80, 10),
  ('ssc-cgl-ga-economy', 'ssc-cgl', 'general-awareness', 'Economy Basics', 'medium', 'medium', 80, 11),
  ('ssc-cgl-computer-basics', 'ssc-cgl', 'computer', 'Computer Basics', 'low', 'easy', 55, 12)
on conflict (id) do update set
  exam_id = excluded.exam_id,
  subject_id = excluded.subject_id,
  name = excluded.name,
  priority = excluded.priority,
  difficulty = excluded.difficulty,
  estimated_minutes = excluded.estimated_minutes,
  order_index = excluded.order_index;

delete from public.task_templates
where exam_id in ('bihar-si', 'up-police', 'ssc-gd', 'ssc-cgl');

insert into public.task_templates (exam_id, subject_id, task_type, title_template, description_template, estimated_minutes, priority)
values
  ('bihar-si', 'maths', 'concept', 'Study {{chapter}} concepts', 'Build formulas, solve examples, and write short notes.', 45, 'high'),
  ('bihar-si', 'gk-gs', 'notes', 'Make notes for {{chapter}}', 'Read the topic, capture facts, and revise once before sleeping.', 40, 'high'),
  ('bihar-si', 'hindi', 'practice', 'Practice {{chapter}} questions', 'Solve grammar or vocabulary questions and mark mistakes.', 35, 'high'),
  ('bihar-si', 'reasoning', 'practice', 'Solve {{chapter}} drills', 'Use timed sets and review every wrong answer.', 35, 'medium'),
  ('bihar-si', 'physical', 'physical', 'Complete {{chapter}} training', 'Warm up, train at your current level, and cool down.', 30, 'high'),
  ('up-police', 'maths', 'practice', 'Practice {{chapter}}', 'Solve topic drills with speed and accuracy tracking.', 40, 'high'),
  ('up-police', 'gk-gs', 'notes', 'Revise {{chapter}} facts', 'Make concise notes and add missed facts to revision.', 40, 'high'),
  ('up-police', 'hindi', 'concept', 'Study {{chapter}} rules', 'Read rules, solve examples, and write error patterns.', 35, 'high'),
  ('up-police', 'reasoning', 'practice', 'Timed {{chapter}} reasoning set', 'Solve under a timer and log weak patterns.', 35, 'medium'),
  ('up-police', 'physical', 'physical', 'Complete {{chapter}} session', 'Follow progressive running and strength targets.', 30, 'high'),
  ('ssc-gd', 'maths', 'concept', 'Study {{chapter}} basics', 'Focus on core formulas and beginner-friendly examples.', 40, 'high'),
  ('ssc-gd', 'reasoning', 'practice', 'Practice {{chapter}}', 'Solve mixed easy-to-medium reasoning questions.', 35, 'high'),
  ('ssc-gd', 'gk-gs', 'notes', 'Revise {{chapter}}', 'Read facts, create flash notes, and revisit weak items.', 35, 'high'),
  ('ssc-gd', 'hindi', 'practice', 'Language practice for {{chapter}}', 'Solve grammar and vocabulary questions.', 30, 'medium'),
  ('ssc-gd', 'english', 'practice', 'English practice for {{chapter}}', 'Practice vocabulary, grammar, and short reading drills.', 30, 'medium'),
  ('ssc-gd', 'physical', 'physical', 'Complete {{chapter}} training', 'Build endurance gradually with recovery.', 30, 'high'),
  ('ssc-cgl', 'maths', 'concept', 'Master {{chapter}} concepts', 'Study formulas, solve examples, and attempt PYQ-style practice.', 50, 'high'),
  ('ssc-cgl', 'english', 'practice', 'Practice {{chapter}}', 'Solve grammar, vocabulary, and comprehension drills.', 40, 'high'),
  ('ssc-cgl', 'reasoning', 'practice', 'Solve {{chapter}} set', 'Use timed practice and record mistake patterns.', 35, 'medium'),
  ('ssc-cgl', 'general-awareness', 'notes', 'Make notes for {{chapter}}', 'Read, summarize, and schedule spaced revision.', 35, 'medium'),
  ('ssc-cgl', 'computer', 'concept', 'Study {{chapter}} basics', 'Learn definitions, shortcuts, and common exam facts.', 30, 'low');

delete from public.revision_rules where exam_id in ('bihar-si', 'up-police', 'ssc-gd', 'ssc-cgl');
insert into public.revision_rules (exam_id, frequency, rule_config)
values
  ('bihar-si', 'weekly', '{"revision_day_interval": 7, "focus": ["high_priority", "mistakes"]}'),
  ('up-police', 'weekly', '{"revision_day_interval": 7, "focus": ["state_gk", "mistakes"]}'),
  ('ssc-gd', 'weekly', '{"revision_day_interval": 7, "focus": ["basics", "speed"]}'),
  ('ssc-cgl', 'weekly', '{"revision_day_interval": 7, "focus": ["quant", "english", "mistakes"]}');

delete from public.mock_rules where exam_id in ('bihar-si', 'up-police', 'ssc-gd', 'ssc-cgl');
insert into public.mock_rules (exam_id, start_after_phase, frequency_days, mock_type)
values
  ('bihar-si', 'foundation', 7, 'sectional'),
  ('up-police', 'foundation', 7, 'sectional'),
  ('ssc-gd', 'foundation', 7, 'sectional'),
  ('ssc-cgl', 'foundation', 7, 'sectional');

delete from public.physical_rules where exam_id in ('bihar-si', 'up-police', 'ssc-gd');
insert into public.physical_rules (exam_id, level, rule_config)
values
  ('bihar-si', 'weak', '{"base_minutes": 20, "weekly_increment": 5, "intensity": "slow"}'),
  ('bihar-si', 'average', '{"base_minutes": 30, "weekly_increment": 7, "intensity": "moderate"}'),
  ('bihar-si', 'good', '{"base_minutes": 40, "weekly_increment": 10, "intensity": "challenging"}'),
  ('up-police', 'weak', '{"base_minutes": 20, "weekly_increment": 5, "intensity": "slow"}'),
  ('up-police', 'average', '{"base_minutes": 30, "weekly_increment": 7, "intensity": "moderate"}'),
  ('up-police', 'good', '{"base_minutes": 40, "weekly_increment": 10, "intensity": "challenging"}'),
  ('ssc-gd', 'weak', '{"base_minutes": 20, "weekly_increment": 5, "intensity": "slow"}'),
  ('ssc-gd', 'average', '{"base_minutes": 30, "weekly_increment": 7, "intensity": "moderate"}'),
  ('ssc-gd', 'good', '{"base_minutes": 40, "weekly_increment": 10, "intensity": "challenging"}');

insert into public.motivational_quotes (id, quote, author)
values
  ('discipline-1', 'Discipline is choosing your target again when motivation fades.', 'PrepAI'),
  ('progress-1', 'Small daily wins become exam-day confidence.', 'PrepAI'),
  ('revision-1', 'Revision turns effort into recall.', 'PrepAI'),
  ('mock-1', 'A mock test is useful only when the mistakes become tomorrow''s revision.', 'PrepAI'),
  ('focus-1', 'Protect the first hour. It usually decides the whole study day.', 'PrepAI'),
  ('physical-1', 'Physical prep grows by consistency, not sudden intensity.', 'PrepAI')
on conflict (id) do update set
  quote = excluded.quote,
  author = excluded.author;
