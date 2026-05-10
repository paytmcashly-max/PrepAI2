'use client'

import Link from 'next/link'
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
} from 'lucide-react'
import type { DashboardStats, SubjectProgress, MotivationalQuote } from '@/lib/types'

interface DashboardContentProps {
  stats: DashboardStats
  subjectProgress: SubjectProgress[]
  quote: MotivationalQuote | null
}

export function DashboardContent({ stats, subjectProgress, quote }: DashboardContentProps) {
  const pieData = subjectProgress.map(s => ({
    id: s.id,
    name: s.name,
    value: s.percentage,
    color: s.color,
  }))
  const planPercent = stats.totalDays > 0 ? Math.round((stats.currentDay / stats.totalDays) * 100) : 0
  const todayPercent = stats.todayTaskCount ? Math.round(((stats.todayCompletedCount || 0) / stats.todayTaskCount) * 100) : 0
  const planMessage = stats.planState === 'starts-soon'
    ? 'Your plan starts soon.'
    : stats.planState === 'completed'
      ? 'Plan completed. Keep revising weak areas.'
      : stats.planState === 'missing'
        ? 'Complete onboarding to generate your plan.'
        : `Day ${stats.currentDay} of ${stats.totalDays} - Keep pushing forward!`

  return (
    <div className="p-6 space-y-6">
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
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Overall Progress</CardTitle>
          <CardDescription>Day {stats.currentDay} of {stats.totalDays} days</CardDescription>
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
              <span className="font-medium">{stats.todayCompletedCount || 0}/{stats.todayTaskCount || 0}</span>
            </div>
            <Progress value={todayPercent} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Subject Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Subject-wise Progress</CardTitle>
            <CardDescription>Completion percentage by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subjectProgress.map((subject) => (
                <div key={subject.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{subject.name}</span>
                    <span className="text-muted-foreground">{subject.percentage}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${subject.percentage}%`,
                        backgroundColor: subject.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Subject Distribution</CardTitle>
            <CardDescription>Progress overview by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
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
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Button asChild size="lg" className="h-14">
          <Link href="/dashboard/tasks">
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
