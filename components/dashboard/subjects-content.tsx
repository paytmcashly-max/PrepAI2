'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { 
  BookOpen, 
  TrendingUp, 
  Zap, 
  Target,
  ArrowRight,
} from 'lucide-react'
import type { SubjectProgress } from '@/lib/types'
import { SubjectIcon } from '@/components/dashboard/subject-icon'

interface SubjectsContentProps {
  subjects: SubjectProgress[]
  hasActivePlan: boolean
}

export function SubjectsContent({ subjects, hasActivePlan }: SubjectsContentProps) {
  const overallProgress = subjects.length > 0 
    ? Math.round(subjects.reduce((sum, s) => sum + s.percentage, 0) / subjects.length)
    : 0

  const strongestSubject = subjects.reduce((prev, curr) => 
    curr.percentage > prev.percentage ? curr : prev
  , subjects[0])

  const weakestSubject = subjects.reduce((prev, curr) => 
    curr.percentage < prev.percentage ? curr : prev
  , subjects[0])

  const totalTasks = subjects.reduce((sum, s) => sum + s.totalTasks, 0)
  const completedTasks = subjects.reduce((sum, s) => sum + s.completedTasks, 0)

  return (
    <div className="space-y-5 p-4 sm:space-y-6 sm:p-6">
      <div className="min-w-0">
        <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">Subject Progress</h1>
        <p className="break-words text-sm text-muted-foreground sm:text-base">Track your performance across all subjects</p>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Preparation Progress</CardTitle>
          <CardDescription>Average across all subjects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-4xl font-bold">{overallProgress}%</p>
            </div>
            <div className="sm:text-right">
              <p className="text-sm text-muted-foreground mb-1">Tasks Completed</p>
              <p className="font-semibold">{completedTasks} / {totalTasks}</p>
            </div>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </CardContent>
      </Card>

      {/* Subject Cards */}
      <div>
        <h2 className="text-xl font-bold mb-4">Subject-Wise Breakdown</h2>
        {subjects.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <BookOpen />
                  </EmptyMedia>
                  <EmptyTitle>{hasActivePlan ? 'No subject tasks yet' : 'No active plan found'}</EmptyTitle>
                  <EmptyDescription>
                    {hasActivePlan
                      ? 'Subject cards appear after your active study plan has generated tasks.'
                      : 'Complete onboarding or regenerate a plan to start tracking subject progress.'}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {subjects.map((subject) => (
            <Card key={subject.id} className="overflow-hidden">
              <div 
                className="h-1" 
                style={{ backgroundColor: subject.color || '#3B82F6' }}
              />
              <CardContent className="p-4 sm:p-6">
                <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div 
                      className="flex h-12 w-12 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${subject.color}20` || '#3B82F620' }}
                    >
                      <span style={{ color: subject.color || '#3B82F6' }}>
                        <SubjectIcon icon={subject.icon} className="h-6 w-6" />
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="break-words font-bold">{subject.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {subject.completedTasks} / {subject.totalTasks} tasks
                      </p>
                    </div>
                  </div>
                  <div 
                    className="w-fit rounded-full px-3 py-1 text-sm font-semibold"
                    style={{ 
                      backgroundColor: `${subject.color}20` || '#3B82F620',
                      color: subject.color || '#3B82F6'
                    }}
                  >
                    {subject.percentage}%
                  </div>
                </div>

                <Progress 
                  value={subject.percentage}
                  className="h-2 mb-4"
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Completed</p>
                    <p className="break-words font-semibold">{subject.completedTasks} tasks</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Remaining</p>
                    <p className="break-words font-semibold">{subject.totalTasks - subject.completedTasks} tasks</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button asChild variant="outline" className="w-full sm:flex-1">
                    <Link href={`/dashboard/subjects/${subject.id}`}>
                      Chapters
                      <BookOpen className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full sm:flex-1">
                    <Link href={`/dashboard/tasks?subject=${subject.id}`}>
                      Tasks
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        )}
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="min-w-0 rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-5 w-5 text-blue-500" />
                <p className="text-sm text-muted-foreground">Total Tasks</p>
              </div>
              <p className="text-2xl font-bold">{totalTasks}</p>
            </div>
            <div className="min-w-0 rounded-lg border border-green-500/20 bg-green-500/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <p className="text-2xl font-bold">{completedTasks}</p>
            </div>
            <div className="min-w-0 rounded-lg border border-purple-500/20 bg-purple-500/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-purple-500" />
                <p className="text-sm text-muted-foreground">Strongest</p>
              </div>
              <p className="break-words text-lg font-bold">
                {strongestSubject?.name || 'N/A'}
              </p>
            </div>
            <div className="min-w-0 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-amber-500" />
                <p className="text-sm text-muted-foreground">Focus Area</p>
              </div>
              <p className="break-words text-lg font-bold">
                {weakestSubject?.name || 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
