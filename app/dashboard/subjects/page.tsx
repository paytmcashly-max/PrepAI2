'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { BookOpen, TrendingUp, Zap, Users } from 'lucide-react'

const subjects = [
  {
    name: 'Mathematics',
    icon: '📐',
    progress: 65,
    chaptersCompleted: 12,
    totalChapters: 18,
    topicsLearned: 45,
    mockTestAvg: 72,
    color: 'from-blue-600 to-blue-700',
  },
  {
    name: 'General Knowledge',
    icon: '🌍',
    progress: 45,
    chaptersCompleted: 9,
    totalChapters: 20,
    topicsLearned: 28,
    mockTestAvg: 58,
    color: 'from-green-600 to-green-700',
  },
  {
    name: 'Hindi',
    icon: '📝',
    progress: 72,
    chaptersCompleted: 14,
    totalChapters: 19,
    topicsLearned: 52,
    mockTestAvg: 76,
    color: 'from-orange-600 to-orange-700',
  },
  {
    name: 'Reasoning',
    icon: '🧠',
    progress: 58,
    chaptersCompleted: 11,
    totalChapters: 19,
    topicsLearned: 38,
    mockTestAvg: 65,
    color: 'from-purple-600 to-purple-700',
  },
  {
    name: 'Physics',
    icon: '⚛️',
    progress: 52,
    chaptersCompleted: 10,
    totalChapters: 19,
    topicsLearned: 31,
    mockTestAvg: 62,
    color: 'from-pink-600 to-pink-700',
  },
]

const progressData = [
  { day: 'Day 1-10', math: 40, gk: 30, hindi: 45, reasoning: 35, physics: 30 },
  { day: 'Day 11-20', math: 50, gk: 38, hindi: 55, reasoning: 42, physics: 40 },
  { day: 'Day 21-30', math: 58, gk: 42, hindi: 62, reasoning: 48, physics: 48 },
  { day: 'Day 31-40', math: 63, gk: 44, hindi: 68, reasoning: 54, physics: 52 },
]

export default function SubjectsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)

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

  const overallProgress = Math.round(subjects.reduce((sum, s) => sum + s.progress, 0) / subjects.length)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Subject Progress</h1>
            <p className="text-sm text-slate-400">Track your performance across all subjects</p>
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
        {/* Overall Progress */}
        <Card className="border-slate-700 bg-gradient-to-br from-slate-800 to-slate-700/50 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="text-white">Overall Preparation Progress</CardTitle>
            <CardDescription className="text-slate-400">Average across all subjects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-5xl font-bold text-white">{overallProgress}%</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-sm mb-2">Day 42 of 120</p>
                <p className="text-white font-semibold">35% Complete</p>
              </div>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Over Time */}
        <Card className="border-slate-700 bg-gradient-to-br from-slate-800 to-slate-700/50 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="text-white">Progress Trend</CardTitle>
            <CardDescription className="text-slate-400">Subject-wise progress over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                  }}
                  cursor={{ stroke: '#3b82f6' }}
                />
                <Line type="monotone" dataKey="math" stroke="#3b82f6" strokeWidth={2} name="Mathematics" />
                <Line type="monotone" dataKey="hindi" stroke="#f97316" strokeWidth={2} name="Hindi" />
                <Line type="monotone" dataKey="gk" stroke="#22c55e" strokeWidth={2} name="GK" />
                <Line type="monotone" dataKey="reasoning" stroke="#a855f7" strokeWidth={2} name="Reasoning" />
                <Line type="monotone" dataKey="physics" stroke="#ec4899" strokeWidth={2} name="Physics" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subject Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Subject-Wise Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => (
              <Card
                key={subject.name}
                className={`border-slate-700 bg-gradient-to-br from-slate-800 to-slate-700/50 backdrop-blur-sm cursor-pointer hover:from-slate-750 hover:to-slate-700/60 transition-all ${
                  selectedSubject === subject.name ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedSubject(selectedSubject === subject.name ? null : subject.name)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{subject.icon}</div>
                      <h3 className="text-lg font-bold text-white">{subject.name}</h3>
                    </div>
                    <div className={`bg-gradient-to-r ${subject.color} px-3 py-1 rounded-full text-white text-sm font-semibold`}>
                      {subject.progress}%
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                      <div
                        className={`bg-gradient-to-r ${subject.color} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${subject.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-2 bg-slate-700/50 rounded">
                      <p className="text-slate-400 text-xs">Chapters</p>
                      <p className="text-white font-semibold">{subject.chaptersCompleted}/{subject.totalChapters}</p>
                    </div>
                    <div className="p-2 bg-slate-700/50 rounded">
                      <p className="text-slate-400 text-xs">Topics</p>
                      <p className="text-white font-semibold">{subject.topicsLearned}</p>
                    </div>
                    <div className="p-2 bg-slate-700/50 rounded">
                      <p className="text-slate-400 text-xs">Mock Avg</p>
                      <p className="text-white font-semibold">{subject.mockTestAvg}%</p>
                    </div>
                    <div className="p-2 bg-slate-700/50 rounded">
                      <p className="text-slate-400 text-xs">Remaining</p>
                      <p className="text-white font-semibold">{subject.totalChapters - subject.chaptersCompleted}</p>
                    </div>
                  </div>

                  <Button className={`w-full bg-gradient-to-r ${subject.color} hover:opacity-90 text-white`}>
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Performance Summary */}
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                  <p className="text-slate-400 text-sm">Total Topics</p>
                </div>
                <p className="text-2xl font-bold text-white">194</p>
              </div>
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <p className="text-slate-400 text-sm">Avg. Score</p>
                </div>
                <p className="text-2xl font-bold text-white">66.6%</p>
              </div>
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-purple-400" />
                  <p className="text-slate-400 text-sm">Strength</p>
                </div>
                <p className="text-2xl font-bold text-white">Hindi</p>
              </div>
              <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-orange-400" />
                  <p className="text-slate-400 text-sm">Focus Area</p>
                </div>
                <p className="text-2xl font-bold text-white">GK</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
