'use client'

import type React from 'react'
import Link from 'next/link'
import { CheckCircle2, Clock, FileText, PlayCircle, HelpCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  const resources = task.studyResources || []
  const practiceSummary = task.originalPracticeSummary
  const noteResources = resources.filter((resource) => resource.resource_type === 'concept_note' || resource.resource_type === 'pdf_note' || resource.resource_type === 'current_affairs' || resource.resource_type === 'physical_training')
  const videoResource = resources.find((resource) => resource.resource_type === 'video_embed')
  const practiceHref = `/dashboard/practice/original?exam=${encodeURIComponent(task.exam_id)}${task.subject_id ? `&subject=${encodeURIComponent(task.subject_id)}` : ''}${task.chapter_id ? `&chapter=${encodeURIComponent(task.chapter_id)}` : ''}`

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
          {!compact && (
            <div className="mt-4 rounded-lg border bg-muted/20 p-3">
              <div className="mb-3 flex min-w-0 flex-wrap items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-primary" />
                <p className="font-medium">Study Material</p>
                <Badge variant="outline" className="whitespace-normal break-words text-xs">Auto Resource Pack</Badge>
              </div>

              {noteResources.length > 0 || (practiceSummary?.availableQuestionCount || 0) > 0 || videoResource ? (
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="min-w-0 rounded-md border bg-background p-3">
                    <p className="mb-1 break-words text-sm font-medium">PrepAI Short Notes</p>
                    {noteResources[0] ? (
                      <>
                        <p className="line-clamp-2 break-words text-xs leading-relaxed text-muted-foreground">{noteResources[0].description || noteResources[0].title}</p>
                        <Button asChild size="sm" variant="outline" className="mt-3 w-full">
                          <Link href={`/dashboard/resources/${noteResources[0].id}`}>
                            Study in app
                          </Link>
                        </Button>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">PrepAI notes are not ready for this topic yet.</p>
                    )}
                  </div>

                  <div className="min-w-0 rounded-md border bg-background p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <PlayCircle className="h-4 w-4 text-muted-foreground" />
                      <p className="break-words text-sm font-medium">Video</p>
                    </div>
                    {videoResource ? (
                      <>
                        <p className="line-clamp-2 break-words text-xs leading-relaxed text-muted-foreground">{videoResource.title}</p>
                        <Button asChild size="sm" variant="outline" className="mt-3 w-full">
                          <Link href={`/dashboard/resources/${videoResource.id}`}>Watch in app</Link>
                        </Button>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">Video not available yet.</p>
                    )}
                  </div>

                  <div className="min-w-0 rounded-md border bg-background p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      <p className="break-words text-sm font-medium">Practice</p>
                    </div>
                    {(practiceSummary?.availableQuestionCount || 0) > 0 ? (
                      <>
                        <p className="break-words text-xs leading-relaxed text-muted-foreground">
                          {practiceSummary?.availableQuestionCount || 0} PrepAI Original MCQs.
                          {practiceSummary?.attemptedCount ? ` ${practiceSummary.attemptedCount} attempted.` : ''}
                        </p>
                        <Badge variant="secondary" className="mt-2 whitespace-normal break-words text-xs">Not Official PYQ</Badge>
                        <Button asChild size="sm" className="mt-3 w-full">
                          <Link href={practiceHref}>Practice in app</Link>
                        </Button>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">PrepAI Original Practice is not ready for this task yet.</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="break-words text-sm text-muted-foreground">
                  PrepAI resource not ready for this task yet. Use your book/notes for now.
                </p>
              )}
            </div>
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
