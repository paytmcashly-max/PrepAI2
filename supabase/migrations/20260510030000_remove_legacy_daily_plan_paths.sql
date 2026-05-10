update public.revision_rules
set rule_config = replace(rule_config::text, '"quant"', '"maths"')::jsonb
where rule_config::text like '%"quant"%';

drop table if exists public.task_completions cascade;
drop table if exists public.daily_tasks cascade;
drop table if exists public.daily_plans cascade;
drop table if exists public.roadmap_phases cascade;
