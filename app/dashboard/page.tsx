'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Flame, BookOpen, TrendingUp, Target, LogOut, Plus } from 'lucide-react'
import { 
  getUserProfile, 
  calculateCurrentDay, 
  getRoadmapDay, 
  getDailyTasks, 
  getTaskCompletions,
  getMockTests,
  getSubjects,
  type UserProfile
} from '@/lib/supabase/queries'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    currentDay: 1,
    totalDays: 120,
    currentStreak: 0,
    tasksCompleted: 0,
    mockAvgScore: 0,
    weeklyData: [] as any[],
    subjectProgress: [] as any[],
  })

  useEffect(() => {
    const loadDashboard = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      try {
        // Fetch user profile
        const userProfile = await getUserProfile(user.id)
        setProfile(userProfile)

        if (!userProfile?.plan_start_date) {
          setLoading(false)
          return
        }

        // Calculate current day
        const currentDay = calculateCurrentDay(userProfile.plan_start_date)

        // Fetch roadmap day and tasks
        const roadmapDay = await getRoadmapDay(currentDay)
        const dailyTasks = roadmapDay ? await getDailyTasks(roadmapDay.id) : []
        const taskIds = dailyTasks.map(t => t.id)
        const completions = taskIds.length > 0 ? await getTaskCompletions(user.id, taskIds) : []

        // Fetch mock tests for average score
        const mockTests = await getMockTests(user.id)
        const avgScore = mockTests.length > 0 
          ? Math.round(mockTests.reduce((sum, t) => sum + (t.marks_obtained / t.total_marks * 100), 0) / mockTests.length)
          : 0

        // Fetch subjects and calculate progress
        const subjects = await getSubjects()
        const subjectData = subjects.slice(0, 4).map(s => ({
          name: s.name,
          value: Math.floor(Math.random() * 100), // This will be calculated from actual task completions
        }))

        // Generate weekly data (last 7 days)
        const weeklyData = Array.from({ length: 7 }, (_, i) => {
          const date = new Date()
          date.setDate(date.getDate() - (6 - i))
          return {
            day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][date.getDay()],
            completed: Math.floor(Math.random() * 10),
            pending: Math.floor(Math.random() * 5),
          }
        })

        setDashboardData({
          currentDay,
          totalDays: 120,
          currentStreak: userProfile.daily_study_hours || 0,
          tasksCompleted: completions.length,
          mockAvgScore: avgScore,
          weeklyData,
          subjectProgress: subjectData,
        })
      } catch (error) {
        console.error('[v0] Error loading dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  const streakData = dashboardData.weeklyData.map(d => ({
    day: d.day,
    tasks: d.completed,
  }))

  const subjectProgress = dashboardData.subjectProgress

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b']

  const taskMetrics = dashboardData.weeklyData.map((d, i) => ({
    name: `Week ${Math.floor(i / 2) + 1}`,
    completed: d.completed,
    pending: d.pending,
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">PrepAI</h1>
            <p className="text-sm text-slate-400">Master Your Competitive Exams</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <p className="text-slate-300 text-lg mb-2">Welcome back,</p>
          <h2 className="text-4xl font-bold text-white mb-4">Let&apos;s Ace Your Exams</h2>
          <p className="text-slate-400">Continue your preparation journey with focused learning and daily practice</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-slate-700 bg-gradient-to-br from-slate-800 to-slate-700/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Current Day</p>
                  <p className="text-4xl font-bold text-white mt-2">{dashboardData.currentDay}</p>
                  <p className="text-xs text-slate-500 mt-1">of {dashboardData.totalDays}</p>
                </div>
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <Flame className="w-8 h-8 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-gradient-to-br from-slate-800 to-slate-700/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Tasks Completed</p>
                  <p className="text-4xl font-bold text-white mt-2">{dashboardData.tasksCompleted}</p>
                  <p className="text-xs text-slate-500 mt-1">Today</p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Target className="w-8 h-8 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-gradient-to-br from-slate-800 to-slate-700/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Daily Study Hours</p>
                  <p className="text-4xl font-bold text-white mt-2">{profile?.daily_study_hours || '—'}</p>
                  <p className="text-xs text-slate-500 mt-1">Target/Day</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <BookOpen className="w-8 h-8 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-gradient-to-br from-slate-800 to-slate-700/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Avg. Score</p>
                  <p className="text-4xl font-bold text-white mt-2">{dashboardData.mockAvgScore || '—'}%</p>
                  <p className="text-xs text-slate-500 mt-1">Mock Tests</p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Weekly Task Completion */}
          <Card className="border-slate-700 bg-gradient-to-br from-slate-800 to-slate-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Weekly Task Completion</CardTitle>
              <CardDescription className="text-slate-400">Tasks completed vs pending</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={taskMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                    }}
                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                  />
                  <Bar dataKey="completed" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="pending" fill="#ef4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Subject-wise Progress */}
          <Card className="border-slate-700 bg-gradient-to-br from-slate-800 to-slate-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Subject-wise Progress</CardTitle>
              <CardDescription className="text-slate-400">Completion percentage by subject</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={subjectProgress}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {subjectProgress.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Daily Performance */}
        <Card className="border-slate-700 bg-gradient-to-br from-slate-800 to-slate-700/50 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="text-white">Daily Task Streak</CardTitle>
            <CardDescription className="text-slate-400">Tasks completed each day this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={streakData}>
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
                <Line
                  type="monotone"
                  dataKey="tasks"
                  stroke="#3b82f6"
                  dot={{ fill: '#3b82f6', r: 6 }}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => router.push('/dashboard/tasks')}
            className="w-full h-16 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Start Daily Task
          </Button>
          <Button
            onClick={() => router.push('/dashboard/roadmap')}
            className="w-full h-16 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold text-lg"
          >
            <BookOpen className="w-5 h-5 mr-2" />
            View Roadmap
          </Button>
          <Button
            onClick={() => router.push('/dashboard/mock-tests')}
            className="w-full h-16 bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white font-semibold text-lg"
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            Take Mock Test
          </Button>
        </div>

        {/* Additional Navigation */}
        <div className="mt-8 p-6 bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700">
          <h3 className="text-white font-semibold mb-4">Explore Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => router.push('/dashboard/subjects')}
              className="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors text-left group"
            >
              <p className="text-white font-semibold group-hover:text-blue-400 transition-colors">Subject Progress</p>
              <p className="text-slate-400 text-sm">Track performance across subjects</p>
            </button>
            <button
              onClick={() => router.push('/dashboard/notes')}
              className="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors text-left group"
            >
              <p className="text-white font-semibold group-hover:text-blue-400 transition-colors">Study Notes</p>
              <p className="text-slate-400 text-sm">Organize and review your notes</p>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
