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

## Post-Cleanup Production Smoke

- Timestamp: 2026-05-11.
- Production URL tested: `https://prepnix.vercel.app`.
- Database sanity passed: exactly `bihar_si`, `up_police`, `ssc_gd`; unsupported exams/chapters/resources/original practice/PYQs all `0`; weak generic PrepAI questions `0`.
- Blocking cleanup fix applied: removed legacy physical PrepAI Original Practice rows; post-fix physical original practice count `0`.
- Logged-out `/dashboard` redirected to `/auth/login`.
- Fresh Bihar SI onboarding passed with `120` days, `3` hours/day, maths `weak`, physical `weak`; dashboard and daily tasks loaded.
- Daily task Study Material passed: notes render, video search/no-video fallback renders, Current Affairs is labeled `Study Method Practice`, Original Practice is labeled `Not Official PYQ`.
- Original Practice wrong answer saved, mistake note persisted, mark-for-revision worked, and the item appeared in Revision Queue under PrepAI Practice Mistakes.
- Quick onboarding smoke passed for UP Police and SSC GD.
- PYQ page loaded; filters/content did not show SSC CGL; AI/third-party practice was not labeled Official Verified PYQ. Official verified PYQ count remains `0`.
- Non-admin `/dashboard/admin/debug` returned 404/not-found behavior.
- Admin `/dashboard/admin/debug` loaded for `PYQ_ADMIN_EMAILS` admin and showed supported-exam cleanup counts.
- Temporary smoke auth users and their generated user data were cleaned up after the run.

## Bihar SI Content Pack v1

- Timestamp: 2026-05-11.
- Migration applied to production Supabase: `20260511120000_bihar_si_content_pack_v1.sql`.
- Scope was limited to `exam_id = bihar_si`; UP Police and SSC GD were not modified by this pack.
- Seed counts verified after migration:
  - Bihar SI PrepAI Original questions added: `660`.
  - Bihar SI PrepAI Original mocks added: `18`.
  - Bihar SI mock questions added: `650`.
  - UP Police rows from this pack: `0`.
  - SSC GD rows from this pack: `0`.
- Bihar SI chapter coverage includes Maths, Reasoning, Hindi, and GK/GS priority chapters from the v1 request.
- Mock sets include `10` section-wise mini mocks, `5` mixed practice mocks, and `3` full-length foundation mocks.
- Mock attempts now start from `/dashboard/mock-tests`, run with the existing timer/submit/results flow, and missed PrepAI Original mock questions are marked for original-practice revision automatically.
- Generic weak PrepAI Original question count remains `0`.
- Official verified PYQ count remains `0`.
- PYQ trust rules are unchanged.
- No third-party MCQ/PDF content, scraping, fake current-affairs facts, YouTube downloads, or rehosting were added.
- Production audit blocker fixed by upgrading `next` and `eslint-config-next` from `16.2.4` to `16.2.5` for GHSA-8h8q-6873-q5fj.

## Commands

- `npm run typecheck` passed on 2026-05-11.
- `npm run lint` passed on 2026-05-11.
- `npm run build` passed on 2026-05-11.
- `npm run audit` passed on 2026-05-11.

## Known Issues

- Historical migration files still contain old seed references by design; already-applied migration files were not edited or removed.
