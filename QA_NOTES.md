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

## Commands Run

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run audit`
