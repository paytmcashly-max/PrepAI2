# PrepAI2 Beta Notes

Production URL: `https://prepnix.vercel.app`

## What Testers Should Test

- Signup, login, logout, and logged-out redirect behavior.
- New onboarding for Bihar SI, UP Police, SSC GD, and SSC CGL where available.
- Dashboard: today tasks, progress counts, weak areas, PYQ progress, Daily Coach fallback, and mobile layout.
- Daily Tasks: task completion, refresh persistence, and `/dashboard/tasks?focus=today`.
- Backlog: overdue task selection, move to today/tomorrow/custom date, and skip.
- Revision Queue: overdue tasks, weak chapters, mock weak areas, PYQ mistake loop, and adaptive recommendations.
- PYQ Practice: filters, attempt submit, correct/incorrect result, mark for revision, Ask Coach, and source-trust badges.
- Mock tests, notes, subjects, roadmap, and plan settings/regeneration.
- Mobile views for dashboard, tasks, backlog, revision, PYQ, and plan settings.

## Known Limitations

- AI Coach is an explainer only. It does not verify sources, generate official PYQs, or write AI output to the database.
- If `GROQ_API_KEY` is unavailable, the app intentionally falls back to deterministic coaching.
- Official verified PYQ content is limited. Treat only rows labeled `Official Verified PYQ` as real previous-year questions.
- Third-party practice, memory-based content, and AI Practice are not official PYQs.
- Admin PYQ import, review, edit, and debug pages are restricted to configured admin emails.
- Stale aliases such as `https://prexnix.vercel.app` and `https://prepxnix.vercel.app` return 404. Use `https://prepnix.vercel.app`.

## PYQ Source Rule

Do not treat third-party, memory-based, or AI Practice questions as official previous-year questions. Official status requires `source = verified_pyq`, `is_verified = true`, and a real official/question-paper source reference.

## Feedback Checklist

- Device, browser, and screen size.
- Route/page where the issue happened.
- User flow and exam/plan settings used.
- Expected behavior vs. actual behavior.
- Screenshot or screen recording when possible.
- Whether the user was logged out, newly onboarded, or returning.
- Any visible toast, error message, console error, or failed network request.
