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
      <CardContent className={cn('flex min-w-0 items-start gap-4', compact ? 'p-3' : 'p-4')}>
        <Checkbox
          checked={completed}
          onCheckedChange={() => onToggle(task.id, completed)}
          disabled={disabled}
          className="mt-1 shrink-0"
          aria-label={completed ? `Mark ${task.title} as pending` : `Mark ${task.title} as complete`}
        />
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2">
            {task.subject && (
              <Badge
                variant="outline"
                className="max-w-full truncate text-xs"
                style={subjectBadgeStyle(task.subject.color)}
              >
                <SubjectIcon icon={task.subject.icon} className="h-3.5 w-3.5 shrink-0" />
                <span className="ml-1 truncate">{task.subject.name}</span>
              </Badge>
            )}
            {chapterName && (
              <span className="min-w-0 truncate text-xs text-muted-foreground">
                {chapterName}
              </span>
            )}
          </div>
          <h4 className={cn('min-w-0 font-medium', completed && 'line-through text-muted-foreground')}>
            {task.title}
          </h4>
          {task.description && !compact && (
            <p className="mt-1 text-sm text-muted-foreground">
              {task.description}
            </p>
          )}
          {studySteps.length > 0 && !compact && (
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {studySteps.map((step, index) => (
                <li key={`${index}-${step}`} className="flex items-start gap-2">
                  <span className="text-primary">-</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2 text-right sm:flex-row sm:items-center">
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
