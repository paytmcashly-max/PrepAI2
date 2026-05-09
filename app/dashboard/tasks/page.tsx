'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronDown, Clock, Zap, Filter, CheckCircle2 } from 'lucide-react'
import { 
  getRoadmapDay, 
  getDailyTasks, 
  getTaskCompletions, 
  toggleTaskCompletion,
  calculateCurrentDay,
  getUserProfile,
  type DailyTask
} from '@/lib/supabase/queries'
import { toast } from 'sonner'

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
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([])
  const [completions, setCompletions] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState<string | null>(null)

  useEffect(() => {
    const loadTasks = async () => {
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
        // Get user profile and calculate current day
        const profile = await getUserProfile(user.id)
        if (!profile?.plan_start_date) {
          setLoading(false)
          return
        }

        const currentDay = calculateCurrentDay(profile.plan_start_date)
        const roadmapDay = await getRoadmapDay(currentDay)
        
        if (!roadmapDay) {
          setLoading(false)
          return
        }

        // Load daily tasks
        const tasks = await getDailyTasks(roadmapDay.id)
        setDailyTasks(tasks)

        // Load completions
        if (tasks.length > 0) {
          const taskIds = tasks.map(t => t.id)
          const completionData = await getTaskCompletions(user.id, taskIds)
          const completionMap = completionData.reduce((acc: Record<string, boolean>, c) => {
            acc[c.task_id] = true
            return acc
          }, {})
          setCompletions(completionMap)
        }
      } catch (error) {
        console.error('[v0] Error loading tasks:', error)
        toast.error('Failed to load tasks')
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [router])

  const toggleDay = (dayId: string) => {
    setExpandedDays((prev) =>
      prev.includes(dayId) ? prev.filter((id) => id !== dayId) : [...prev, dayId]
    )
  }

  const handleTaskToggle = async (taskId: string) => {
    if (!user) return
    
    setSubmitting(taskId)
    const isCompleted = !completions[taskId]
    const success = await toggleTaskCompletion(user.id, taskId, isCompleted)
    
    if (success) {
      setCompletions(prev => ({
        ...prev,
        [taskId]: isCompleted
      }))
      toast.success(isCompleted ? 'Task completed!' : 'Task marked incomplete')
    } else {
      toast.error('Failed to update task')
    }
    
    setSubmitting(null)
  }

  const completedCount = Object.values(completions).filter(Boolean).length
  const totalCount = dailyTasks.length

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
          {dailyTasks.length === 0 ? (
            <Card className="border-slate-700 bg-gradient-to-br from-slate-800 to-slate-700/50 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <p className="text-slate-400">No tasks for today. Great job on staying ahead!</p>
              </CardContent>
            </Card>
          ) : (
            <div>
              <button
                onClick={() => toggleDay('today')}
                className="w-full p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-colors mb-2 flex items-center justify-between"
              >
                <div className="flex items-center gap-4 text-left">
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform ${
                      expandedDays.includes('today') ? 'rotate-180' : ''
                    }`}
                  />
                  <div>
                    <h3 className="text-white font-semibold">Today&apos;s Tasks</h3>
                    <p className="text-slate-400 text-sm">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">
                    {completedCount}/{totalCount}
                  </p>
                  <p className="text-slate-400 text-xs">Completed</p>
                </div>
              </button>

              {expandedDays.includes('today') && (
                <div className="space-y-3 pl-6 mb-4">
                  {dailyTasks.map((task) => (
                    <Card
                      key={task.id}
                      className={`border-slate-700 bg-slate-800/30 backdrop-blur-sm ${
                        completions[task.id] ? 'opacity-60' : ''
                      }`}
                    >
                      <CardContent className="p-4 flex items-center gap-4">
                        <Checkbox
                          checked={completions[task.id] || false}
                          onCheckedChange={() => handleTaskToggle(task.id)}
                          disabled={submitting === task.id}
                          className="w-5 h-5 border-slate-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${subjectColors[task.subject] || 'bg-slate-500/20 text-slate-400'}`}>
                              {task.subject}
                            </span>
                            <span className="text-slate-400 text-xs">{task.type}</span>
                          </div>
                          <h4 className={`font-semibold ${completions[task.id] ? 'text-slate-400 line-through' : 'text-white'}`}>
                            {task.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">{task.estimated_minutes || 30}m</span>
                          </div>
                          {completions[task.id] && (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {totalCount > 0 && (
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm mt-8">
            <CardHeader>
              <CardTitle className="text-white">Session Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Total Time Estimated</p>
                  <p className="text-2xl font-bold text-white">
                    {dailyTasks.reduce((sum, t) => sum + (t.estimated_minutes || 30), 0)} min
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Average Task Duration</p>
                  <p className="text-2xl font-bold text-white">
                    {Math.round(dailyTasks.reduce((sum, t) => sum + (t.estimated_minutes || 30), 0) / totalCount)} min
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Tasks Remaining</p>
                  <p className="text-2xl font-bold text-orange-400">{totalCount - completedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
