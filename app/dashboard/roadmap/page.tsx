'use client'

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Target, Calendar, CheckCircle2, Loader } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getRoadmapPhases, getUserProfile, type RoadmapPhase } from '@/lib/supabase/queries'
import { getStudyDayInfo } from '@/lib/utils/study-day'

const PHASE_COLORS: Record<string, string> = {
  'Foundation': 'from-blue-600 to-blue-700',
  'Core Syllabus': 'from-purple-600 to-purple-700',
  'Practice': 'from-pink-600 to-pink-700',
  'Revision + Test': 'from-green-600 to-green-700',
}

export default function RoadmapPage() {
  const router = useRouter()
  const [phases, setPhases] = useState<RoadmapPhase[]>([])
  const [currentDay, setCurrentDay] = useState(1)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const loadRoadmap = async () => {
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
        // Get user profile
        const profile = await getUserProfile(user.id)
        if (profile?.plan_start_date) {
          const info = getStudyDayInfo(profile.plan_start_date)
          setCurrentDay(info.currentDay)
        }

        // Get phases
        const phasesData = await getRoadmapPhases()
        setPhases(phasesData)
      } catch (error) {
        console.error('[v0] Error loading roadmap:', error)
      } finally {
        setLoading(false)
      }
    }

    loadRoadmap()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 animate-spin" />
          Loading roadmap...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">120-Day Learning Roadmap</h1>
          <p className="text-slate-400 text-lg mb-4">
            Your structured 4-phase preparation plan designed to systematically build your exam readiness from fundamentals to mastery.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg">
            <Target className="w-4 h-4 text-blue-400" />
            <span className="text-blue-300">You are on Day {currentDay} of 120</span>
          </div>
        </div>

        {/* Timeline */}
        {phases.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700 p-8 text-center">
            <p className="text-slate-400">No roadmap phases available. Please contact support.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {phases.map((phase, index) => {
              const isCurrentPhase = currentDay >= phase.start_day && currentDay <= phase.end_day
              const isCompleted = currentDay > phase.end_day
              const color = PHASE_COLORS[phase.name] || 'from-slate-600 to-slate-700'

              return (
                <Card
                  key={phase.id}
                  className={`border-slate-700 overflow-hidden transition-all ${
                    isCurrentPhase ? 'bg-slate-800 border-blue-500/50' : 'bg-slate-800/50'
                  }`}
                >
                  <div className={`bg-gradient-to-r ${color} h-1`}></div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${color} flex items-center justify-center text-white font-bold text-lg`}>
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{phase.name}</h3>
                          <div className="flex items-center gap-2 text-slate-400 mt-1">
                            <Calendar className="w-4 h-4" />
                            <span>Days {phase.start_day}-{phase.end_day}</span>
                          </div>
                        </div>
                      </div>
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      ) : isCurrentPhase ? (
                        <div className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                          Current Phase
                        </div>
                      ) : (
                        <div className="px-3 py-1 bg-slate-700/50 text-slate-400 rounded-full text-sm">
                          Upcoming
                        </div>
                      )}
                    </div>

                    <p className="text-slate-300 mb-4">{phase.goal}</p>

                    {/* Progress bar for current phase */}
                    {isCurrentPhase && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-slate-400">Phase Progress</span>
                          <span className="text-sm font-medium text-blue-400">
                            {currentDay - phase.start_day + 1} / {phase.end_day - phase.start_day + 1} days
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                            style={{
                              width: `${((currentDay - phase.start_day + 1) / (phase.end_day - phase.start_day + 1)) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* Progress Overview */}
        <Card className="bg-slate-800/50 border-slate-700 mt-12 p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Daily Learning Structure</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { name: 'Mathematics', color: 'bg-blue-600/20 border-blue-600' },
              { name: 'General Knowledge', color: 'bg-purple-600/20 border-purple-600' },
              { name: 'Hindi', color: 'bg-pink-600/20 border-pink-600' },
              { name: 'Reasoning', color: 'bg-green-600/20 border-green-600' },
              { name: 'Physical Science', color: 'bg-yellow-600/20 border-yellow-600' },
            ].map((subject) => (
              <div key={subject.name} className={`${subject.color} border rounded-lg p-4 text-center`}>
                <p className="text-slate-200 font-semibold">{subject.name}</p>
                <p className="text-slate-400 text-sm mt-1">~50 mins/day</p>
              </div>
            ))}
          </div>
        </Card>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button
            onClick={() => router.push('/dashboard/tasks')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 py-6 text-lg"
          >
            Start Daily Tasks
          </Button>
        </div>
      </div>
    </div>
  )
}
