do $$
declare
  row_count integer;
  id_type text;
begin
  if to_regclass('public.subjects') is not null and to_regclass('public.legacy_subjects_20260510') is null then
    select data_type into id_type
    from information_schema.columns
    where table_schema = 'public' and table_name = 'subjects' and column_name = 'id';

    execute 'select count(*) from public.subjects' into row_count;
    if id_type = 'uuid' and row_count = 0 then
      alter table public.subjects rename to legacy_subjects_20260510;
    end if;
  end if;

  if to_regclass('public.chapters') is not null and to_regclass('public.legacy_chapters_20260510') is null then
    select data_type into id_type
    from information_schema.columns
    where table_schema = 'public' and table_name = 'chapters' and column_name = 'id';

    execute 'select count(*) from public.chapters' into row_count;
    if id_type = 'uuid' and row_count = 0 then
      alter table public.chapters rename to legacy_chapters_20260510;
    end if;
  end if;

  if to_regclass('public.mock_tests') is not null and to_regclass('public.legacy_mock_tests_20260510') is null then
    select data_type into id_type
    from information_schema.columns
    where table_schema = 'public' and table_name = 'mock_tests' and column_name = 'id';

    execute 'select count(*) from public.mock_tests' into row_count;
    if id_type = 'uuid' and row_count = 0 then
      alter table public.mock_tests rename to legacy_mock_tests_20260510;
    end if;
  end if;

  if to_regclass('public.notes') is not null and to_regclass('public.legacy_notes_20260510') is null then
    select data_type into id_type
    from information_schema.columns
    where table_schema = 'public' and table_name = 'notes' and column_name = 'subject';

    execute 'select count(*) from public.notes' into row_count;
    if id_type = 'text' and row_count = 0 then
      alter table public.notes rename to legacy_notes_20260510;
    end if;
  end if;
end $$;
