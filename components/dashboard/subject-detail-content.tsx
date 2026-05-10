"use client"

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, BookOpen, CheckCircle2, Circle, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import type { ActivePlanSubjectDetail, SubjectChapterProgress } from '@/lib/types'
import { SubjectIcon } from '@/components/dashboard/subject-icon'

interface SubjectDetailContentProps {
  detail: ActivePlanSubjectDetail
}

function getStatusBadge(status: SubjectChapterProgress['status']) {
  switch (status) {
    case 'completed':
      return <Badge className="border-green-500/20 bg-green-500/10 text-green-500">Completed</Badge>
    case 'in_progress':
      return <Badge className="border-yellow-500/20 bg-yellow-500/10 text-yellow-500">In Progress</Badge>
    default:
      return <Badge variant="outline">Not Started</Badge>
  }
}

function getStatusIcon(status: SubjectChapterProgress['status']) {
  if (status === 'completed') return <CheckCircle2 className="h-4 w-4 text-green-500" />
  if (status === 'in_progress') return <Play className="h-4 w-4 text-yellow-500" />
  return <Circle className="h-4 w-4 text-muted-foreground" />
}

export function SubjectDetailContent({ detail }: SubjectDetailContentProps) {
  const subject = detail.subject
  const completedChapters = detail.chapters.filter((chapter) => chapter.status === 'completed').length
  const inProgressChapters = detail.chapters.filter((chapter) => chapter.status === 'in_progress').length
  const totalChapters = detail.chapters.length

  return (
    <div className="space-y-6 p-6">
      <div className="flex min-w-0 items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/subjects">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {subject?.icon && <SubjectIcon icon={subject.icon} className="h-5 w-5 shrink-0" />}
            <h1 className="min-w-0 break-words text-2xl font-bold leading-relaxed">{subject?.name}</h1>
          </div>
          <p className="text-muted-foreground">
            {totalChapters} chapters | {detail.completedTasks}/{detail.totalTasks} tasks completed
          </p>
        </div>
      </div>

      {!detail.plan ? (
        <Card>
          <CardContent className="py-8">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BookOpen />
                </EmptyMedia>
                <EmptyTitle>No active plan found</EmptyTitle>
                <EmptyDescription>
                  Complete onboarding or regenerate a plan to view subject chapter progress.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Subject Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Task Completion</span>
                  <span className="font-medium">{detail.percentage}%</span>
                </div>
                <Progress value={detail.percentage} className="h-2" />
                <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">{completedChapters}</div>
                    <div className="text-xs text-muted-foreground">Completed Chapters</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-500">{inProgressChapters}</div>
                    <div className="text-xs text-muted-foreground">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-muted-foreground">{Math.max(0, totalChapters - completedChapters - inProgressChapters)}</div>
                    <div className="text-xs text-muted-foreground">Not Started</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <BookOpen className="h-5 w-5" />
              Chapters
            </h2>

            {detail.chapters.length > 0 ? (
              <div className="space-y-2">
                {detail.chapters.map((chapter, index) => (
                  <motion.div
                    key={chapter.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <Card className="border-border/50 bg-card/50 backdrop-blur transition-colors hover:bg-card/80">
                      <CardContent className="p-4">
                        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                              {chapter.order_index}
                            </div>
                            <div className="min-w-0 space-y-2">
                              <h3 className="min-w-0 break-words font-medium leading-relaxed">{chapter.name}</h3>
                              <div className="flex min-w-0 flex-wrap items-center gap-2">
                                {getStatusBadge(chapter.status)}
                                <span className="text-xs text-muted-foreground">
                                  {chapter.completedTasks}/{chapter.totalTasks} plan tasks
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex min-w-0 items-center gap-3 sm:min-w-40">
                            {getStatusIcon(chapter.status)}
                            <div className="min-w-0 flex-1">
                              <Progress value={chapter.percentage} className="h-2" />
                            </div>
                            <span className="w-10 text-right text-sm font-medium">{chapter.percentage}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className="border-border/50 bg-card/50">
                <CardContent className="p-8">
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <BookOpen />
                      </EmptyMedia>
                      <EmptyTitle>No chapters found</EmptyTitle>
                      <EmptyDescription>
                        This subject has no chapters for the active plan exam.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  )
}
