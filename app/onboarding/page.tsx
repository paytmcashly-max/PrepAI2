'use client'

export const dynamic = 'force-dynamic';

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { ArrowRight, Calendar, Clock, Target } from 'lucide-react'

const EXAMS = [
  { id: 'bihar-police-si', name: 'Bihar Police SI', level: 'intermediate' },
  { id: 'up-police', name: 'UP Police', level: 'intermediate' },
  { id: 'ssc-gd', name: 'SSC GD', level: 'beginner' },
  { id: 'ssc-cgl', name: 'SSC CGL Foundation', level: 'advanced' },
]

const STUDY_HOURS = [1, 2, 3, 4, 5, 6]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState('')
  const [selectedExam, setSelectedExam] = useState('')
  const [studyHours, setStudyHours] = useState(3)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  const handleContinue = () => {
    if (step === 1) {
      if (!fullName.trim()) {
        toast.error('Please enter your name')
        return
      }
      setStep(2)
    } else if (step === 2) {
      if (!selectedExam) {
        toast.error('Please select an exam')
        return
      }
      setStep(3)
    } else if (step === 3) {
      if (!startDate) {
        toast.error('Please select a start date')
        return
      }
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Please login first')
        router.push('/auth/login')
        return
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          exam_target: selectedExam,
          daily_study_hours: studyHours,
          plan_start_date: startDate,
        })

      if (error) throw error

      toast.success('Profile created successfully!')
      router.push('/dashboard')
    } catch (error) {
      console.error('[v0] Onboarding error:', error)
      toast.error('Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Welcome to PrepTrack</CardTitle>
          <CardDescription>Step {step} of 3: {step === 1 ? 'About You' : step === 2 ? 'Choose Exam' : 'Start Date'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Name */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block">Full Name</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                />
              </div>
            </div>
          )}

          {/* Step 2: Exam Selection */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-slate-300 text-sm font-medium mb-3 block">Select Your Target Exam</label>
                <div className="space-y-2">
                  {EXAMS.map((exam) => (
                    <button
                      key={exam.id}
                      onClick={() => setSelectedExam(exam.id)}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        selectedExam === exam.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{exam.name}</span>
                        <Target className={`w-4 h-4 ${selectedExam === exam.id ? 'text-blue-500' : 'text-slate-500'}`} />
                      </div>
                      <span className="text-xs text-slate-400">{exam.level}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-300 text-sm font-medium mb-3 block">Daily Study Hours</label>
                <div className="grid grid-cols-3 gap-2">
                  {STUDY_HOURS.map((hours) => (
                    <button
                      key={hours}
                      onClick={() => setStudyHours(hours)}
                      className={`py-2 rounded-lg border transition-all font-medium ${
                        studyHours === hours
                          ? 'border-green-500 bg-green-500/10 text-green-400'
                          : 'border-slate-600 bg-slate-700/30 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <Clock className="w-4 h-4 mx-auto mb-1" />
                      {hours}h
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Start Date */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block">Preparation Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
                <p className="text-slate-300 text-sm">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  You&apos;ll follow a structured 120-day preparation plan starting {new Date(startDate).toLocaleDateString()}.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-6">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="flex-1 bg-slate-700/30 border-slate-600 text-slate-300 hover:bg-slate-700/50"
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleContinue}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Saving...' : step === 3 ? 'Complete Setup' : 'Continue'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
