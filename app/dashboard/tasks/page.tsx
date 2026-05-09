'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronDown, Clock, Zap, Filter, CheckCircle2 } from 'lucide-react'

const sampleTasks = [
  {
    id: '1',
    date: '2025-05-09',
    dayNumber: 42,
    tasks: [
      {
        id: 't1',
        subject: 'Mathematics',
        type: 'Algebra',
        title: 'Solve Quadratic Equations',
        duration: 45,
        difficulty: 'Medium',
        completed: true,
        priority: 1,
      },
      {
        id: 't2',
        subject: 'General Knowledge',
        type: 'Current Affairs',
        title: 'Study World Political Events',
        duration: 30,
        difficulty: 'Easy',
        completed: false,
        priority: 1,
      },
      {
        id: 't3',
        subject: 'Hindi',
        type: 'Grammar',
        title: 'Practice Sentence Correction',
        duration: 40,
        difficulty: 'Medium',
        completed: false,
        priority: 1,
      },
      {
        id: 't4',
        subject: 'Reasoning',
        type: 'Logic',
        title: 'Solve Syllogism Problems',
        duration: 50,
        difficulty: 'Hard',
        completed: false,
        priority: 1,
      },
      {
        id: 't5',
        subject: 'Physics',
        type: 'Mechanics',
        title: 'Force and Motion Numericals',
        duration: 35,
        difficulty: 'Medium',
        completed: false,
        priority: 1,
      },
    ],
  },
]

const subjectColors: Record<string, string> = {
  'Mathematics': 'bg-blue-500/20 text-blue-400',
  'General Knowledge': 'bg-green-500/20 text-green-400',
  'Hindi': 'bg-orange-500/20 text-orange-400',
  'Reasoning': 'bg-purple-500/20 text-purple-400',
  'Physics': 'bg-pink-500/20 text-pink-400',
}

const difficultyColors: Record<string, string> = {
  'Easy': 'text-green-400',
  'Medium': 'text-yellow-400',
  'Hard': 'text-red-400',
}

export default function TasksPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [expandedDays, setExpandedDays] = useState<string[]>(['1'])

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

  const toggleDay = (dayId: string) => {
    setExpandedDays((prev) =>
      prev.includes(dayId) ? prev.filter((id) => id !== dayId) : [...prev, dayId]
    )
  }

  const completedCount = sampleTasks.reduce(
    (sum, day) => sum + day.tasks.filter((t) => t.completed).length,
    0
  )
  const totalCount = sampleTasks.reduce((sum, day) => sum + day.tasks.length, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Daily Tasks</h1>
            <p className="text-sm text-slate-400">Stay consistent with your preparation</p>
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

      <main className="max-w-4xl mx-auto px-6 py-8">
        <Card className="border-slate-700 bg-gradient-to-br from-slate-800 to-slate-700/50 backdrop-blur-sm mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-2">Today&apos;s Progress</p>
                <p className="text-3xl font-bold text-white">{completedCount}/{totalCount} Tasks</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-sm font-medium mb-2">Completion</p>
                <p className="text-3xl font-bold text-blue-400">{Math.round((completedCount / totalCount) * 100)}%</p>
              </div>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.round((completedCount / totalCount) * 100)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {sampleTasks.map((dayTasks) => (
            <div key={dayTasks.id}>
              <button
                onClick={() => toggleDay(dayTasks.id)}
                className="w-full p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-colors mb-2 flex items-center justify-between"
              >
                <div className="flex items-center gap-4 text-left">
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform ${
                      expandedDays.includes(dayTasks.id) ? 'rotate-180' : ''
                    }`}
                  />
                  <div>
                    <h3 className="text-white font-semibold">Day {dayTasks.dayNumber}</h3>
                    <p className="text-slate-400 text-sm">{dayTasks.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">
                    {dayTasks.tasks.filter((t) => t.completed).length}/{dayTasks.tasks.length}
                  </p>
                  <p className="text-slate-400 text-xs">Completed</p>
                </div>
              </button>

              {expandedDays.includes(dayTasks.id) && (
                <div className="space-y-3 pl-6 mb-4">
                  {dayTasks.tasks.map((task) => (
                    <Card
                      key={task.id}
                      className={`border-slate-700 bg-slate-800/30 backdrop-blur-sm ${
                        task.completed ? 'opacity-60' : ''
                      }`}
                    >
                      <CardContent className="p-4 flex items-center gap-4">
                        <Checkbox
                          checked={task.completed}
                          className="w-5 h-5 border-slate-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${subjectColors[task.subject]}`}>
                              {task.subject}
                            </span>
                            <span className="text-slate-400 text-xs">{task.type}</span>
                          </div>
                          <h4 className={`font-semibold ${task.completed ? 'text-slate-400 line-through' : 'text-white'}`}>
                            {task.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">{task.duration}m</span>
                          </div>
                          <span className={`text-sm font-semibold ${difficultyColors[task.difficulty]}`}>
                            {task.difficulty}
                          </span>
                          {task.completed && (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm mt-8">
          <CardHeader>
            <CardTitle className="text-white">Session Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-slate-400 text-sm mb-1">Total Time Estimated</p>
                <p className="text-2xl font-bold text-white">
                  {sampleTasks.reduce((sum, day) => sum + day.tasks.reduce((s, t) => s + t.duration, 0), 0)} min
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Average Task Duration</p>
                <p className="text-2xl font-bold text-white">
                  {Math.round(sampleTasks.reduce((sum, day) => sum + day.tasks.reduce((s, t) => s + t.duration, 0), 0) / totalCount)} min
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Tasks Remaining</p>
                <p className="text-2xl font-bold text-orange-400">{totalCount - completedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
