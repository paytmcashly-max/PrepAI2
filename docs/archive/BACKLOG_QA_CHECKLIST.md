# Backlog Manager QA Checklist

Use an authenticated test user with an active study plan and at least one pending task dated before today.

## Move Overdue Task To Today
- Open `/dashboard/backlog`.
- Select one overdue pending task.
- Click `Move to today`.
- Confirm the task disappears from Backlog Manager.
- Confirm the task appears on `/dashboard` in Today's Tasks.
- Confirm the task appears on `/dashboard/tasks?focus=today#today-tasks`.
- Confirm today's completed/total count on Dashboard and Daily Tasks includes the moved task.

## Move Overdue Task To Tomorrow
- Open `/dashboard/backlog`.
- Select one overdue pending task.
- Click `Move to tomorrow`.
- Confirm the task disappears from Backlog Manager.
- Confirm the task does not appear in Dashboard Today&apos;s Tasks.
- Confirm it is still visible in the full Daily Tasks plan under its original day group, with `task_date` set to tomorrow.

## Move Overdue Task To Custom Date
- Open `/dashboard/backlog`.
- Select one or more overdue pending tasks.
- Pick a future custom date.
- Click `Move to date`.
- Confirm selected tasks disappear from Backlog Manager.
- Confirm selected tasks keep their active-plan ownership and updated `task_date`.

## Skip Overdue Task
- Open `/dashboard/backlog`.
- Select one overdue pending task.
- Click `Mark skipped`.
- Confirm the task disappears from Backlog Manager.
- Confirm the skipped task is not counted as overdue in Dashboard or Revision Queue.
- Confirm archived-plan tasks are not modified.

## Dashboard Count Updates
- Move an overdue task to today.
- Refresh `/dashboard`.
- Confirm the overdue alert count decreases.
- Confirm Today&apos;s Tasks total increases.
- Toggle the moved task complete.
- Refresh `/dashboard/tasks?focus=today#today-tasks`.
- Confirm the completed count remains consistent across Dashboard and Daily Tasks.

## Revision Queue Updates
- Move or skip an overdue task from Backlog Manager.
- Open `/dashboard/revision`.
- Confirm the Overdue Tasks count reflects the change.
- Confirm skipped tasks do not appear in Suggested Order for Today.
