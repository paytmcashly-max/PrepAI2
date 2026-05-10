import Link from 'next/link'
import { AlertTriangle, BookOpen, ClipboardList, ListChecks, RotateCcw, TimerReset } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import type { RevisionQueueData, UserDailyTask } from '@/lib/types'

interface RevisionQueueContentProps {
  queue: RevisionQueueData
}

function priorityClass(priority: 'low' | 'medium' | 'high') {
  if (priority === 'high') return 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300'
  if (priority === 'medium') return 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300'
  return 'border-muted bg-muted text-muted-foreground'
}

function TaskRow({ task }: { task: UserDailyTask }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Badge variant="outline">{task.task_date}</Badge>
        <Badge className={priorityClass(task.priority)}>{task.priority}</Badge>
        <Badge variant="secondary">{task.task_type}</Badge>
      </div>
      <p className="mt-2 min-w-0 break-words font-medium leading-relaxed">{task.title}</p>
      {task.description && (
        <p className="mt-1 min-w-0 break-words text-sm leading-relaxed text-muted-foreground">{task.description}</p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        {task.subject?.name || task.subject_id || 'General'}{task.chapter?.name ? ` • ${task.chapter.name}` : ''}
      </p>
    </div>
  )
}

export function RevisionQueueContent({ queue }: RevisionQueueContentProps) {
  const hasQueueData = queue.overdueTasks.length > 0
    || queue.weakChapters.length > 0
    || queue.mockWeakAreas.length > 0
    || queue.currentWeekRevisionTasks.length > 0
    || queue.suggestedOrder.length > 0

  if (!queue.plan) {
    return (
      <div className="p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RotateCcw />
            </EmptyMedia>
            <EmptyTitle>No active plan found</EmptyTitle>
            <EmptyDescription>Complete onboarding or regenerate a plan to build your revision queue.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Revision Queue</h1>
        <p className="text-muted-foreground">
          Non-AI revision priorities from your active plan, overdue tasks, weak chapters, and mock results.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Overdue Tasks</p>
            <p className="mt-1 text-3xl font-bold">{queue.overdueTasks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Weak Chapters</p>
            <p className="mt-1 text-3xl font-bold">{queue.weakChapters.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Mock Weak Areas</p>
            <p className="mt-1 text-3xl font-bold">{queue.mockWeakAreas.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Plan Day</p>
            <p className="mt-1 text-3xl font-bold">{queue.currentDay}</p>
          </CardContent>
        </Card>
      </div>

      {!hasQueueData && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ListChecks />
            </EmptyMedia>
            <EmptyTitle>No revision pressure yet</EmptyTitle>
            <EmptyDescription>Keep completing tasks and logging mocks. The queue will fill as weak areas appear.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5" />
            Suggested Order for Today
          </CardTitle>
          <CardDescription>Start from the top and stop when today&apos;s revision time is done.</CardDescription>
        </CardHeader>
        <CardContent>
          {queue.suggestedOrder.length > 0 ? (
            <div className="space-y-3">
              {queue.suggestedOrder.map((item, index) => (
                <div key={item.id} className="flex min-w-0 flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <Badge className={priorityClass(item.priority)}>{item.priority}</Badge>
                      <p className="min-w-0 break-words font-medium">{item.title}</p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{item.reason}</p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={item.actionTarget}>Review now</Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No suggested revision items for today.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TimerReset className="h-5 w-5" />
                Overdue Tasks
              </CardTitle>
              <CardDescription>Pending active-plan tasks with dates before today.</CardDescription>
            </div>
            {queue.overdueTasks.length > 0 && (
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/backlog">Manage backlog</Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {queue.overdueTasks.length > 0 ? (
              <div className="space-y-3">
                {queue.overdueTasks.map((task) => <TaskRow key={task.id} task={task} />)}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No overdue tasks in the active plan.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Top Weak Chapters
            </CardTitle>
            <CardDescription>Chapters with the most incomplete active-plan tasks.</CardDescription>
          </CardHeader>
          <CardContent>
            {queue.weakChapters.length > 0 ? (
              <div className="space-y-3">
                {queue.weakChapters.map((chapter) => (
                  <div key={chapter.chapter_id || chapter.chapter_name} className="rounded-lg border p-4">
                    <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                      <p className="min-w-0 break-words font-medium">{chapter.chapter_name}</p>
                      <Badge className={priorityClass(chapter.priority)}>{chapter.priority}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {chapter.subject_name || chapter.subject_id || 'Subject'} • {chapter.pendingTasks}/{chapter.totalTasks} tasks pending
                    </p>
                    {chapter.subject_id && (
                      <Button asChild size="sm" variant="outline" className="mt-3">
                        <Link href={`/dashboard/subjects/${chapter.subject_id}`}>Open subject</Link>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No weak chapters detected yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Mock Weak Areas
            </CardTitle>
            <CardDescription>Repeated weak areas from logged mock results for the active exam.</CardDescription>
          </CardHeader>
          <CardContent>
            {queue.mockWeakAreas.length > 0 ? (
              <div className="space-y-3">
                {queue.mockWeakAreas.map((area) => (
                  <div key={area.area} className="flex items-center justify-between gap-3 rounded-lg border p-4">
                    <p className="min-w-0 break-words font-medium">{area.area}</p>
                    <Badge variant="secondary">{area.count}x</Badge>
                  </div>
                ))}
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/mock-tests">Open mock tracker</Link>
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No mock weak areas logged for this active exam.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Current Week Revision Tasks
            </CardTitle>
            <CardDescription>Revision tasks scheduled this calendar week.</CardDescription>
          </CardHeader>
          <CardContent>
            {queue.currentWeekRevisionTasks.length > 0 ? (
              <div className="space-y-3">
                {queue.currentWeekRevisionTasks.map((task) => <TaskRow key={task.id} task={task} />)}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No revision tasks scheduled this week.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
