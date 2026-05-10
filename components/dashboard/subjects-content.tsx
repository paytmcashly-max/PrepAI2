'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  BookOpen, 
  TrendingUp, 
  Zap, 
  Target,
  Calculator,
  Brain,
  Globe,
  ArrowRight,
} from 'lucide-react'
import type { Subject } from '@/lib/types'

interface SubjectWithProgress extends Subject {
  progress: number
  completedTasks: number
  totalTasks: number
}

interface SubjectsContentProps {
  subjects: SubjectWithProgress[]
}

const subjectIcons: Record<string, React.ReactNode> = {
  'quant': <Calculator className="h-6 w-6" />,
  'reasoning': <Brain className="h-6 w-6" />,
  'english': <BookOpen className="h-6 w-6" />,
  'ga': <Globe className="h-6 w-6" />,
}

export function SubjectsContent({ subjects }: SubjectsContentProps) {
  const overallProgress = subjects.length > 0 
    ? Math.round(subjects.reduce((sum, s) => sum + s.progress, 0) / subjects.length)
    : 0

  const strongestSubject = subjects.reduce((prev, curr) => 
    curr.progress > prev.progress ? curr : prev
  , subjects[0])

  const weakestSubject = subjects.reduce((prev, curr) => 
    curr.progress < prev.progress ? curr : prev
  , subjects[0])

  const totalTasks = subjects.reduce((sum, s) => sum + s.totalTasks, 0)
  const completedTasks = subjects.reduce((sum, s) => sum + s.completedTasks, 0)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subject Progress</h1>
        <p className="text-muted-foreground">Track your performance across all subjects</p>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Preparation Progress</CardTitle>
          <CardDescription>Average across all subjects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-4xl font-bold">{overallProgress}%</p>
            </div>
            <div className="text-right">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {subjects.map((subject) => (
            <Card key={subject.id} className="overflow-hidden">
              <div 
                className="h-1" 
                style={{ backgroundColor: subject.color || '#3B82F6' }}
              />
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="flex h-12 w-12 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${subject.color}20` || '#3B82F620' }}
                    >
                      <span style={{ color: subject.color || '#3B82F6' }}>
                        {subjectIcons[subject.id] || <BookOpen className="h-6 w-6" />}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold">{subject.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {subject.completedTasks} / {subject.totalTasks} tasks
                      </p>
                    </div>
                  </div>
                  <div 
                    className="px-3 py-1 rounded-full text-sm font-semibold"
                    style={{ 
                      backgroundColor: `${subject.color}20` || '#3B82F620',
                      color: subject.color || '#3B82F6'
                    }}
                  >
                    {subject.progress}%
                  </div>
                </div>

                <Progress 
                  value={subject.progress} 
                  className="h-2 mb-4"
                />

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Completed</p>
                    <p className="font-semibold">{subject.completedTasks} tasks</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Remaining</p>
                    <p className="font-semibold">{subject.totalTasks - subject.completedTasks} tasks</p>
                  </div>
                </div>

                <Button asChild variant="outline" className="w-full mt-4">
                  <Link href={`/dashboard/tasks?subject=${subject.id}`}>
                    View Tasks
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-5 w-5 text-blue-500" />
                <p className="text-sm text-muted-foreground">Total Tasks</p>
              </div>
              <p className="text-2xl font-bold">{totalTasks}</p>
            </div>
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <p className="text-2xl font-bold">{completedTasks}</p>
            </div>
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-purple-500" />
                <p className="text-sm text-muted-foreground">Strongest</p>
              </div>
              <p className="text-lg font-bold truncate">
                {strongestSubject?.name || 'N/A'}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-amber-500" />
                <p className="text-sm text-muted-foreground">Focus Area</p>
              </div>
              <p className="text-lg font-bold truncate">
                {weakestSubject?.name || 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
