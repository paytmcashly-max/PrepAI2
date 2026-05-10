'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
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
} from 'lucide-react'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { TaskCheckItem } from '@/components/dashboard/task-check-item'
import { toggleTaskCompletion } from '@/lib/actions'
import type { DashboardStats, SubjectProgress, MotivationalQuote, DayTaskGroup, WeakArea } from '@/lib/types'

interface DashboardContentProps {
  stats: DashboardStats
  subjectProgress: SubjectProgress[]
  quote: MotivationalQuote | null
  todayTaskGroup: DayTaskGroup | null
  weakAreas: WeakArea[]
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

export function DashboardContent({ stats, subjectProgress, quote, todayTaskGroup, weakAreas }: DashboardContentProps) {
  const [isPending, startTransition] = useTransition()
  const [localCompletions, setLocalCompletions] = useState<Record<string, boolean>>({})
  const visibleSubjectProgress = subjectProgress.filter((subject) => subject.totalTasks > 0)
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

  return (
    <div className="space-y-6 overflow-hidden p-6">
      {/* Welcome Section with Quote */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {planMessage}
          </p>
        </div>
        {quote && (
          <Card className="max-w-md border-none bg-muted/50">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Quote className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm italic text-foreground">{quote.quote}</p>
                  {quote.author && (
                    <p className="text-xs text-muted-foreground mt-1">- {quote.author}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
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

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
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

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
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

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
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
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Roadmap Completion</span>
              <span className="font-medium">{planPercent}%</span>
            </div>
            <Progress value={planPercent} className="h-2" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Today&apos;s Tasks</span>
              <span className="font-medium">{todayCompletedCount}/{todayTaskCount}</span>
            </div>
            <Progress value={todayPercent} className="h-2" />
            <div className="flex justify-between text-sm">
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
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{subject.name}</span>
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
      <div className="grid gap-4 md:grid-cols-3">
        <Button asChild size="lg" className="h-14">
          <Link href="/dashboard/tasks?focus=today#today-tasks">
            <Plus className="mr-2 h-5 w-5" />
            Start Daily Tasks
          </Link>
        </Button>
        <Button asChild variant="secondary" size="lg" className="h-14">
          <Link href="/dashboard/roadmap">
            <Map className="mr-2 h-5 w-5" />
            View Roadmap
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="h-14">
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
              className="block p-4 rounded-lg border border-border hover:bg-accent transition-colors group"
            >
              <p className="font-semibold group-hover:text-primary transition-colors">Subject Progress</p>
              <p className="text-sm text-muted-foreground">Track performance across subjects</p>
            </Link>
            <Link 
              href="/dashboard/notes"
              className="block p-4 rounded-lg border border-border hover:bg-accent transition-colors group"
            >
              <p className="font-semibold group-hover:text-primary transition-colors">Study Notes</p>
              <p className="text-sm text-muted-foreground">Organize and review your notes</p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
