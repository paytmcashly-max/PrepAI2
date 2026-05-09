'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Target, Calendar, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

const phases = [
  {
    number: 1,
    title: 'Foundation Building',
    days: '1-30',
    description: 'Lay the foundation with basic concepts and fundamentals across all subjects.',
    focus: ['Maths Basics', 'GK Fundamentals', 'Hindi Grammar', 'Logical Reasoning', 'Science Basics'],
    color: 'from-blue-600 to-blue-700',
  },
  {
    number: 2,
    title: 'Concept Mastery',
    days: '31-60',
    description: 'Deepen understanding of intermediate concepts and problem-solving techniques.',
    focus: ['Advanced Maths', 'Current Affairs', 'Hindi Writing', 'Puzzles & Games', 'Physics & Chemistry'],
    color: 'from-purple-600 to-purple-700',
  },
  {
    number: 3,
    title: 'Practice & Application',
    days: '61-90',
    description: 'Apply concepts through extensive practice and mock tests.',
    focus: ['Problem Solving', 'GK Application', 'Reading Comprehension', 'Critical Thinking', 'Numerical Ability'],
    color: 'from-pink-600 to-pink-700',
  },
  {
    number: 4,
    title: 'Revision & Assessment',
    days: '91-120',
    description: 'Final revision, full-length mock tests, and performance optimization.',
    focus: ['Complete Revision', 'Full Mock Tests', 'Weak Area Focus', 'Speed & Accuracy', 'Final Preparation'],
    color: 'from-green-600 to-green-700',
  },
]

export default function RoadmapPage() {
  const router = useRouter()

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
          <h1 className="text-4xl font-bold text-white mb-4">120-Day Learning Roadmap</h1>
          <p className="text-slate-400 text-lg">
            A structured 4-phase preparation plan designed to systematically build your exam readiness from fundamentals to mastery.
          </p>
        </div>

        {/* Timeline */}
        <div className="space-y-6">
          {phases.map((phase, index) => (
            <Card key={phase.number} className="bg-slate-800/50 border-slate-700 overflow-hidden">
              <div className={`bg-gradient-to-r ${phase.color} h-1`}></div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${phase.color} flex items-center justify-center text-white font-bold text-lg`}>
                      {phase.number}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{phase.title}</h3>
                      <div className="flex items-center gap-2 text-slate-400 mt-1">
                        <Calendar className="w-4 h-4" />
                        <span>Days {phase.days}</span>
                      </div>
                    </div>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-slate-600" />
                </div>

                <p className="text-slate-300 mb-4">{phase.description}</p>

                <div>
                  <p className="text-sm font-semibold text-slate-300 mb-2">Key Focus Areas:</p>
                  <div className="flex flex-wrap gap-2">
                    {phase.focus.map((topic) => (
                      <span key={topic} className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-full text-sm">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

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
