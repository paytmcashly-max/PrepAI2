# QA Notes

Date: 2026-05-11

## Tested Flows

- Admin debug access with an allowlisted QA admin email.
- Non-admin access to `/dashboard/admin/debug`; verified the debug UI and title are not exposed in the not-found response.
- Dashboard, Daily Tasks, Backlog, Revision Queue, Subjects, PYQ, PYQ Admin, and Plan Settings with authenticated QA users.
- Active-plan counts against `/dashboard/admin/debug`:
  - total active tasks
  - today tasks using `day_number = currentDay OR task_date = today`
  - completed, pending, skipped, and overdue pending tasks
  - subject distribution
  - weak-area and revision queue counts
- Today task visibility for normal current-day tasks and tasks rescheduled to today by `task_date`.
- Backlog states for overdue pending, completed old, skipped old, moved-to-today, moved-to-tomorrow, moved-to-custom-date, and skipped tasks.
- Revision Queue overdue, weak chapter, mock weak-area, current-week revision, and suggested-order sections.
- Plan activation flow using the database RPC:
  - new generated plan becomes active
  - old active plan becomes archived
  - active dashboard pages ignore archived plan tasks
  - a simulated pre-activation generating plan leaves the existing active plan untouched
- PYQ empty state with an empty real PYQ bank.
- PYQ unverified badge and filters with one temporary `ai_generated` QA record, then removed that record.
- PYQ admin page access:
  - admin sees the import form
  - normal user sees only restricted access
- Mobile/code polish inspection for dashboard cards, task cards, backlog rows, revision cards, PYQ filters/cards, plan settings, and admin debug tables.

## Bugs Found And Fixed

- PYQ import server action still used the old `PYQ_ADMIN_EMAILS || ADMIN_EMAILS` allowlist behavior. It now uses the shared admin helper that combines both env vars.
- Non-admin `/dashboard/admin/debug` not-found responses included the static `Admin Debug` route metadata. Static metadata was removed so normal users do not see the debug route title.
- Revision Queue showed skipped/completed revision tasks in the current-week revision section. It now shows only pending revision tasks for the current week.
- PYQ question cards could squeeze badges and action controls on mobile. The metadata and answer footer now stack/wrap cleanly on small screens.

## Remaining Known Issues

- The real PYQ bank is currently empty, so verified PYQ badge rendering was not tested with a real verified previous-year question. No fake verified PYQ was created.
- Browser automation CLI was unavailable in this shell, so QA used authenticated HTTP checks, Supabase admin/user clients, direct database state transitions, and code/UI inspection instead of click-by-click visual browser automation.
- Temporary QA users/data were used for validation and cleaned up after the QA pass.

## PYQ Data Entry Workflow

Admin-only checklist for verified/manual PYQ entry:

- Verify every `verified_pyq` against an official or clearly attributable previous-year question-paper source before entry.
- Use `source_reference` for the exact reference needed to re-check the question later: official paper name, exam date/year, set/code if available, question number, page number, and source URL or file location.
- `verified_pyq` means a real previous-year question that has been checked against the source reference. It must use `source = verified_pyq`, `is_verified = true`, a valid exam, subject, chapter, question, answer, and source reference.
- `ai_generated` means a practice/demo question. It must use `source = ai_generated` and `is_verified = false`. It must never be described as a real previous-year question.
- Memory-based questions, coaching-site reconstructions, and AI-written practice questions are not verified PYQs.

PYQ source taxonomy update:

- Added migration `20260511010000_pyq_source_trust_taxonomy.sql`.
- Supported sources are now `verified_pyq`, `trusted_third_party`, `memory_based`, and `ai_generated`.
- `verified_pyq` is the only source that can set `is_verified = true`.
- `trusted_third_party`, `memory_based`, and `ai_generated` are always unverified practice sources.
- Admin import now forces source-specific validation:
  - official verified requires chapter and `source_reference`
  - trusted third-party requires `source_name` and `source_reference`
  - memory-based requires `source_reference`
  - AI practice does not require `source_reference`
- PYQ admin import defaults to `ai_generated` with `is_verified = false`; official verified PYQ requires intentional selection.
- PYQ import validates `source_url` with `URL()` when the value starts with `http`, while non-URL local/file references stay in `source_reference`.
- PYQ display badges now separate Official Verified PYQ, Third-party Practice / In Review, Memory-based / Unofficial, and AI Practice.
- PYQ cards display `verification_status` when present.
- Admin debug counts now separate official verified, trusted third-party, memory-based, and AI practice counts.
- Live database taxonomy smoke tests passed:
  - trusted third-party with source name/reference inserts and cleans up
  - memory-based with source reference inserts and cleans up
  - AI practice without source reference inserts and cleans up
  - trusted third-party without source name is rejected
  - memory-based without source reference is rejected
  - trusted third-party with `is_verified = true` is rejected

PYQ data added on 2026-05-11:

- Added 11 Bihar SI practice samples as `source = ai_generated` and `is_verified = false`.
- No verified PYQ rows were inserted because no official/question-paper `source_reference` was available during this pass.
- Topics covered by unverified practice samples:
  - Maths: Percentage, Ratio & Proportion, Profit & Loss
  - Reasoning: Analogy, Series
  - GK/GS: Modern Indian History, Indian Polity, Bihar GK
  - Hindi: विलोम शब्द, पर्यायवाची शब्द, मुहावरे और लोकोक्तियाँ

Source references used:

- None for verified PYQ insertion. Verified insertion was intentionally skipped.
- The inserted rows are AI-generated practice samples only and are clearly marked unverified.

PYQ checks from this pass:

- PYQ filter counts returned expected results for exam, year, subject, chapter, difficulty, and verified-only filters.
- Verified-only filter returned `0`, as expected.
- Admin/debug PYQ count should now report total PYQ count as `11` and verified PYQ count as `0`.
- Hindi/Devanagari sample rows were checked after insertion and corrected to preserve Unicode text.
- `source_reference` migration was applied to live Supabase after this pass. The column is now readable through Supabase, and the verification constraints are present on `pyq_questions`.
- Verified import is still intentionally empty until an official/question-paper source reference is available.
- Verified-only filter now means `source = verified_pyq` and `is_verified = true`; third-party, memory-based, and AI practice are excluded.
- Existing 11 Bihar SI AI practice rows remain `source = ai_generated` and `is_verified = false`.
- Admin import was tested for all source types through server/DB validation paths; no bulk imports were created.

Controlled PYQ practice import on 2026-05-11:

- Imported 5 Bihar SI questions from the tracked Testbook Bihar Police SI Mains Previous Year Paper, Held on 24 April 2022 Shift 1, English PDF.
- Imported IDs:
  - `tb-bihar-si-2022-mains-s1-q005`
  - `tb-bihar-si-2022-mains-s1-q016`
  - `tb-bihar-si-2022-mains-s1-q022`
  - `tb-bihar-si-2022-mains-s1-q038`
  - `tb-bihar-si-2022-mains-s1-q073`
- Every imported row uses `source = trusted_third_party`, `verification_status = in_review`, `source_name = Testbook`, and `is_verified = false`.
- No rows were imported as `verified_pyq`.
- Each imported row includes `source_reference` with paper/date/shift/language and exact Testbook question number.
- Verified-only filter still returns only `source = verified_pyq` and `is_verified = true`; after this import it returned `0`.
- Admin/debug PYQ counts after import: total `16`, official verified `0`, trusted third-party `5`, AI practice `11`.
- PYQ card source fields were code-checked for mobile wrapping via `min-w-0 break-words` on source reference, source name, verification status, and source URL.

PYQ third-party review workflow on 2026-05-11:

- Added admin-only `/dashboard/pyq/review` for trusted third-party practice review.
- Normal users are blocked server-side with `notFound()` through the shared `ADMIN_EMAILS` / `PYQ_ADMIN_EMAILS` helper.
- Added `updatePYQReviewStatus()` server action with only these safe transitions:
  - `trusted_third_party` `in_review` → `third_party_reviewed`
  - `trusted_third_party` `third_party_reviewed` → `in_review`
  - `trusted_third_party` `in_review` → `memory_based`
- The review action never allows `source = verified_pyq` or `is_verified = true`.
- Promoted one imported Testbook row, `tb-bihar-si-2022-mains-s1-q005`, to `third_party_reviewed`.
- Verified count remains `0`.
- Third-party reviewed count is now `1`; third-party in-review count is now `4`.
- Verified-only filter still returns `0` because third-party reviewed rows are not official verified PYQs.

PYQ admin correction workflow on 2026-05-11:

- Added admin-only `/dashboard/pyq/admin/[questionId]/edit` for safe PYQ/practice row corrections.
- Added audit columns through migration `20260511020000_pyq_admin_correction_audit.sql`: `review_note`, `updated_by`, and `updated_at`.
- Edit form supports exam, year, subject, chapter, difficulty, question, options, answer, explanation, source reference, source name, source URL, source, verification status, and review note.
- Server action `updatePYQQuestion()` reuses source-specific validation:
  - `verified_pyq` requires chapter, answer, source reference, and saves `is_verified = true`
  - `trusted_third_party` requires source name and source reference, and saves `is_verified = false`
  - `memory_based` requires source reference and saves `is_verified = false`
  - `ai_generated` saves as unverified practice
  - subject/exam and chapter/exam/subject mappings are validated before update
- Server action `deletePYQQuestion()` is admin-only and revalidates PYQ, review, and admin debug pages.
- Review queue cards now include an Edit button for correction before status changes.
- Manual import page includes an admin-only Review Queue button.
- Edit smoke test updated `tb-bihar-si-2022-mains-s1-q005` with a review note while keeping `source = trusted_third_party`, `verification_status = third_party_reviewed`, and `is_verified = false`.
- Delete smoke test inserted and deleted one temporary unverified QA row only; final temporary row count was `0`.
- Invalid trust transitions were rejected: `trusted_third_party` with `is_verified = true` and `verified_pyq` without `source_reference`.
- Verified-only filter remains official-only; live official verified count remains `0`, trusted third-party reviewed count `1`, trusted third-party in-review count `4`.

PYQ auto-validation pipeline on 2026-05-11:

- Added migration `20260511030000_pyq_auto_validation.sql`.
- Extended `verification_status` to support `official_verified`, `system_validated`, `needs_manual_review`, `third_party_reviewed`, `in_review`, `memory_based`, `ai_practice`, and `auto_rejected`.
- Added `auto_review_score`, `auto_review_flags`, `auto_reviewed_at`, and `auto_rejection_reason` to `pyq_questions`.
- Added trusted third-party source config in `lib/pyq-trust.ts` for Testbook, Adda247, SSCAdda, and CareerPower.
- Added `autoValidatePYQInput()` and integrated it into `createPYQQuestion()` and `updatePYQQuestion()`.
- Clean trusted-source rows can become `system_validated` while staying `source = trusted_third_party` and `is_verified = false`.
- Incomplete trusted-source rows can become `needs_manual_review`.
- Duplicate rows are flagged with `possible_duplicate`.
- Auto-rejected rows are hidden from the student PYQ page and shown only in admin review/debug surfaces.
- Review queue now has sections for Needs Manual Review, System Validated, Human Reviewed, and Auto Rejected.
- Admin actions now support mark human reviewed, send to manual review, mark memory-based, reject row, and restore rejected row.
- Student PYQ page hides `needs_manual_review` and `auto_rejected` rows unless the user is an admin.
- Verified-only filter remains official-only: `source = verified_pyq` and `is_verified = true`.
- Live migration was applied and the new columns were confirmed readable.
- Temporary QA rows verified the new statuses: `system_validated`, `needs_manual_review`, duplicate flagged, and `auto_rejected`; all temporary rows were deleted.
- Non-admin review/edit access remains protected through server-side `notFound()` checks on `/dashboard/pyq/review` and `/dashboard/pyq/admin/[questionId]/edit`.

PYQ attempt tracking and mistake loop on 2026-05-11:

- Added migration `20260511050000_user_pyq_attempts.sql` for `user_pyq_attempts`.
- RLS policies were added so users can select, insert, update, and delete only their own PYQ attempts.
- Live Supabase migration was applied and verified with 4 `user_pyq_attempts` RLS policies present.
- Added attempt actions for submit, revision mark toggle, and clearing an attempt.
- Correct and incorrect attempts are stored by comparing selected answer with the stored PYQ answer.
- Marked-for-revision rows can exist even before an answer is submitted, so students can save questions for later.
- PYQ practice cards now support option selection, submit answer, correct/incorrect status, mistake notes, answer/explanation reveal, revision marks, and clear attempt.
- Added PYQ filters for attempted, not attempted, incorrect, and marked for revision.
- Revision Queue now includes incorrect PYQs and PYQs marked for revision.
- Weak-area detection now raises chapter priority from incorrect PYQ attempts for the active plan exam.
- Admin Debug now reports total PYQ attempts, incorrect PYQ attempts, and marked PYQ revisions.
- Existing PYQ source trust rules were not changed; no Groq work and no bulk PYQ imports were added.

## Commands Run

- Supabase admin insert for 11 unverified Bihar SI AI-generated practice samples.
- Supabase filter/count checks for PYQ exam/year/subject/chapter/difficulty/verified-only behavior.
- Applied `supabase/migrations/20260511000000_pyq_source_reference.sql` to live Supabase using the project Postgres connection.
- Verified live `pyq_questions.source_reference` is readable through Supabase.
- Added and applied `supabase/migrations/20260511010000_pyq_source_trust_taxonomy.sql`.
- Verified source taxonomy constraints preserve existing AI practice rows and reject unsafe trust labels.
- Resolved the tracked Testbook PDF viewer to a Testbook resource API response and English PDF URL for Bihar SI Mains 24 Apr 2022 Shift 1.
- Extracted exact question text/numbers from the Testbook English PDF for a controlled 5-question third-party practice import.
- Inserted 5 rows as `trusted_third_party`, `verification_status = in_review`, `source_name = Testbook`, and `is_verified = false`.
- Verified post-import PYQ counts: total `16`, official verified `0`, trusted third-party `5`, AI practice `11`, verified-only filter `0`.
- Added `/dashboard/pyq/review` and promoted one Testbook row to `third_party_reviewed` while preserving `source = trusted_third_party` and `is_verified = false`.
- Verified post-review PYQ counts: total `16`, official verified `0`, trusted third-party `5`, third-party in review `4`, third-party reviewed `1`, verified-only filter `0`.
- Added and applied `supabase/migrations/20260511020000_pyq_admin_correction_audit.sql`.
- Verified live audit columns are present on `pyq_questions`: `review_note`, `updated_by`, `updated_at`.
- Updated one Testbook row through correction smoke data and deleted one temporary QA row.
- Verified invalid source/verification combinations are rejected by `pyq_source_verification_check`.
- Added and applied `supabase/migrations/20260511030000_pyq_auto_validation.sql`.
- Verified temporary auto-validation rows were accepted with the expected statuses and then deleted.
- Added and applied `supabase/migrations/20260511050000_user_pyq_attempts.sql`.
- Verified live `user_pyq_attempts` table has 4 owner-only RLS policies.
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run audit`
- Verified live official verified count remains `0`; temporary QA row count returned `0`.
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run audit`
