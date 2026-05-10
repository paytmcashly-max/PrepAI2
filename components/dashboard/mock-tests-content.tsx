'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import { 
  Clock, 
  Target, 
  TrendingUp, 
  Play, 
  Eye,
  ClipboardList,
  CheckCircle2,
  XCircle,
  MinusCircle,
} from 'lucide-react'
import type { MockTest, MockTestAttempt } from '@/lib/types'
import { format } from 'date-fns'

interface MockTestsContentProps {
  mockTests: MockTest[]
  attempts: MockTestAttempt[]
}

export function MockTestsContent({ mockTests, attempts }: MockTestsContentProps) {
  // Get the latest attempt for each test
  const attemptsByTest = attempts.reduce((acc, attempt) => {
    if (!acc[attempt.mock_test_id] || 
        new Date(attempt.created_at) > new Date(acc[attempt.mock_test_id].created_at)) {
      acc[attempt.mock_test_id] = attempt
    }
    return acc
  }, {} as Record<string, MockTestAttempt>)

  const completedAttempts = attempts.filter(a => a.status === 'completed')
  const avgScore = completedAttempts.length > 0
    ? Math.round(
        completedAttempts.reduce((sum, a) => {
          const percentage = a.total_marks && a.marks_obtained 
            ? (a.marks_obtained / a.total_marks) * 100 
            : 0
          return sum + percentage
        }, 0) / completedAttempts.length
      )
    : 0

  const scoreData = completedAttempts.slice(0, 5).map((a, i) => ({
    test: `Test ${i + 1}`,
    score: a.total_marks && a.marks_obtained 
      ? Math.round((a.marks_obtained / a.total_marks) * 100)
      : 0,
    target: 85,
  }))

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mock Tests</h1>
        <p className="text-muted-foreground">Practice and track your performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tests Attempted</p>
                <p className="text-3xl font-bold mt-1">{completedAttempts.length}</p>
              </div>
              <div className="rounded-lg bg-blue-500/10 p-3">
                <Target className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                <p className="text-3xl font-bold mt-1">{avgScore}%</p>
              </div>
              <div className="rounded-lg bg-green-500/10 p-3">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tests Available</p>
                <p className="text-3xl font-bold mt-1">{mockTests.length}</p>
              </div>
              <div className="rounded-lg bg-amber-500/10 p-3">
                <ClipboardList className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score Trend */}
      {scoreData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Score Trend</CardTitle>
            <CardDescription>Your performance across tests</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={scoreData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="test" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tests List */}
      <div>
        <h2 className="text-xl font-bold mb-4">All Mock Tests</h2>
        <div className="space-y-4">
          {mockTests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Mock Tests Available</h3>
                <p className="text-muted-foreground">
                  Mock tests will appear here once they are added to the system.
                </p>
              </CardContent>
            </Card>
          ) : (
            mockTests.map((test) => {
              const latestAttempt = attemptsByTest[test.id]
              const isAttempted = latestAttempt?.status === 'completed'
              const score = latestAttempt && latestAttempt.total_marks && latestAttempt.marks_obtained
                ? Math.round((latestAttempt.marks_obtained / latestAttempt.total_marks) * 100)
                : null

              return (
                <Card key={test.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold">{test.title}</h3>
                          {isAttempted && (
                            <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                              Completed
                            </Badge>
                          )}
                        </div>
                        {test.description && (
                          <p className="text-sm text-muted-foreground">{test.description}</p>
                        )}
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div className="flex items-center gap-1 mb-1">
                          <Clock className="h-4 w-4" />
                          <span>{test.duration_minutes} min</span>
                        </div>
                        <p>{test.total_questions} questions</p>
                      </div>
                    </div>

                    {isAttempted && latestAttempt ? (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 p-4 rounded-lg bg-muted/50">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Score</p>
                          <p className="text-xl font-bold text-green-600">{score}%</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            Correct
                          </div>
                          <p className="text-xl font-bold">{latestAttempt.correct_answers}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <XCircle className="h-3 w-3 text-red-500" />
                            Wrong
                          </div>
                          <p className="text-xl font-bold text-red-500">{latestAttempt.wrong_answers}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <MinusCircle className="h-3 w-3 text-amber-500" />
                            Skipped
                          </div>
                          <p className="text-xl font-bold text-amber-500">{latestAttempt.unanswered}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Date</p>
                          <p className="text-sm font-semibold">
                            {format(new Date(latestAttempt.completed_at || latestAttempt.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-muted/50 mb-4">
                        <p className="text-center text-sm text-muted-foreground">Not attempted yet</p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      {isAttempted ? (
                        <>
                          <Button asChild className="flex-1">
                            <Link href={`/mock-tests/${test.id}/review/${latestAttempt.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Review
                            </Link>
                          </Button>
                          <Button asChild variant="outline" className="flex-1">
                            <Link href={`/mock-tests/${test.id}/start`}>
                              Retake
                            </Link>
                          </Button>
                        </>
                      ) : (
                        <Button asChild className="w-full">
                          <Link href={`/mock-tests/${test.id}/start`}>
                            <Play className="h-4 w-4 mr-2" />
                            Start Test
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
