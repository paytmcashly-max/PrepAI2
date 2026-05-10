'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle } from 'lucide-react'

export default function Page() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Check if user has completed onboarding
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan_start_date')
          .eq('id', user.id)
          .single()

        if (profile?.plan_start_date) {
          router.push('/dashboard')
        } else {
          router.push('/onboarding')
        }
      } else {
        setLoading(false)
      }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-20 sm:py-32">
        <div className="text-center mb-20">
          <h1 className="text-5xl sm:text-7xl font-bold text-white mb-6 text-balance">
            Master Your <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Competitive Exams</span>
          </h1>
          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto text-balance">
            AI-powered 120-day structured learning roadmap with daily tasks, mock tests, and real-time progress tracking for Bihar Police SI, UP Police, SSC GD, and SSC CGL exams.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push('/auth/sign-up')}
              className="px-8 py-6 text-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold"
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              onClick={() => router.push('/auth/login')}
              variant="outline"
              className="px-8 py-6 text-lg border-slate-600 text-white hover:bg-slate-800"
            >
              Login
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-blue-400" />
              <h3 className="text-white font-semibold text-lg">120-Day Roadmap</h3>
            </div>
            <p className="text-slate-400">Structured learning path divided into 4 phases with clear milestones and learning objectives for comprehensive exam preparation.</p>
          </div>

          <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-purple-400" />
              <h3 className="text-white font-semibold text-lg">Daily Tasks</h3>
            </div>
            <p className="text-slate-400">5 personalized daily tasks across Mathematics, General Knowledge, Hindi, Reasoning, and Physics with difficulty tracking.</p>
          </div>

          <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-pink-400" />
              <h3 className="text-white font-semibold text-lg">Mock Tests</h3>
            </div>
            <p className="text-slate-400">Practice with full-length mock tests, track performance trends, analyze weak areas, and improve scores systematically.</p>
          </div>

          <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-orange-400" />
              <h3 className="text-white font-semibold text-lg">Progress Analytics</h3>
            </div>
            <p className="text-slate-400">Real-time dashboards, subject-wise analytics, streak tracking, and performance metrics for data-driven improvement.</p>
          </div>

          <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <h3 className="text-white font-semibold text-lg">Study Notes</h3>
            </div>
            <p className="text-slate-400">Create, organize, and search your study notes by subject and chapter with full markdown support.</p>
          </div>

          <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-cyan-400" />
              <h3 className="text-white font-semibold text-lg">PYQ Collection</h3>
            </div>
            <p className="text-slate-400">Comprehensive previous year questions database organized by year, subject, and difficulty level.</p>
          </div>
        </div>

        <div className="text-center mb-20">
          <h2 className="text-3xl font-bold text-white mb-8">Supported Exams</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Bihar Police SI', 'UP Police', 'SSC GD', 'SSC CGL'].map((exam) => (
              <div
                key={exam}
                className="p-4 bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 text-white font-semibold hover:border-blue-500 transition-colors"
              >
                {exam}
              </div>
            ))}
          </div>
        </div>

        <div className="text-center p-12 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-lg border border-slate-700">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Journey?</h2>
          <p className="text-slate-400 mb-6 max-w-xl mx-auto">Join thousands of students preparing for competitive exams with PrepAI&apos;s structured learning approach.</p>
          <Button
            onClick={() => router.push('/auth/sign-up')}
            className="px-8 py-3 text-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold"
          >
            Create Free Account
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
