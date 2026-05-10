'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Calendar, 
  CheckCircle2, 
  Target,
  BookOpen,
  Calculator,
  Brain,
  Globe,
  ArrowRight,
} from 'lucide-react'
import type { RoadmapPhase, Subject } from '@/lib/types'
import { cn } from '@/lib/utils'

interface RoadmapContentProps {
  phases: RoadmapPhase[]
  subjects: Subject[]
  totalDays: number
}

const phaseColors = [
  'from-blue-500 to-blue-600',
  'from-purple-500 to-purple-600',
  'from-emerald-500 to-emerald-600',
  'from-amber-500 to-amber-600',
  'from-rose-500 to-rose-600',
]

const subjectIcons: Record<string, React.ReactNode> = {
  'quant': <Calculator className="h-5 w-5" />,
  'reasoning': <Brain className="h-5 w-5" />,
  'english': <BookOpen className="h-5 w-5" />,
  'ga': <Globe className="h-5 w-5" />,
}

export function RoadmapContent({ phases, subjects, totalDays }: RoadmapContentProps) {
  // Calculate current day (this would come from user profile in real app)
  const currentDay = 1
  const currentPhase = phases.find(
    p => currentDay >= p.start_day && currentDay <= p.end_day
  )

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{totalDays}-Day Learning Roadmap</h1>
        <p className="text-muted-foreground">
          A structured preparation plan designed to systematically build your exam readiness.
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
          <Progress value={(currentDay / totalDays) * 100} className="h-2" />
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className="rounded-lg border border-border p-4 text-center"
                style={{ borderLeftColor: subject.color || '#3B82F6', borderLeftWidth: '4px' }}
              >
                <div className="flex justify-center mb-2 text-muted-foreground">
                  {subjectIcons[subject.id] || <BookOpen className="h-5 w-5" />}
                </div>
                <p className="font-semibold text-sm">{subject.name}</p>
                <p className="text-xs text-muted-foreground mt-1">~60 mins/day</p>
              </div>
            ))}
          </div>
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
