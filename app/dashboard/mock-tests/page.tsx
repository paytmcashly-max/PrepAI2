'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Clock, Target, TrendingUp, Play, Eye } from 'lucide-react'

const mockTests = [
  {
    id: '1',
    title: 'Full Mock Test 1',
    description: 'Complete 100-question mock test',
    totalQuestions: 100,
    duration: 120,
    attempted: true,
    score: 72,
    correctAnswers: 72,
    wrongAnswers: 20,
    unanswered: 8,
    date: '2025-05-08',
    accuracy: 78,
  },
  {
    id: '2',
    title: 'Mathematics Test 1',
    description: '30 questions on Algebra, Geometry & Numbers',
    totalQuestions: 30,
    duration: 40,
    attempted: true,
    score: 22,
    correctAnswers: 22,
    wrongAnswers: 6,
    unanswered: 2,
    date: '2025-05-07',
    accuracy: 79,
  },
  {
    id: '3',
    title: 'General Knowledge Part 1',
    description: '25 questions on History, Geography & Politics',
    totalQuestions: 25,
    duration: 30,
    attempted: false,
    score: null,
    correctAnswers: null,
    wrongAnswers: null,
    unanswered: null,
    date: null,
    accuracy: null,
  },
  {
    id: '4',
    title: 'Full Mock Test 2',
    description: 'Complete 100-question mock test - Advanced',
    totalQuestions: 100,
    duration: 120,
    attempted: false,
    score: null,
    correctAnswers: null,
    wrongAnswers: null,
    unanswered: null,
    date: null,
    accuracy: null,
  },
]

const scoreData = [
  { test: 'Mock 1', score: 72, target: 85 },
  { test: 'Math 1', score: 73, target: 85 },
  { test: 'GK 1', score: 68, target: 85 },
  { test: 'Hindi 1', score: 75, target: 85 },
  { test: 'Reasoning 1', score: 70, target: 85 },
]

export default function MockTestsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
      } else {
        setUser(user)
      }
      setLoading(false)
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  const attemptedTests = mockTests.filter((t) => t.attempted)
  const avgScore = Math.round(attemptedTests.reduce((sum, t) => sum + (t.score || 0), 0) / attemptedTests.length)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Mock Tests</h1>
            <p className="text-sm text-slate-400">Practice and track your performance</p>
          </div>
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-slate-700 bg-gradient-to-br from-slate-800 to-slate-700/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Tests Attempted</p>
                  <p className="text-4xl font-bold text-white mt-2">{attemptedTests.length}</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Target className="w-8 h-8 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-gradient-to-br from-slate-800 to-slate-700/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Average Score</p>
                  <p className="text-4xl font-bold text-white mt-2">{avgScore}%</p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-gradient-to-br from-slate-800 to-slate-700/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Tests Pending</p>
                  <p className="text-4xl font-bold text-white mt-2">{mockTests.length - attemptedTests.length}</p>
                </div>
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <Clock className="w-8 h-8 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Score Trend */}
        <Card className="border-slate-700 bg-gradient-to-br from-slate-800 to-slate-700/50 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="text-white">Score Trend</CardTitle>
            <CardDescription className="text-slate-400">Your performance across tests</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="test" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="score" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="target" fill="#94a3b8" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tests List */}
        <h2 className="text-2xl font-bold text-white mb-6">All Mock Tests</h2>
        <div className="space-y-4">
          {mockTests.map((test) => (
            <Card
              key={test.id}
              className="border-slate-700 bg-gradient-to-br from-slate-800 to-slate-700/50 backdrop-blur-sm hover:from-slate-750 hover:to-slate-700/60 transition-all"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">{test.title}</h3>
                    <p className="text-slate-400 text-sm">{test.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{test.duration} min</span>
                    </div>
                    <p className="text-slate-400 text-sm">{test.totalQuestions} questions</p>
                  </div>
                </div>

                {test.attempted ? (
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 p-4 bg-slate-700/30 rounded-lg">
                    <div>
                      <p className="text-slate-400 text-xs mb-1">Score</p>
                      <p className="text-2xl font-bold text-green-400">{test.score}%</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs mb-1">Correct</p>
                      <p className="text-2xl font-bold text-white">{test.correctAnswers}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs mb-1">Wrong</p>
                      <p className="text-2xl font-bold text-red-400">{test.wrongAnswers}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs mb-1">Skipped</p>
                      <p className="text-2xl font-bold text-yellow-400">{test.unanswered}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs mb-1">Date</p>
                      <p className="text-sm font-semibold text-white">{test.date}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-700/30 rounded-lg mb-4">
                    <p className="text-slate-400 text-center text-sm">Not attempted yet</p>
                  </div>
                )}

                <div className="flex gap-3">
                  {test.attempted ? (
                    <>
                      <Button className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                        <Eye className="w-4 h-4 mr-2" />
                        Review
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        Retake
                      </Button>
                    </>
                  ) : (
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                      <Play className="w-4 h-4 mr-2" />
                      Start Test
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
