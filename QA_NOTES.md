# QA Notes

## Current Support Matrix

- Supported exams: Bihar SI (`bihar_si`), UP Police (`up_police`), SSC GD (`ssc_gd`).
- Unsupported aliases/exams removed by `20260511100000_remove_unsupported_exams.sql`: `bihar-si`, `up-police`, `ssc-gd`, `ssc-cgl`.
- Historical QA notes were archived to `docs/archive/QA_HISTORY_2026-05-11.md`.

## Latest Cleanup Result

- `CLEANUP_AUDIT.md` was created before destructive cleanup with live before-counts.
- Migration `20260511100000_remove_unsupported_exams.sql` was applied to production Supabase.
- Exams table now contains exactly 3 rows: `bihar_si`, `up_police`, `ssc_gd`.
- Unsupported counts after cleanup: exams `0`, chapters `0`, study resources `0`, original practice questions `0`, PYQ questions `0`.
- Supported chapter counts after cleanup: Bihar SI `58`, UP Police `47`, SSC GD `52`.
- Original practice counts after cleanup: Bihar SI `90`, UP Police `80`, SSC GD `80`.
- PYQ rows after cleanup remain Bihar SI only: `11` AI practice, `4` trusted third-party in review, `1` trusted third-party human reviewed.
- Unsupported exam master/rule/content rows are deleted by migration.
- Unsupported exam plans/tasks/resources/questions/PYQs/mocks are deleted by migration when present.
- Profiles are preserved; unsupported profile `exam_target` values are cleared and onboarding is reset.
- Weak generic PrepAI Original questions are deleted; post-cleanup count is `0`.
- PYQ trust rules are unchanged.
- No third-party imports, scraping, YouTube downloads, or rehosting were added.

## Verification Checklist

- Exams table contains only `bihar_si`, `up_police`, and `ssc_gd`.
- Onboarding and plan settings show only the three supported exams.
- PYQ, Original Practice, Mock, and resource flows are scoped to supported exams.
- Daily tasks, resource viewer, original practice, revision queue, and protected admin routes still render.
- Run `docs/cleanup/db-cleanup-report.sql` after migration for repeatable database counts.

## Commands

- `npm run typecheck` passed on 2026-05-11.
- `npm run lint` passed on 2026-05-11.
- `npm run build` passed on 2026-05-11.
- `npm run audit` passed on 2026-05-11.

## Known Issues

- Historical migration files still contain old seed references by design; already-applied migration files were not edited or removed.
