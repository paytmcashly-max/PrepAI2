'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { 
  Calendar, 
  CheckCircle2, 
  Target,
  ArrowRight,
  BookOpen,
} from 'lucide-react'
import type { RoadmapPhase, RoadmapSubject } from '@/lib/types'
import { cn } from '@/lib/utils'
import { SubjectIcon } from '@/components/dashboard/subject-icon'

interface RoadmapContentProps {
  phases: RoadmapPhase[]
  subjects: RoadmapSubject[]
  totalDays: number
  currentDay: number
}

const phaseColors = [
  'from-blue-500 to-blue-600',
  'from-purple-500 to-purple-600',
  'from-emerald-500 to-emerald-600',
  'from-amber-500 to-amber-600',
  'from-rose-500 to-rose-600',
]

export function RoadmapContent({ phases, subjects, totalDays, currentDay }: RoadmapContentProps) {
  const currentPhase = phases.find(
    p => currentDay >= p.start_day && currentDay <= p.end_day
  )
  const roadmapPercent = totalDays > 0 ? Math.min(100, Math.max(0, (currentDay / totalDays) * 100)) : 0
  const title = totalDays > 0 ? `${totalDays}-Day Learning Roadmap` : 'Learning Roadmap'

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">
          {totalDays > 0
            ? 'A structured preparation plan designed to systematically build your exam readiness.'
            : 'Complete onboarding to generate your personalized roadmap.'}
        </p>
      </div>

      {/* Current Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Current Progress</p>
              <p className="text-2xl font-bold">Day {currentDay} of {totalDays}</p>
            </div>
            {currentPhase && (
              <Badge variant="outline" className="text-sm">
                {currentPhase.name}
              </Badge>
            )}
          </div>
          <Progress value={roadmapPercent} className="h-2" />
        </CardContent>
      </Card>

      {/* Phases Timeline */}
      <div className="space-y-4">
        {phases.map((phase, index) => {
          const isActive = currentPhase?.id === phase.id
          const isCompleted = currentDay > phase.end_day
          const phaseDuration = phase.end_day - phase.start_day + 1
          const phaseProgress = isCompleted 
            ? 100 
            : isActive 
              ? Math.round(((currentDay - phase.start_day + 1) / phaseDuration) * 100)
              : 0

          return (
            <Card 
              key={phase.id} 
              className={cn(
                "overflow-hidden transition-shadow",
                isActive && "ring-2 ring-primary shadow-lg"
              )}
            >
              <div className={cn(
                "h-1 bg-gradient-to-r",
                phaseColors[index % phaseColors.length]
              )} />
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r text-white font-bold text-lg",
                      phaseColors[index % phaseColors.length]
                    )}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold">{phase.name}</h3>
                        {isActive && (
                          <Badge className="bg-primary">Current</Badge>
                        )}
                        {isCompleted && (
                          <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                            Completed
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground mt-1">
                        <Calendar className="h-4 w-4" />
                        <span>Days {phase.start_day} - {phase.end_day}</span>
                        <span className="text-xs">({phaseDuration} days)</span>
                      </div>
                    </div>
                  </div>
                  {isCompleted ? (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  ) : (
                    <Target className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>

                {phase.goal && (
                  <p className="text-muted-foreground mb-4">{phase.goal}</p>
                )}

                {/* Phase Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Phase Progress</span>
                    <span className="font-medium">{phaseProgress}%</span>
                  </div>
                  <Progress value={phaseProgress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Daily Learning Structure */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Learning Structure</CardTitle>
        </CardHeader>
        <CardContent>
          {subjects.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
              {subjects.map((subject) => (
                <div
                  key={subject.id}
                  className="rounded-lg border border-border p-4 text-center"
                  style={{ borderLeftColor: subject.color || '#3B82F6', borderLeftWidth: '4px' }}
                >
                  <div className="mb-2 flex justify-center text-muted-foreground">
                    <SubjectIcon icon={subject.icon} className="h-5 w-5" />
                  </div>
                  <p className="break-words text-sm font-semibold leading-relaxed">{subject.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {subject.totalTasks} tasks | avg {subject.averageMinutes} mins
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <Empty className="py-8">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BookOpen />
                </EmptyMedia>
                <EmptyTitle>No roadmap tasks yet</EmptyTitle>
                <EmptyDescription>
                  Active plan task structure appears after daily tasks are generated.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="flex justify-center pt-4">
        <Button asChild size="lg">
          <Link href="/dashboard/tasks">
            Start Daily Tasks
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
