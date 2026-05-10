'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AlertTriangle, CalendarDays, CheckSquare, Inbox, MoveRight, SkipForward } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { rescheduleTasks, skipTasks } from '@/lib/actions'
import type { BacklogData, BacklogTaskGroup, UserDailyTask } from '@/lib/types'

interface BacklogContentProps {
  backlog: BacklogData
}

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function todayString() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return formatDate(today)
}

function tomorrowString() {
  const tomorrow = new Date()
  tomorrow.setHours(0, 0, 0, 0)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return formatDate(tomorrow)
}

function displayDate(dateString: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${dateString}T00:00:00`))
}

function priorityClass(priority: UserDailyTask['priority']) {
  if (priority === 'high') return 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300'
  if (priority === 'medium') return 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300'
  return 'border-muted bg-muted text-muted-foreground'
}

function TaskRow({
  task,
  selected,
  disabled,
  onToggle,
}: {
  task: UserDailyTask
  selected: boolean
  disabled: boolean
  onToggle: (taskId: string) => void
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-lg border p-3">
      <Checkbox
        checked={selected}
        onCheckedChange={() => onToggle(task.id)}
        disabled={disabled}
        className="mt-1 shrink-0"
        aria-label={`Select ${task.title}`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-col items-start gap-1.5 sm:flex-row sm:flex-wrap sm:items-center">
          <Badge variant="outline" className="max-w-full whitespace-normal break-words leading-relaxed">
            {task.subject?.name || task.subject_id || 'General'}
          </Badge>
          {task.chapter?.name && (
            <span className="min-w-0 max-w-full break-words text-xs leading-relaxed text-muted-foreground">
              {task.chapter.name}
            </span>
          )}
          <Badge className={priorityClass(task.priority)}>{task.priority}</Badge>
          <Badge variant="secondary">{task.estimated_minutes}m</Badge>
        </div>
        <p className="mt-2 min-w-0 whitespace-normal break-words font-medium leading-relaxed">{task.title}</p>
        {task.description && (
          <p className="mt-1 min-w-0 whitespace-normal break-words text-sm leading-relaxed text-muted-foreground">
            {task.description}
          </p>
        )}
      </div>
    </div>
  )
}

function GroupCard({
  group,
  selectedIds,
  pending,
  onToggleTask,
  onToggleGroup,
}: {
  group: BacklogTaskGroup
  selectedIds: Set<string>
  pending: boolean
  onToggleTask: (taskId: string) => void
  onToggleGroup: (group: BacklogTaskGroup) => void
}) {
  const selectedInGroup = group.tasks.filter((task) => selectedIds.has(task.id)).length
  const allSelected = selectedInGroup === group.tasks.length

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <CardTitle className="min-w-0 break-words text-lg leading-relaxed">{group.subject_name}</CardTitle>
          <CardDescription className="flex min-w-0 flex-wrap items-center gap-2">
            <span>{displayDate(group.date)}</span>
            <span>{group.totalCount} task{group.totalCount === 1 ? '' : 's'}</span>
            <span>{group.totalMinutes} min</span>
          </CardDescription>
        </div>
        <Button
          type="button"
          variant={allSelected ? 'default' : 'outline'}
          size="sm"
          onClick={() => onToggleGroup(group)}
          disabled={pending}
        >
          {allSelected ? 'Unselect group' : 'Select group'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {group.tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            selected={selectedIds.has(task.id)}
            disabled={pending}
            onToggle={onToggleTask}
          />
        ))}
      </CardContent>
    </Card>
  )
}

export function BacklogContent({ backlog }: BacklogContentProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [customDate, setCustomDate] = useState(todayString)
  const [isPending, startTransition] = useTransition()

  const selectedCount = selectedIds.size
  const allTaskIds = useMemo(() => backlog.overdueTasks.map((task) => task.id), [backlog.overdueTasks])

  const toggleTask = (taskId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }

  const toggleGroup = (group: BacklogTaskGroup) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      const allSelected = group.tasks.every((task) => next.has(task.id))
      for (const task of group.tasks) {
        if (allSelected) next.delete(task.id)
        else next.add(task.id)
      }
      return next
    })
  }

  const toggleAll = () => {
    setSelectedIds((current) => {
      if (current.size === allTaskIds.length) return new Set()
      return new Set(allTaskIds)
    })
  }

  const selectedArray = () => Array.from(selectedIds)

  const moveSelected = (date: string, label: string) => {
    if (selectedIds.size === 0) return

    startTransition(async () => {
      try {
        const result = await rescheduleTasks(selectedArray(), date)
        toast.success(`${result.count} task${result.count === 1 ? '' : 's'} moved to ${label}.`)
        setSelectedIds(new Set())
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not move selected tasks.')
      }
    })
  }

  const skipSelected = () => {
    if (selectedIds.size === 0) return

    startTransition(async () => {
      try {
        const result = await skipTasks(selectedArray())
        toast.success(`${result.count} task${result.count === 1 ? '' : 's'} marked skipped.`)
        setSelectedIds(new Set())
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not skip selected tasks.')
      }
    })
  }

  if (!backlog.plan) {
    return (
      <div className="p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox />
            </EmptyMedia>
            <EmptyTitle>No active plan found</EmptyTitle>
            <EmptyDescription>Complete onboarding or regenerate a plan before managing backlog tasks.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Backlog Manager</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            Move overdue active-plan tasks into a realistic date, or mark tasks skipped when they no longer matter.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/revision">
            <CalendarDays className="mr-2 h-4 w-4" />
            Revision Queue
          </Link>
        </Button>
      </div>

      {backlog.totalCount > 0 ? (
        <>
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex min-w-0 flex-wrap items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                {backlog.totalCount} overdue task{backlog.totalCount === 1 ? '' : 's'}
              </CardTitle>
              <CardDescription>
                Selection applies only to pending tasks from your current active plan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" onClick={toggleAll} disabled={isPending}>
                    <CheckSquare className="mr-2 h-4 w-4" />
                    {selectedCount === allTaskIds.length ? 'Clear selection' : 'Select all'}
                  </Button>
                  <Badge variant="secondary">{selectedCount} selected</Badge>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  <Button
                    type="button"
                    onClick={() => moveSelected(todayString(), 'today')}
                    disabled={selectedCount === 0 || isPending}
                  >
                    <MoveRight className="mr-2 h-4 w-4" />
                    Move to today
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => moveSelected(tomorrowString(), 'tomorrow')}
                    disabled={selectedCount === 0 || isPending}
                  >
                    Move to tomorrow
                  </Button>
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      type="date"
                      value={customDate}
                      onChange={(event) => setCustomDate(event.target.value)}
                      disabled={isPending}
                      className="w-full sm:w-[160px]"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => moveSelected(customDate, displayDate(customDate))}
                      disabled={selectedCount === 0 || isPending || !customDate}
                    >
                      Move to date
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={skipSelected}
                    disabled={selectedCount === 0 || isPending}
                  >
                    <SkipForward className="mr-2 h-4 w-4" />
                    Mark skipped
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {backlog.groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                selectedIds={selectedIds}
                pending={isPending}
                onToggleTask={toggleTask}
                onToggleGroup={toggleGroup}
              />
            ))}
          </div>
        </>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox />
            </EmptyMedia>
            <EmptyTitle>No overdue tasks</EmptyTitle>
            <EmptyDescription>
              Your active plan has no pending tasks before today. Clean board, clean mind.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}
