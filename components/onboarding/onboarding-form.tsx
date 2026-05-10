'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, CheckCircle2, Clock, Dumbbell, GraduationCap, Target, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { completeOnboarding } from '@/lib/actions'
import { levelOptions, studyHourOptions, targetDayOptions } from '@/lib/config/onboarding-options'
import { cn } from '@/lib/utils'

interface ExamOption {
  id: string
  name: string
  level: string | null
}

interface OnboardingFormProps {
  exams: ExamOption[]
}

const steps = [
  { id: 1, title: 'Profile', icon: UserRound },
  { id: 2, title: 'Exam', icon: Target },
  { id: 3, title: 'Timeline', icon: Clock },
  { id: 4, title: 'Levels', icon: Dumbbell },
]

export function OnboardingForm({ exams }: OnboardingFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [currentStep, setCurrentStep] = useState(1)
  const [customDays, setCustomDays] = useState('')
  const [customHours, setCustomHours] = useState('')
  const [formData, setFormData] = useState({
    fullName: '',
    examTarget: exams[0]?.id || '',
    targetDays: '90',
    dailyStudyHours: '3',
    startDate: new Date().toISOString().split('T')[0],
    mathsLevel: 'average' as 'weak' | 'average' | 'good',
    physicalLevel: 'average' as 'weak' | 'average' | 'good',
    englishBackground: false,
    currentEducation: '',
  })

  const resolvedTargetDays = formData.targetDays === 'custom' ? Number(customDays) : Number(formData.targetDays)
  const resolvedStudyHours = formData.dailyStudyHours === 'custom' ? Number(customHours) : Number(formData.dailyStudyHours)

  const canProceed = () => {
    if (currentStep === 1) return formData.fullName.trim().length >= 2
    if (currentStep === 2) return formData.examTarget.length > 0
    if (currentStep === 3) return resolvedTargetDays > 0 && resolvedStudyHours > 0 && formData.startDate.length > 0
    return true
  }

  const submit = () => {
    if (!canProceed()) return

    startTransition(async () => {
      try {
        await completeOnboarding({
          fullName: formData.fullName.trim(),
          examTarget: formData.examTarget,
          targetDays: resolvedTargetDays,
          dailyStudyHours: resolvedStudyHours,
          startDate: formData.startDate,
          mathsLevel: formData.mathsLevel,
          physicalLevel: formData.physicalLevel,
          englishBackground: formData.englishBackground,
          currentEducation: formData.currentEducation.trim() || null,
        })
        toast.success('Your personalized plan is ready')
        router.push('/dashboard')
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not create your plan')
      }
    })
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Build your exam plan</h1>
          <p className="mt-2 text-muted-foreground">A deterministic daily roadmap based on your target, time, and current level.</p>
        </div>

        <div className="flex items-center justify-center gap-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                  currentStep > step.id && 'border-primary bg-primary text-primary-foreground',
                  currentStep === step.id && 'border-primary text-primary',
                  currentStep < step.id && 'border-muted text-muted-foreground'
                )}
              >
                {currentStep > step.id ? <CheckCircle2 className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
              </div>
              {index < steps.length - 1 && (
                <div className={cn('mx-2 h-0.5 w-10 transition-colors', currentStep > step.id ? 'bg-primary' : 'bg-muted')} />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1]?.title}</CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Tell us who the plan is for.'}
              {currentStep === 2 && 'Choose the exam you are targeting now.'}
              {currentStep === 3 && 'Set your duration, daily hours, and start date.'}
              {currentStep === 4 && 'Tune difficulty and physical progression.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === 1 && (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(event) => setFormData({ ...formData, fullName: event.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="currentEducation">Current education optional</Label>
                  <Input
                    id="currentEducation"
                    value={formData.currentEducation}
                    onChange={(event) => setFormData({ ...formData, currentEducation: event.target.value })}
                    placeholder="Example: Graduation, 12th pass"
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <RadioGroup
                value={formData.examTarget}
                onValueChange={(value) => setFormData({ ...formData, examTarget: value })}
                className="grid gap-3"
              >
                {exams.map((exam) => (
                  <Label
                    key={exam.id}
                    htmlFor={exam.id}
                    className={cn(
                      'flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition-colors',
                      formData.examTarget === exam.id ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/50'
                    )}
                  >
                    <RadioGroupItem value={exam.id} id={exam.id} className="sr-only" />
                    <GraduationCap className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-semibold">{exam.name}</div>
                      {exam.level && <div className="text-sm text-muted-foreground">{exam.level}</div>}
                    </div>
                    {formData.examTarget === exam.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                  </Label>
                ))}
              </RadioGroup>
            )}

            {currentStep === 3 && (
              <div className="grid gap-5">
                <div className="grid gap-2">
                  <Label>Target duration</Label>
                  <Select value={formData.targetDays} onValueChange={(value) => setFormData({ ...formData, targetDays: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select days" />
                    </SelectTrigger>
                    <SelectContent>
                      {targetDayOptions.map((days) => (
                        <SelectItem key={days} value={String(days)}>{days} days</SelectItem>
                      ))}
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.targetDays === 'custom' && (
                    <Input
                      type="number"
                      min={7}
                      value={customDays}
                      onChange={(event) => setCustomDays(event.target.value)}
                      placeholder="Enter target days"
                    />
                  )}
                </div>

                <div className="grid gap-2">
                  <Label>Daily study hours</Label>
                  <Select value={formData.dailyStudyHours} onValueChange={(value) => setFormData({ ...formData, dailyStudyHours: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select hours" />
                    </SelectTrigger>
                    <SelectContent>
                      {studyHourOptions.map((hours) => (
                        <SelectItem key={hours} value={String(hours)}>{hours} hours</SelectItem>
                      ))}
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.dailyStudyHours === 'custom' && (
                    <Input
                      type="number"
                      min={1}
                      value={customHours}
                      onChange={(event) => setCustomHours(event.target.value)}
                      placeholder="Enter daily hours"
                    />
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="startDate">Preparation start date</Label>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(event) => setFormData({ ...formData, startDate: event.target.value })}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="grid gap-5">
                <div className="grid gap-2">
                  <Label>Maths level</Label>
                  <RadioGroup
                    value={formData.mathsLevel}
                    onValueChange={(value) => setFormData({ ...formData, mathsLevel: value as typeof formData.mathsLevel })}
                    className="grid grid-cols-3 gap-3"
                  >
                    {levelOptions.map((level) => (
                      <Label key={level.value} className="cursor-pointer rounded-lg border p-3 text-center">
                        <RadioGroupItem value={level.value} className="sr-only" />
                        {level.label}
                      </Label>
                    ))}
                  </RadioGroup>
                </div>

                <div className="grid gap-2">
                  <Label>Physical level</Label>
                  <RadioGroup
                    value={formData.physicalLevel}
                    onValueChange={(value) => setFormData({ ...formData, physicalLevel: value as typeof formData.physicalLevel })}
                    className="grid grid-cols-3 gap-3"
                  >
                    {levelOptions.map((level) => (
                      <Label key={level.value} className="cursor-pointer rounded-lg border p-3 text-center">
                        <RadioGroupItem value={level.value} className="sr-only" />
                        {level.label}
                      </Label>
                    ))}
                  </RadioGroup>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label htmlFor="englishBackground">English background</Label>
                    <p className="text-sm text-muted-foreground">Enable this if you are comfortable studying English questions.</p>
                  </div>
                  <Switch
                    id="englishBackground"
                    checked={formData.englishBackground}
                    onCheckedChange={(checked) => setFormData({ ...formData, englishBackground: checked })}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep((step) => Math.max(1, step - 1))} disabled={currentStep === 1 || isPending}>
                Back
              </Button>
              {currentStep < steps.length ? (
                <Button onClick={() => setCurrentStep((step) => step + 1)} disabled={!canProceed() || isPending}>
                  Continue
                </Button>
              ) : (
                <Button onClick={submit} disabled={!canProceed() || isPending}>
                  {isPending ? 'Generating plan...' : 'Generate my plan'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
