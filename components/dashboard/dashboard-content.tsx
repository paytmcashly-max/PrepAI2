'use client'

import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Flame, 
  Target, 
  BookOpen, 
  TrendingUp, 
  Plus, 
  Map, 
  ClipboardList,
  Quote,
  CalendarCheck,
  AlertTriangle,
  Flag,
  Sparkles,
} from 'lucide-react'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TaskCheckItem } from '@/components/dashboard/task-check-item'
import { getDailyCoachSuggestions, toggleTaskCompletion } from '@/lib/actions'
import type { AdaptiveRevisionRecommendation, CoachActionResult, DashboardStats, SubjectProgress, MotivationalQuote, DayTaskGroup, WeakArea, PYQProgressSummary, OriginalPracticeProgressSummary } from '@/lib/types'

interface DashboardContentProps {
  stats: DashboardStats
  subjectProgress: SubjectProgress[]
  quote: MotivationalQuote | null
  todayTaskGroup: DayTaskGroup | null
  weakAreas: WeakArea[]
  overdueTaskCount: number
  pyqProgress: PYQProgressSummary | null
  originalPracticeProgress: OriginalPracticeProgressSummary | null
  adaptiveRecommendations: AdaptiveRevisionRecommendation[]
  dailyCoach: CoachActionResult | null
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

export function DashboardContent({ stats, subjectProgress, quote, todayTaskGroup, weakAreas, overdueTaskCount, pyqProgress, originalPracticeProgress, adaptiveRecommendations, dailyCoach }: DashboardContentProps) {
  const [isPending, startTransition] = useTransition()
  const [isCoachPending, startCoachTransition] = useTransition()
  const [localCompletions, setLocalCompletions] = useState<Record<string, boolean>>({})
  const [coachState, setCoachState] = useState<CoachActionResult | null>(dailyCoach)
  const [coachError, setCoachError] = useState<string | null>(null)
  const [coachCooldownUntil, setCoachCooldownUntil] = useState(0)
  const visibleSubjectProgress = subjectProgress.filter((subject) => subject.totalTasks > 0)
  const isCoachCoolingDown = coachCooldownUntil > 0
  const pieData = visibleSubjectProgress.map(s => ({
    id: s.id,
    name: s.name,
    value: clampPercent(s.percentage),
    color: s.color,
  }))
  const planPercent = stats.totalDays > 0 ? clampPercent(Math.round((stats.currentDay / stats.totalDays) * 100)) : 0
  const originalTodayCompleted = todayTaskGroup?.tasks.filter((task) => task.status === 'completed').length ?? stats.todayCompletedCount
  const todayCompletedCount = todayTaskGroup
    ? todayTaskGroup.tasks.filter((task) => localCompletions[task.id] ?? (task.status === 'completed')).length
    : originalTodayCompleted
  const todayTaskCount = todayTaskGroup?.totalCount ?? stats.todayTaskCount
  const todayPercent = todayTaskCount ? clampPercent(Math.round((todayCompletedCount / todayTaskCount) * 100)) : 0
  const adjustedOverallCompleted = Math.min(
    stats.overallTaskCount,
    Math.max(0, stats.overallCompletedCount + todayCompletedCount - originalTodayCompleted)
  )
  const fullPlanPercent = stats.overallTaskCount > 0
    ? clampPercent(Math.round((adjustedOverallCompleted / stats.overallTaskCount) * 100))
    : 0
  const hasChartData = pieData.length > 0 && pieData.some((subject) => subject.value > 0)
  const planMessage = stats.planState === 'starts-soon'
    ? 'Your plan starts soon.'
    : stats.planState === 'completed'
      ? 'Plan completed. Keep revising weak areas.'
      : stats.planState === 'missing'
        ? 'Complete onboarding to generate your plan.'
        : `Day ${stats.currentDay} of ${stats.totalDays} - Keep pushing forward!`

  const getCompletionStatus = (taskId: string, originalCompleted: boolean) => {
    return localCompletions[taskId] !== undefined ? localCompletions[taskId] : originalCompleted
  }

  const handleToggleTask = (taskId: string, currentCompleted: boolean) => {
    setLocalCompletions((current) => ({
      ...current,
      [taskId]: !currentCompleted,
    }))

    startTransition(async () => {
      try {
        await toggleTaskCompletion(taskId)
      } catch {
        setLocalCompletions((current) => ({
          ...current,
          [taskId]: currentCompleted,
        }))
      }
    })
  }

  useEffect(() => {
    if (!coachCooldownUntil) return

    const delay = Math.max(0, coachCooldownUntil - Date.now())
    const timeout = window.setTimeout(() => setCoachCooldownUntil(0), delay)
    return () => window.clearTimeout(timeout)
  }, [coachCooldownUntil])

  const handleRefreshCoach = () => {
    if (isCoachCoolingDown) {
      setCoachError('Please wait a few seconds before refreshing AI Coach again.')
      return
    }

    setCoachError(null)
    setCoachCooldownUntil(Date.now() + 30_000)
    startCoachTransition(() => {
      void (async () => {
        try {
          const response = await getDailyCoachSuggestions()
          setCoachState(response)
          if (response.source === 'fallback' && response.fallbackReason) {
            toast.info(response.fallbackReason)
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'AI Coach refresh failed.'
          setCoachError(message)
          toast.error(message)
        }
      })()
    })
  }

  return (
    <div className="space-y-5 overflow-hidden p-4 sm:space-y-6 sm:p-6">
      {/* Welcome Section with Quote */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="break-words text-sm text-muted-foreground sm:text-base">
            {planMessage}
          </p>
        </div>
        {quote && (
          <Card className="w-full max-w-md overflow-hidden border-none bg-muted/50">
            <CardContent className="p-4">
              <div className="flex min-w-0 gap-3">
                <Quote className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="break-words text-sm italic leading-relaxed text-foreground">{quote.quote}</p>
                  {quote.author && (
                    <p className="mt-1 break-words text-xs text-muted-foreground">- {quote.author}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {overdueTaskCount > 0 && (
        <Alert className="border-amber-500/40 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="min-w-0 break-words">
              You have {overdueTaskCount} overdue task{overdueTaskCount === 1 ? '' : 's'}. Manage backlog.
            </span>
            <Button asChild size="sm" variant="outline" className="w-full sm:w-fit">
              <Link href="/dashboard/backlog">Manage backlog</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                <p className="text-3xl font-bold">{stats.currentStreak}</p>
                <p className="text-xs text-muted-foreground">Days</p>
              </div>
              <div className="rounded-lg bg-orange-500/10 p-3">
                <Flame className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Tasks Completed</p>
                <p className="text-3xl font-bold">{stats.tasksCompletedThisMonth}</p>
                <p className="text-xs text-muted-foreground">This Month</p>
              </div>
              <div className="rounded-lg bg-green-500/10 p-3">
                <Target className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Topics Covered</p>
                <p className="text-3xl font-bold">{stats.topicsCovered}</p>
                <p className="text-xs text-muted-foreground">Out of {stats.totalTopics}</p>
              </div>
              <div className="rounded-lg bg-blue-500/10 p-3">
                <BookOpen className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Avg. Mock Score</p>
                <p className="text-3xl font-bold">{stats.avgMockScore}%</p>
                <p className="text-xs text-muted-foreground">Mock Tests</p>
              </div>
              <div className="rounded-lg bg-purple-500/10 p-3">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Overall Progress</CardTitle>
          <CardDescription>
            {stats.activePlanId ? `Day ${stats.currentDay} of ${stats.totalDays} days` : 'No active study plan'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex min-w-0 flex-wrap justify-between gap-2 text-sm">
              <span className="text-muted-foreground">Roadmap Completion</span>
              <span className="font-medium">{planPercent}%</span>
            </div>
            <Progress value={planPercent} className="h-2" />
            <div className="flex min-w-0 flex-wrap justify-between gap-2 text-sm">
              <span className="text-muted-foreground">Today&apos;s Tasks</span>
              <span className="font-medium">{todayCompletedCount}/{todayTaskCount}</span>
            </div>
            <Progress value={todayPercent} className="h-2" />
            <div className="flex min-w-0 flex-wrap justify-between gap-2 text-sm">
              <span className="text-muted-foreground">Full Plan Tasks</span>
              <span className="font-medium">{adjustedOverallCompleted}/{stats.overallTaskCount}</span>
            </div>
            <Progress value={fullPlanPercent} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Today&apos;s Tasks</CardTitle>
          <CardDescription>
            {todayTaskGroup ? `Day ${todayTaskGroup.day} - ${todayCompletedCount}/${todayTaskCount} completed` : 'Your active plan tasks for today'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayTaskGroup && todayTaskGroup.tasks.length > 0 ? (
            <div className="space-y-3">
              {todayTaskGroup.tasks.slice(0, 5).map((task) => {
                const completed = getCompletionStatus(task.id, task.status === 'completed')
                return (
                  <TaskCheckItem
                    key={task.id}
                    task={task}
                    completed={completed}
                    disabled={isPending}
                    compact
                    onToggle={handleToggleTask}
                  />
                )
              })}
              {todayTaskGroup.tasks.length > 5 && (
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/tasks?focus=today#today-tasks">
                    View all {todayTaskGroup.tasks.length} tasks
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CalendarCheck />
                </EmptyMedia>
                <EmptyTitle>No tasks for today</EmptyTitle>
                <EmptyDescription>
                  Complete onboarding or open Daily Tasks when your active plan has generated tasks.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Daily Coach
          </CardTitle>
          <CardDescription>Three safe suggestions from your plan, PYQ progress, and weak areas.</CardDescription>
        </CardHeader>
        <CardContent>
          {coachState?.suggestions?.length ? (
            <div className="space-y-3">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="rounded-full border px-2 py-0.5 text-xs capitalize text-muted-foreground">
                  {coachState.source}
                </span>
                {coachState.fallbackReason && (
                  <span className="min-w-0 break-words text-xs text-muted-foreground">{coachState.fallbackReason}</span>
                )}
              </div>
              <ol className="space-y-2">
                {coachState.suggestions.slice(0, 3).map((suggestion, index) => (
                  <li key={`${index}-${suggestion}`} className="flex min-w-0 gap-3 rounded-lg border p-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </span>
                    <span className="min-w-0 break-words text-sm leading-relaxed">{suggestion}</span>
                  </li>
                ))}
              </ol>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="min-w-0 break-words text-xs text-amber-600 dark:text-amber-300">{coachState.warning}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleRefreshCoach}
                  disabled={isCoachPending || isCoachCoolingDown}
                  className="w-full sm:w-fit"
                >
                  <Sparkles className="h-4 w-4" />
                  {isCoachPending ? 'Refreshing...' : isCoachCoolingDown ? 'Cooling down...' : 'Refresh with AI Coach'}
                </Button>
              </div>
              {coachError && (
                <p className="break-words text-xs text-destructive">{coachError}</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Daily coach is unavailable right now.</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleRefreshCoach}
                disabled={isCoachPending || isCoachCoolingDown}
                className="w-full sm:w-fit"
              >
                <Sparkles className="h-4 w-4" />
                {isCoachPending ? 'Refreshing...' : 'Refresh with AI Coach'}
              </Button>
              {coachError && (
                <p className="break-words text-xs text-destructive">{coachError}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-primary" />
              PYQ Progress
            </CardTitle>
            <CardDescription>Attempt accuracy from visible PYQ practice questions.</CardDescription>
          </div>
          <Button asChild size="sm" variant="outline" className="w-full sm:w-fit">
            <Link href="/dashboard/pyq">Open PYQ practice</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {pyqProgress ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Attempted</p>
                <p className="mt-1 text-2xl font-bold">{pyqProgress.attemptedCount}/{pyqProgress.totalVisiblePYQs}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Accuracy</p>
                <p className="mt-1 text-2xl font-bold">{pyqProgress.accuracyPercentage}%</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Incorrect</p>
                <p className="mt-1 text-2xl font-bold">{pyqProgress.incorrectCount}</p>
              </div>
              <div className="flex min-w-0 flex-col gap-2 sm:col-span-3 sm:flex-row">
                <Button asChild variant="outline" className="w-full sm:w-fit">
                  <Link href="/dashboard/pyq?attempt=incorrect">Review incorrect</Link>
                </Button>
                <Button asChild variant="outline" className="w-full sm:w-fit">
                  <Link href="/dashboard/revision">Open revision queue</Link>
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">PYQ progress is unavailable right now.</p>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              PrepAI Practice
            </CardTitle>
            <CardDescription>Original in-app MCQs from your resource packs. Not official PYQs.</CardDescription>
          </div>
          <Button asChild size="sm" variant="outline" className="w-full sm:w-fit">
            <Link href="/dashboard/practice/original">Open practice</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {originalPracticeProgress ? (
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Attempted</p>
                <p className="mt-1 text-2xl font-bold">{originalPracticeProgress.attemptedCount}/{originalPracticeProgress.totalQuestions}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Correct</p>
                <p className="mt-1 text-2xl font-bold">{originalPracticeProgress.correctCount}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Incorrect</p>
                <p className="mt-1 text-2xl font-bold">{originalPracticeProgress.incorrectCount}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Marked</p>
                <p className="mt-1 text-2xl font-bold">{originalPracticeProgress.markedForRevisionCount}</p>
              </div>
              <div className="flex min-w-0 flex-col gap-2 sm:col-span-4 sm:flex-row">
                <Button asChild variant="outline" className="w-full sm:w-fit">
                  <Link href="/dashboard/practice/original?attempt=incorrect">Review incorrect</Link>
                </Button>
                <Button asChild variant="outline" className="w-full sm:w-fit">
                  <Link href="/dashboard/revision">Open revision queue</Link>
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">PrepAI Original Practice progress is unavailable right now.</p>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Adaptive Revision Recommendations
            </CardTitle>
            <CardDescription>Deterministic suggestions from PYQ mistakes and marked questions.</CardDescription>
          </div>
          <Button asChild size="sm" variant="outline" className="w-full sm:w-fit">
            <Link href="/dashboard/revision">Open revision queue</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {adaptiveRecommendations.length > 0 ? (
            <div className="space-y-3">
              {adaptiveRecommendations.slice(0, 3).map((recommendation) => (
                <div key={recommendation.id} className="rounded-lg border p-4">
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="break-words font-medium leading-relaxed">{recommendation.title}</p>
                      <p className="mt-1 break-words text-sm leading-relaxed text-muted-foreground">{recommendation.reason}</p>
                    </div>
                    <span className="w-fit rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground">
                      {recommendation.priority}
                    </span>
                  </div>
                  <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Button asChild size="sm" variant="outline" className="w-full sm:w-fit">
                      <Link href={recommendation.incorrectCount > 0 ? '/dashboard/pyq?attempt=incorrect' : '/dashboard/pyq?attempt=marked'}>
                        Review PYQs
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="ghost" className="w-full sm:w-fit">
                      <Link href="/dashboard/revision">Open queue</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No adaptive PYQ revision recommendations yet.</p>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Weak Areas
          </CardTitle>
          <CardDescription>Top focus areas from overdue tasks, subject progress, chapters, and mock results.</CardDescription>
        </CardHeader>
        <CardContent>
          {weakAreas.length > 0 ? (
            <div className="space-y-3">
              {weakAreas.slice(0, 3).map((area, index) => (
                <div key={`${area.subject_id || 'mock'}-${area.chapter_id || area.chapter_name || index}`} className="rounded-lg border p-4">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="min-w-0 break-words font-medium">
                      {area.chapter_name || area.subject_name || 'General weakness'}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground">
                      {area.priority}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{area.reason}</p>
                  <p className="mt-2 break-words text-sm">{area.suggested_action}</p>
                  {area.actionTarget && (
                    <Button asChild variant="outline" size="sm" className="mt-3 w-full sm:w-fit">
                      <Link href={area.actionTarget}>Review now</Link>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Empty className="py-8">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <AlertTriangle />
                </EmptyMedia>
                <EmptyTitle>No weak areas detected</EmptyTitle>
                <EmptyDescription>
                  Keep completing tasks and logging mock results to build stronger recommendations.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Subject Progress */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Subject-wise Progress</CardTitle>
            <CardDescription>Completion percentage by subject</CardDescription>
          </CardHeader>
          <CardContent>
            {visibleSubjectProgress.length > 0 ? (
              <div className="space-y-4">
                {visibleSubjectProgress.map((subject) => (
                <div key={subject.id} className="space-y-2">
                  <div className="flex min-w-0 justify-between gap-3 text-sm">
                    <span className="min-w-0 break-words font-medium">{subject.name}</span>
                    <span className="text-muted-foreground">{subject.percentage}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${clampPercent(subject.percentage)}%`,
                        backgroundColor: subject.color,
                      }}
                    />
                  </div>
                </div>
                ))}
              </div>
            ) : (
              <Empty className="py-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <BookOpen />
                  </EmptyMedia>
                  <EmptyTitle>No subject progress yet</EmptyTitle>
                  <EmptyDescription>
                    Subject progress appears after your active plan has tasks.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Subject Distribution</CardTitle>
            <CardDescription>Progress overview by subject</CardDescription>
          </CardHeader>
          <CardContent className="min-w-0">
            {hasChartData ? (
              <div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center">
                <div className="h-[220px] min-w-0 sm:h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius="78%"
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((subject) => (
                          <Cell key={subject.id} fill={subject.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {pieData.map((subject) => (
                    <div key={subject.id} className="flex min-w-0 items-center justify-between gap-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: subject.color }} />
                        <span className="truncate">{subject.name}</span>
                      </span>
                      <span className="font-medium">{subject.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Empty className="py-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <TrendingUp />
                  </EmptyMedia>
                  <EmptyTitle>No chart data yet</EmptyTitle>
                  <EmptyDescription>
                    Complete tasks from your active plan to build subject distribution.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
        <Button asChild size="lg" className="min-h-14 h-auto py-3 whitespace-normal text-center leading-relaxed">
          <Link href="/dashboard/tasks?focus=today#today-tasks">
            <Plus className="mr-2 h-5 w-5" />
            Start Daily Tasks
          </Link>
        </Button>
        <Button asChild variant="secondary" size="lg" className="min-h-14 h-auto py-3 whitespace-normal text-center leading-relaxed">
          <Link href="/dashboard/roadmap">
            <Map className="mr-2 h-5 w-5" />
            View Roadmap
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="min-h-14 h-auto py-3 whitespace-normal text-center leading-relaxed">
          <Link href="/dashboard/mock-tests">
            <ClipboardList className="mr-2 h-5 w-5" />
            Take Mock Test
          </Link>
        </Button>
      </div>

      {/* Additional Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>Explore Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Link 
              href="/dashboard/subjects"
              className="block min-w-0 rounded-lg border border-border p-4 transition-colors hover:bg-accent group"
            >
              <p className="break-words font-semibold transition-colors group-hover:text-primary">Subject Progress</p>
              <p className="break-words text-sm text-muted-foreground">Track performance across subjects</p>
            </Link>
            <Link 
              href="/dashboard/notes"
              className="block min-w-0 rounded-lg border border-border p-4 transition-colors hover:bg-accent group"
            >
              <p className="break-words font-semibold transition-colors group-hover:text-primary">Study Notes</p>
              <p className="break-words text-sm text-muted-foreground">Organize and review your notes</p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
