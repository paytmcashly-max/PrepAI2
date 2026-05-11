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

PYQ practice hardening on 2026-05-11:

- Added deterministic `normalizePYQAnswer()` / `pyqAnswersMatch()` helpers.
- Answer matching now supports option letters including `A`, `a`, `(A)`, and `Option A`.
- Answer matching still supports exact option text matching.
- Simple numeric matching now treats values like `12` and `12.0` as equal, and treats `50%` and `50 percent` as equal.
- Added Learning Mode and Test Mode on `/dashboard/pyq`; default is Learning Mode.
- Learning Mode allows answer/explanation reveal before an attempt.
- Test Mode locks answer/explanation reveal until an answer is submitted.
- Incorrect submissions focus the mistake note field so students can immediately write the mistake.
- Marked-for-revision cards now show a clear revision banner and visual card highlight.
- Clearing an attempt asks for confirmation when a mistake note exists.
- Server-side attempt actions now reject `needs_manual_review` and `auto_rejected` PYQs.
- Attempts continue to update Revision Queue, Weak Areas, Dashboard, PYQ, and Admin Debug surfaces through revalidation.

PYQ progress analytics on 2026-05-11:

- Added `getPYQProgressSummary(userId)` for visible PYQs only, excluding `needs_manual_review` and `auto_rejected` rows from student analytics.
- `/dashboard/pyq` now shows Attempted, Accuracy, Incorrect, and Marked Revision summary cards.
- Accuracy calculation is `correct / attempted` and returns `0%` when the user has no attempted answers.
- Added Weakest PYQ Subjects and Weakest PYQ Chapters sections based on incorrect attempts.
- Added Recent Attempts cards linking back to the related PYQ card.
- URL attempt filters now initialize from `/dashboard/pyq?attempt=incorrect` and `/dashboard/pyq?attempt=marked`.
- Dashboard now includes a compact PYQ Progress card with attempted/total, accuracy, incorrect count, and links to PYQ practice/revision.
- Revision Queue PYQ mistake items now link to the related PYQ card and the relevant attempt filter where possible.
- No Groq, bulk PYQ imports, or source-trust rule changes were made.

PYQ analytics UX hardening on 2026-05-11:

- PYQ cards use stable `pyq-{question.id}` DOM ids for hash-link scrolling.
- Recent attempt links and Revision Queue PYQ links point to the matching card hash with the relevant attempt filter.
- Dashboard `Review incorrect` link opens `/dashboard/pyq?attempt=incorrect`.
- `submitPYQAttempt`, `togglePYQRevisionMark`, and `clearPYQAttempt` now trigger `router.refresh()` from the PYQ page so summary cards refresh from server data.
- Attempt URL filters were checked for `?attempt=incorrect` and `?attempt=marked`; changing the attempt filter preserves `mode=test`.
- Empty states now clearly say `No wrong attempts yet.`, `No weak chapter pattern yet.`, and `Submit a PYQ answer to build history.`

Adaptive PYQ revision recommendations on 2026-05-11:

- Added `getAdaptiveRevisionRecommendations(userId)` using active-plan exam, incorrect PYQ attempts, marked-for-revision PYQs, visible PYQ rows only, and existing pending active-plan tasks.
- Repeated incorrect attempts in the same chapter produce high-priority recommendations.
- One incorrect attempt plus a revision mark produces a medium-priority recommendation.
- Marked-only recommendations produce low/medium priority depending on count.
- `needs_manual_review` and `auto_rejected` PYQs are ignored.
- Dashboard now shows the top 3 Adaptive Revision Recommendations with links to PYQ review or the Revision Queue.
- Revision Queue now has a separate Adaptive Recommendations section.
- Added `createAdaptiveRevisionTask()` to create a deterministic revision task for today from a recommendation.
- Duplicate pending revision tasks for the same chapter/subject are prevented within a 7-day window.
- Created tasks use `task_type = revision`, the recommendation priority, current active plan, and three deterministic `how_to_study` steps.
- No Groq, bulk PYQ imports, or source-trust rule changes were made.

Adaptive PYQ recommendation hardening on 2026-05-11:

- Recommendation IDs now use stable prefixes: `chapter:<id>`, `subject:<id>`, or `question:<id>`.
- `createAdaptiveRevisionTask()` validates the prefixed ID format before resolving the current recommendation.
- Revision Queue respects `action_type`: `revision_task` shows Create revision task, while `pyq_review` hides creation and shows review-only/recent-task messaging.
- Recommendations with no subject/chapter mapping are review-only and cannot create revision tasks.
- Duplicate prevention remains server-side and now returns a friendlier message when a pending revision task exists within 7 days.
- Successful task creation calls `router.refresh()` so recommendation counts and action states do not stay stale.
- No Groq, bulk PYQ imports, or source-trust rule changes were made.

Groq Coach v1 safe explainer on 2026-05-11:

- Added server-only Groq wrapper in `lib/ai/groq.ts` using native `fetch`, `GROQ_API_KEY`, optional `GROQ_MODEL`, timeout handling, and graceful fallback results.
- Added sanitized coach context builders in `lib/ai/coach-context.ts`.
- Coach context includes only active exam, current day, today task summaries, PYQ progress, weak areas, adaptive recommendations, and visible PYQ question/answer/explanation/attempt data.
- Coach context excludes user email, auth id, env values, admin-only PYQ rows, `auto_rejected`, and `needs_manual_review` content.
- Added `explainPYQMistake(questionId)` for authenticated, visible student PYQs only.
- Added `getDailyCoachSuggestions()` with deterministic fallback suggestions when `GROQ_API_KEY` is missing or Groq fails.
- PYQ cards now show “Ask Coach” only after an attempt or answer reveal, with loading/error states and an authoritative source-label warning.
- Dashboard now includes a Daily Coach card with three suggestions.
- Groq output is display-only; no AI output is written to Supabase.
- No fake verified PYQs were generated, no bulk imports were added, and PYQ source trust rules were not changed.

Groq Coach v1 hardening on 2026-05-11:

- Dashboard initial render no longer waits for Groq; it loads deterministic fallback suggestions immediately.
- Daily Coach now has an explicit `Refresh with AI Coach` button for on-demand Groq calls.
- Missing `GROQ_API_KEY`, Groq failures, cooldowns, and invalid JSON responses fall back to deterministic suggestions with a visible reason.
- Daily Coach asks Groq for JSON `{ "suggestions": [...] }` and uses fallback if parsing fails or fewer than 3 suggestions are returned.
- PYQ Ask Coach remains on-demand only after an attempt or answer reveal; there is no explanation prefetch.
- PYQ Coach includes the source warning and the extra line: `AI explains the stored question; it does not verify the source.`
- Added lightweight server-side cooldowns: 30 seconds for Daily Coach refresh and 10 seconds for PYQ Coach.
- Added client-side cooldown states so repeated clicks do not spam Groq while a request/cooldown is active.
- Coach context still excludes user email, auth id, env values, admin-only PYQ rows, `auto_rejected`, and `needs_manual_review` content.
- Groq remains display-only; no AI output is written to Supabase.

Production readiness hardening on 2026-05-11:

- Added production smoke checklist coverage for auth redirect, onboarding, dashboard, Daily Tasks, Backlog, Revision Queue, PYQ practice, PYQ attempt submit, PYQ Ask Coach missing-key fallback, Dashboard Daily Coach fallback, admin PYQ import/review/edit protection, and mobile layout pass.
- Existing route loading/error states were audited for dashboard, tasks, PYQ, revision, admin debug, admin PYQ import, admin PYQ review, and admin PYQ edit. No broad UI feature expansion was added.
- Supabase server/admin env handling now fails with explicit missing-variable errors instead of non-null assertion crashes.
- `GROQ_API_KEY` remains optional; missing key uses deterministic coach fallback. Missing `GROQ_MODEL` still uses the default model.
- Admin debug now shows app version, latest commit when provided by Vercel, Groq configured true/false without secrets, visible PYQ count, PYQ attempts, adaptive recommendation count, and source-trust counts.
- `/dashboard/pyq/admin` now hard-404s for non-admin users, matching `/dashboard/admin/debug`, `/dashboard/pyq/review`, and `/dashboard/pyq/admin/[questionId]/edit`.
- Student PYQ queries and Groq context were rechecked to exclude `auto_rejected` and `needs_manual_review` rows.
- Local readiness checks passed: `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run audit`.
- Known remaining issue: production Groq responses require `GROQ_API_KEY` to be configured in Vercel; fallback mode works without it.

Production smoke checklist:

- [x] Auth redirect: logged-out dashboard route redirects through auth guard.
- [x] Onboarding: new user can complete onboarding and generate an active plan.
- [x] Dashboard: active-plan stats, today tasks, weak areas, PYQ progress, and Daily Coach fallback render.
- [x] Daily Tasks: current-day and rescheduled-today tasks render and task completion persists after refresh.
- [x] Backlog: overdue pending tasks can be moved/skipped and completed/skipped tasks stay hidden.
- [x] Revision Queue: overdue tasks, weak chapters, mock weak areas, PYQ items, and adaptive recommendations render or show clear empty states.
- [x] PYQ Practice: visible PYQs render; no-PYQ and no-attempt states are clear.
- [x] PYQ Attempt Submit: correct/incorrect attempt state saves and updates PYQ analytics.
- [~] PYQ Ask Coach fallback/missing key: Ask Coach passed with Groq configured in production; missing-key fallback was not applicable on the live deployment.
- [x] Dashboard Daily Coach fallback: initial dashboard load does not call Groq and renders deterministic suggestions.
- [x] Admin PYQ import/review/edit protected: non-admin users receive 404.
- [x] Mobile layout pass: dashboard, tasks, backlog, revision, PYQ, settings, and admin debug avoid horizontal overflow.

Production smoke run on 2026-05-11T15:20:32+05:30:

- Production URL tested: `https://prepnix.vercel.app`.
- Test user type: disposable confirmed Supabase email/password user; user was deleted after the smoke run.
- Auth redirect passed: `/dashboard` redirected to `/auth/login` when logged out.
- Onboarding passed: Bihar Police SI, 120 days, 3 hours/day, maths weak, physical weak generated a Day 1/120 dashboard with active-plan tasks.
- Dashboard passed: active plan, today tasks, PYQ progress, and deterministic Daily Coach fallback rendered.
- Daily Tasks passed: today tasks rendered and the first checkbox-like task control toggled.
- Backlog, Revision Queue, PYQ Practice, and Plan Settings loaded without server-error states.
- PYQ attempt submit passed on a visible AI Practice row; incorrect attempt state and explanation rendered.
- PYQ Ask Coach passed with production Groq configured; response included the authoritative source-label warning and did not claim the AI Practice row was official.
- Non-admin route protection passed for `/dashboard/pyq/admin`, `/dashboard/pyq/review`, and `/dashboard/admin/debug` with 404 responses.
- Mobile overflow check passed at 390px width for dashboard, tasks, backlog, revision, PYQ, and settings.
- Admin access with an admin account was not executed because no admin credentials were available in this session.
- Observed non-blocker: stale aliases `https://prexnix.vercel.app` and `https://prepxnix.vercel.app` return 404; the working production URL is `https://prepnix.vercel.app`.
- Blocking failures found: none.

Admin production QA run on 2026-05-11T16:02:28+05:30:

- Production URL tested: `https://prepnix.vercel.app`.
- Admin account used: `kk7012234@gmail.com` from `PYQ_ADMIN_EMAILS`.
- Admin debug passed: `/dashboard/admin/debug` loaded for the admin account and showed active-plan diagnostics plus health metrics without exposing secrets.
- Admin PYQ import passed: `/dashboard/pyq/admin` loaded for the admin account.
- Admin PYQ review passed: `/dashboard/pyq/review` loaded for the admin account.
- Admin PYQ edit passed: `/dashboard/pyq/admin/[questionId]/edit` loaded for a temporary QA row.
- Non-admin protection passed: a disposable non-admin user saw not-found/404 content for `/dashboard/admin/debug`, `/dashboard/pyq/admin`, `/dashboard/pyq/review`, and `/dashboard/pyq/admin/[questionId]/edit`.
- Temporary PYQ workflow passed: one `ai_generated` / `ai_practice` row was inserted, appeared on `/dashboard/pyq` with the AI Practice badge, edited through the admin correction form, and deleted through the admin delete confirmation.
- Visible PYQ count restored after cleanup: before `16`, after `16`.
- Local missing-key Groq fallback passed with a local production start and no `GROQ_API_KEY`: Dashboard Daily Coach rendered deterministic fallback immediately, `Refresh with AI Coach` returned the missing-key fallback without crashing, and PYQ Ask Coach returned fallback copy without writing AI output to Supabase.
- Temporary QA users and temporary PYQ rows were deleted after the run.
- Known remaining issue: stale aliases `https://prexnix.vercel.app` and `https://prepxnix.vercel.app` still return 404; beta testers should use `https://prepnix.vercel.app`.
- Final checks passed: `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run audit`.
- Beta readiness status: ready for a small controlled beta.

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
- Hardened PYQ answer matching and practice mode behavior without changing source trust rules.
- Added PYQ progress summary cards, weakest subject/chapter analytics, recent attempts, dashboard PYQ progress card, and URL attempt filter initialization.
- Hardened PYQ analytics hash links, summary refresh after actions, URL filter preservation, and empty-state copy.
- Added adaptive PYQ revision recommendations and guarded revision task creation.
- Hardened adaptive recommendation IDs, action-type UI behavior, duplicate messaging, and router refresh after task creation.
- Added Groq Coach v1 safe explainer with missing-key fallback, PYQ mistake explanations, dashboard daily coach, sanitized context, and no DB writes.
- Hardened Groq Coach v1 with non-blocking Dashboard fallback, on-demand AI refresh, JSON parsing fallback, timeout/cooldown handling, and source-authority messaging.
- Hardened production readiness docs, env errors, admin debug health metrics, and admin PYQ import protection.
- Ran production smoke QA against `https://prepnix.vercel.app`; no blocking production bugs were found.
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run audit`
- Verified live official verified count remains `0`; temporary QA row count returned `0`.
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run audit`
