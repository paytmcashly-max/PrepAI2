'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronDown, 
  Clock, 
  CheckCircle2,
  Calendar,
} from 'lucide-react'
import { toggleTaskCompletion } from '@/lib/actions'
import type { DayTaskGroup } from '@/lib/types'
import { cn } from '@/lib/utils'
import { SubjectIcon } from '@/components/dashboard/subject-icon'

interface TasksContentProps {
  dayGroups: DayTaskGroup[]
}

const priorityColors: Record<string, string> = {
  'high': 'bg-red-500/10 text-red-600',
  'medium': 'bg-yellow-500/10 text-yellow-600',
  'low': 'bg-green-500/10 text-green-600',
}

type RenderTask = DayTaskGroup['tasks'][number]

function readCompleted(task: RenderTask) {
  return task.status === 'completed'
}

function readChapterName(task: RenderTask): string | null {
  return task.chapter?.name || null
}

function readDescription(task: RenderTask) {
  return task.description
}

function subjectBadgeStyle(color?: string | null): React.CSSProperties {
  const resolvedColor = color || 'hsl(var(--muted-foreground))'

  return {
    color: resolvedColor,
    borderColor: `color-mix(in srgb, ${resolvedColor} 32%, transparent)`,
    backgroundColor: `color-mix(in srgb, ${resolvedColor} 12%, transparent)`,
  }
}

export function TasksContent({ dayGroups }: TasksContentProps) {
  const [expandedDays, setExpandedDays] = useState<string[]>(
    dayGroups.length > 0 ? [dayGroups[0].id] : []
  )
  const [isPending, startTransition] = useTransition()
  const [localCompletions, setLocalCompletions] = useState<Record<string, boolean>>({})

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
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Daily Tasks</h1>
        <p className="text-muted-foreground">Stay consistent with your preparation</p>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Overall Progress</p>
              <p className="text-2xl font-bold">{completedTasks}/{totalTasks} Tasks</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground mb-1">Completion</p>
              <p className="text-2xl font-bold text-primary">{completionPercentage}%</p>
            </div>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </CardContent>
      </Card>

      {/* Day Groups */}
      <div className="space-y-4">
        {dayGroups.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No Tasks Available</h3>
              <p className="text-muted-foreground text-sm">
                Tasks will appear here once the study plan is configured.
              </p>
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
                  className="w-full p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-4 text-left">
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 text-muted-foreground transition-transform",
                        expandedDays.includes(dayGroup.id) && "rotate-180"
                      )}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Day {dayGroup.day}</h3>
                        {dayGroup.isRevisionDay && (
                          <Badge variant="secondary" className="text-xs">Revision</Badge>
                        )}
                        {dayGroup.phaseName && (
                          <Badge variant="outline" className="text-xs">{dayGroup.phaseName}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{dayGroup.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {dayCompletedCount}/{dayGroup.totalCount}
                    </p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                </button>

                {expandedDays.includes(dayGroup.id) && (
                  <div className="space-y-3 pl-6 pt-3 pb-1">
                    {dayGroup.tasks.map((task) => {
                      const taskCompleted = getCompletionStatus(task.id, readCompleted(task))
                      const chapterName = readChapterName(task)
                      const description = readDescription(task)
                      const studySteps = Array.isArray(task.how_to_study) ? task.how_to_study : []
                      
                      return (
                        <Card
                          key={task.id}
                          className={cn(
                            "transition-opacity",
                            taskCompleted && "opacity-60"
                          )}
                        >
                          <CardContent className="p-4 flex items-start gap-4">
                            <Checkbox
                              checked={taskCompleted}
                              onCheckedChange={() => handleToggleTask(task.id, taskCompleted)}
                              disabled={isPending}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                {task.subject && (
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs"
                                    style={subjectBadgeStyle(task.subject.color)}
                                  >
                                    <SubjectIcon icon={task.subject.icon} className="h-3.5 w-3.5" />
                                    <span className="ml-1">{task.subject.name}</span>
                                  </Badge>
                                )}
                                {chapterName && (
                                  <span className="text-xs text-muted-foreground">
                                    {chapterName}
                                  </span>
                                )}
                              </div>
                              <h4 className={cn(
                                "font-medium",
                                taskCompleted && "line-through text-muted-foreground"
                              )}>
                                {task.title}
                              </h4>
                              {description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {description}
                                </p>
                              )}
                              {studySteps.length > 0 && (
                                <ul className="mt-2 text-xs text-muted-foreground space-y-1">
                                  {studySteps.map((step, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="text-primary">-</span>
                                      {step}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-right shrink-0">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span className="text-sm">{task.estimated_minutes}m</span>
                              </div>
                              <Badge className={cn("text-xs", priorityColors[task.priority])}>
                                {task.priority}
                              </Badge>
                              {taskCompleted && (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Time Estimated</p>
                <p className="text-2xl font-bold">
                  {dayGroups.reduce((sum, day) => 
                    sum + day.tasks.reduce((s, t) => s + t.estimated_minutes, 0), 0
                  )} min
                </p>
              </div>
              <div>
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
              <div>
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
