'use client'

import { useEffect, useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronDown, 
  Calendar,
} from 'lucide-react'
import { toggleTaskCompletion } from '@/lib/actions'
import type { DayTaskGroup } from '@/lib/types'
import { cn } from '@/lib/utils'
import { TaskCheckItem } from '@/components/dashboard/task-check-item'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'

interface TasksContentProps {
  dayGroups: DayTaskGroup[]
  todayTaskGroup: DayTaskGroup | null
}

function readCompleted(task: DayTaskGroup['tasks'][number]) {
  return task.status === 'completed'
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value))
}

export function TasksContent({ dayGroups, todayTaskGroup }: TasksContentProps) {
  const searchParams = useSearchParams()
  const currentDayGroup = todayTaskGroup ? dayGroups.find((group) => group.day === todayTaskGroup.day) || null : null
  const [expandedDays, setExpandedDays] = useState<string[]>(
    currentDayGroup?.id ? [currentDayGroup.id] : dayGroups.length > 0 ? [dayGroups[0].id] : []
  )
  const [isPending, startTransition] = useTransition()
  const [localCompletions, setLocalCompletions] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (searchParams.get('focus') !== 'today' || !todayTaskGroup) return

    window.requestAnimationFrame(() => {
      document.getElementById('today-tasks')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [searchParams, todayTaskGroup])

  const toggleDay = (dayId: string) => {
    setExpandedDays((prev) =>
      prev.includes(dayId) ? prev.filter((id) => id !== dayId) : [...prev, dayId]
    )
  }

  const handleToggleTask = (taskId: string, currentCompleted: boolean) => {
    // Optimistic update
    setLocalCompletions(prev => ({
      ...prev,
      [taskId]: !currentCompleted
    }))

    startTransition(async () => {
      try {
        await toggleTaskCompletion(taskId)
      } catch {
        // Revert on error
        setLocalCompletions(prev => ({
          ...prev,
          [taskId]: currentCompleted
        }))
      }
    })
  }

  const getCompletionStatus = (taskId: string, originalCompleted: boolean) => {
    return localCompletions[taskId] !== undefined 
      ? localCompletions[taskId] 
      : originalCompleted
  }

  const totalTasks = dayGroups.reduce((sum, day) => sum + day.totalCount, 0)
  const completedTasks = dayGroups.reduce((sum, day) => {
    return sum + day.tasks.filter(t => getCompletionStatus(t.id, readCompleted(t))).length
  }, 0)
  const completionPercentage = totalTasks > 0 ? clampPercent(Math.round((completedTasks / totalTasks) * 100)) : 0
  const todayTotalTasks = todayTaskGroup?.totalCount || 0
  const todayCompletedTasks = todayTaskGroup
    ? todayTaskGroup.tasks.filter((task) => getCompletionStatus(task.id, readCompleted(task))).length
    : 0
  const todayCompletionPercentage = todayTotalTasks > 0 ? clampPercent(Math.round((todayCompletedTasks / todayTotalTasks) * 100)) : 0

  return (
    <div className="space-y-5 overflow-hidden p-4 sm:space-y-6 sm:p-6">
      <div className="min-w-0">
        <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">Daily Tasks</h1>
        <p className="break-words text-sm text-muted-foreground sm:text-base">Stay consistent with your preparation</p>
      </div>

      {/* Progress Overview */}
      <Card className="overflow-hidden">
        <CardContent className="pt-6">
          <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <p className="mb-1 text-sm font-medium text-muted-foreground">Today&apos;s Progress</p>
              <p className="text-2xl font-bold">{todayCompletedTasks}/{todayTotalTasks} Tasks</p>
            </div>
            <div className="sm:text-right">
              <p className="mb-1 text-sm font-medium text-muted-foreground">Today</p>
              <p className="text-2xl font-bold text-primary">{todayCompletionPercentage}%</p>
            </div>
          </div>
          <Progress value={todayCompletionPercentage} className="h-2" />
          <div className="mt-4 flex flex-wrap justify-between gap-2 text-sm text-muted-foreground">
            <span>Full plan progress</span>
            <span className="font-medium text-foreground">{completedTasks}/{totalTasks} tasks - {completionPercentage}%</span>
          </div>
        </CardContent>
      </Card>

      <Card id="today-tasks" className="scroll-mt-6 overflow-hidden">
        <CardHeader>
          <CardTitle>Today&apos;s Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {todayTaskGroup && todayTaskGroup.tasks.length > 0 ? (
            <div className="space-y-3">
              {todayTaskGroup.tasks.map((task) => {
                const taskCompleted = getCompletionStatus(task.id, readCompleted(task))

                return (
                  <TaskCheckItem
                    key={task.id}
                    task={task}
                    completed={taskCompleted}
                    disabled={isPending}
                    onToggle={handleToggleTask}
                  />
                )
              })}
            </div>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Calendar />
                </EmptyMedia>
                <EmptyTitle>No tasks scheduled for today</EmptyTitle>
                <EmptyDescription>
                  Tasks moved to today from Backlog Manager will appear here with your normal current-day tasks.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>

      {/* Day Groups */}
      <div className="space-y-4">
        {dayGroups.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Calendar />
                  </EmptyMedia>
                  <EmptyTitle>No Tasks Available</EmptyTitle>
                  <EmptyDescription>
                    Tasks will appear here once your active study plan is generated.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CardContent>
          </Card>
        ) : (
          dayGroups.map((dayGroup) => {
            const dayCompletedCount = dayGroup.tasks.filter(
              t => getCompletionStatus(t.id, readCompleted(t))
            ).length

            return (
              <div key={dayGroup.id}>
                <button
                  onClick={() => toggleDay(dayGroup.id)}
                  className="flex w-full min-w-0 flex-col gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-accent/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <ChevronDown
                      className={cn(
                        "mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                        expandedDays.includes(dayGroup.id) && "rotate-180"
                      )}
                    />
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <h3 className="break-words font-semibold">Day {dayGroup.day}</h3>
                        {dayGroup.isRevisionDay && (
                          <Badge variant="secondary" className="whitespace-normal break-words text-xs">Revision</Badge>
                        )}
                        {dayGroup.phaseName && (
                          <Badge variant="outline" className="max-w-full whitespace-normal break-words text-xs">{dayGroup.phaseName}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{dayGroup.date}</p>
                    </div>
                  </div>
                  <div className="shrink-0 sm:text-right">
                    <p className="font-semibold">
                      {dayCompletedCount}/{dayGroup.totalCount}
                    </p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                </button>

                {expandedDays.includes(dayGroup.id) && (
                  <div className="space-y-3 pb-1 pt-3 sm:pl-6">
                    {dayGroup.tasks.map((task) => {
                      const taskCompleted = getCompletionStatus(task.id, readCompleted(task))
                      
                      return (
                        <TaskCheckItem
                          key={task.id}
                          task={task}
                          completed={taskCompleted}
                          disabled={isPending}
                          onToggle={handleToggleTask}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Session Statistics */}
      {dayGroups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Session Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground mb-1">Total Time Estimated</p>
                <p className="text-2xl font-bold">
                  {dayGroups.reduce((sum, day) => 
                    sum + day.tasks.reduce((s, t) => s + t.estimated_minutes, 0), 0
                  )} min
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground mb-1">Average Task Duration</p>
                <p className="text-2xl font-bold">
                  {totalTasks > 0 
                    ? Math.round(dayGroups.reduce((sum, day) => 
                        sum + day.tasks.reduce((s, t) => s + t.estimated_minutes, 0), 0
                      ) / totalTasks)
                    : 0
                  } min
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground mb-1">Tasks Remaining</p>
                <p className="text-2xl font-bold text-amber-500">
                  {totalTasks - completedTasks}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
