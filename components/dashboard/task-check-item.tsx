'use client'

import type React from 'react'
import { CheckCircle2, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import type { UserDailyTask } from '@/lib/types'
import { cn } from '@/lib/utils'
import { SubjectIcon } from '@/components/dashboard/subject-icon'

const priorityColors: Record<string, string> = {
  high: 'bg-red-500/10 text-red-600',
  medium: 'bg-yellow-500/10 text-yellow-600',
  low: 'bg-green-500/10 text-green-600',
}

function subjectBadgeStyle(color?: string | null): React.CSSProperties {
  const resolvedColor = color || 'hsl(var(--muted-foreground))'

  return {
    color: resolvedColor,
    borderColor: `color-mix(in srgb, ${resolvedColor} 32%, transparent)`,
    backgroundColor: `color-mix(in srgb, ${resolvedColor} 12%, transparent)`,
  }
}

interface TaskCheckItemProps {
  task: UserDailyTask
  completed: boolean
  disabled?: boolean
  compact?: boolean
  onToggle: (taskId: string, completed: boolean) => void
}

export function TaskCheckItem({ task, completed, disabled, compact, onToggle }: TaskCheckItemProps) {
  const chapterName = task.chapter?.name || null
  const studySteps = Array.isArray(task.how_to_study) ? task.how_to_study : []

  return (
    <Card className={cn('overflow-hidden transition-opacity', completed && 'opacity-60')}>
      <CardContent className={cn('flex min-w-0 flex-wrap items-start gap-3 sm:flex-nowrap sm:gap-4', compact ? 'p-3' : 'p-4')}>
        <Checkbox
          checked={completed}
          onCheckedChange={() => onToggle(task.id, completed)}
          disabled={disabled}
          className="mt-1 shrink-0"
          aria-label={completed ? `Mark ${task.title} as pending` : `Mark ${task.title} as complete`}
        />
        <div className="min-w-0 flex-1 break-words">
          <div className="mb-2 flex min-w-0 flex-col items-start gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
            {task.subject && (
              <Badge
                variant="outline"
                className="max-w-full whitespace-normal break-words text-left text-xs leading-relaxed"
                style={subjectBadgeStyle(task.subject.color)}
              >
                <SubjectIcon icon={task.subject.icon} className="h-3.5 w-3.5 shrink-0" />
                <span className="ml-1 min-w-0 whitespace-normal break-words">{task.subject.name}</span>
              </Badge>
            )}
            {chapterName && (
              <span className="min-w-0 max-w-full break-words text-xs leading-relaxed text-muted-foreground">
                {chapterName}
              </span>
            )}
          </div>
          <h4 className={cn('min-w-0 whitespace-normal break-words font-medium leading-relaxed', completed && 'line-through text-muted-foreground')}>
            {task.title}
          </h4>
          {task.description && !compact && (
            <p className="mt-1 min-w-0 break-words text-sm leading-relaxed text-muted-foreground">
              {task.description}
            </p>
          )}
          {studySteps.length > 0 && !compact && (
            <ul className="mt-2 min-w-0 space-y-1 text-xs leading-relaxed text-muted-foreground">
              {studySteps.map((step, index) => (
                <li key={`${index}-${step}`} className="flex min-w-0 items-start gap-2">
                  <span className="text-primary">-</span>
                  <span className="min-w-0 break-words">{step}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="ml-9 flex w-full shrink-0 flex-row flex-wrap items-center gap-2 text-left sm:ml-0 sm:w-auto sm:flex-col sm:items-end sm:text-right md:flex-row md:items-center">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm">{task.estimated_minutes}m</span>
          </div>
          {!compact && (
            <Badge className={cn('text-xs', priorityColors[task.priority])}>
              {task.priority}
            </Badge>
          )}
          {completed && (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
