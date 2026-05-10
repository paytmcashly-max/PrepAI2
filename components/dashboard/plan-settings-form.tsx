'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, CheckCircle2, RotateCcw, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { regeneratePlanFromSettings } from '@/lib/actions'
import { levelOptions, studyHourOptions, targetDayOptions } from '@/lib/config/onboarding-options'
import { todayLocalDateString } from '@/lib/date-utils'
import type { Exam, Profile, UserStudyPlan } from '@/lib/types'
import { cn } from '@/lib/utils'

type Level = 'weak' | 'average' | 'good'

interface PlanSettingsFormProps {
  plan: UserStudyPlan | null
  profile: Profile | null
  exams: Exam[]
}

function toSelectValue(value: number | undefined, options: number[]) {
  if (!value) return String(options[0])
  return options.includes(value) ? String(value) : 'custom'
}

export function PlanSettingsForm({ plan, profile, exams }: PlanSettingsFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const initialTargetDays = plan?.target_days || profile?.target_days || 90
  const initialStudyHours = plan?.daily_study_hours || profile?.daily_study_hours || 3
  const [customDays, setCustomDays] = useState(targetDayOptions.includes(initialTargetDays) ? '' : String(initialTargetDays))
  const [customHours, setCustomHours] = useState(studyHourOptions.includes(initialStudyHours) ? '' : String(initialStudyHours))
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    examTarget: plan?.exam_id || profile?.exam_target || exams[0]?.id || '',
    targetDays: toSelectValue(initialTargetDays, targetDayOptions),
    dailyStudyHours: toSelectValue(initialStudyHours, studyHourOptions),
    startDate: plan?.start_date || profile?.start_date || todayLocalDateString(),
    mathsLevel: (profile?.maths_level || 'average') as Level,
    physicalLevel: (profile?.physical_level || 'average') as Level,
    englishBackground: Boolean(profile?.english_background),
    studyLanguage: profile?.study_language || 'hindi',
  })

  const resolvedTargetDays = formData.targetDays === 'custom' ? Number(customDays) : Number(formData.targetDays)
  const resolvedStudyHours = formData.dailyStudyHours === 'custom' ? Number(customHours) : Number(formData.dailyStudyHours)
  const selectedExam = useMemo(
    () => exams.find((exam) => exam.id === formData.examTarget),
    [exams, formData.examTarget]
  )
  const isValid = Boolean(formData.examTarget) && resolvedTargetDays >= 7 && resolvedStudyHours >= 1 && Boolean(formData.startDate)

  const submit = () => {
    if (!isValid) {
      toast.error('Please fill valid plan settings before regenerating.')
      return
    }

    startTransition(async () => {
      try {
        await regeneratePlanFromSettings({
          examTarget: formData.examTarget,
          targetDays: resolvedTargetDays,
          dailyStudyHours: resolvedStudyHours,
          startDate: formData.startDate,
          mathsLevel: formData.mathsLevel,
          physicalLevel: formData.physicalLevel,
          englishBackground: formData.englishBackground,
          studyLanguage: formData.studyLanguage,
        })
        toast.success('Your study plan was regenerated')
        setOpen(false)
        router.push('/dashboard')
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not regenerate plan')
      }
    })
  }

  const renderLevelOptions = (
    groupName: 'mathsLevel' | 'physicalLevel',
    value: Level,
    label: string
  ) => (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <RadioGroup
        value={value}
        onValueChange={(nextValue) => setFormData({ ...formData, [groupName]: nextValue as Level })}
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        {levelOptions.map((level) => {
          const id = `${groupName}-${level.value}`
          const isSelected = value === level.value

          return (
            <Label
              key={level.value}
              htmlFor={id}
              className={cn(
                'flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 p-3 text-center font-medium transition-colors',
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-muted bg-background hover:border-primary/60 hover:bg-accent'
              )}
            >
              <RadioGroupItem id={id} value={level.value} className="sr-only" />
              <span>{level.label}</span>
              {isSelected && <CheckCircle2 className="h-4 w-4" />}
            </Label>
          )
        })}
      </RadioGroup>
    </div>
  )

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Plan Settings</h1>
        <p className="text-muted-foreground">Adjust your active plan and regenerate future daily tasks.</p>
      </div>

      {!plan && (
        <Alert>
          <Settings2 className="h-4 w-4" />
          <AlertTitle>No active plan found</AlertTitle>
          <AlertDescription>
            Choose settings below and regenerate to create a fresh active study plan.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            Regeneration first creates a new complete plan, then archives the current one. Old tasks are preserved but ignored by dashboard progress.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Exam</Label>
              <Select value={formData.examTarget} onValueChange={(value) => setFormData({ ...formData, examTarget: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exam" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedExam?.level && (
                <p className="text-xs text-muted-foreground">{selectedExam.level}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Preparation start date</Label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(event) => setFormData({ ...formData, startDate: event.target.value })}
                  className="pl-9"
                />
              </div>
            </div>

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
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {renderLevelOptions('mathsLevel', formData.mathsLevel, 'Maths level')}
            {renderLevelOptions('physicalLevel', formData.physicalLevel, 'Physical level')}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div className="min-w-0 space-y-1">
                <Label htmlFor="englishBackground">English background</Label>
                <p className="text-sm text-muted-foreground">
                  Keep this on if you are comfortable studying exam content in English.
                </p>
              </div>
              <Switch
                id="englishBackground"
                checked={formData.englishBackground}
                onCheckedChange={(checked) => setFormData({ ...formData, englishBackground: checked })}
              />
            </div>

            <div className="grid gap-2">
              <Label>Study language</Label>
              <Select
                value={formData.studyLanguage}
                onValueChange={(value) => setFormData({ ...formData, studyLanguage: value as 'hindi' | 'english' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose study language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hindi">Hindi</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Saved for future Hindi/English exam-mode support.
              </p>
            </div>
          </div>

          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <Button disabled={!isValid || isPending}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Regenerate Plan
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Regenerate your study plan?</AlertDialogTitle>
                <AlertDialogDescription>
                  A new plan will be generated from these settings before your current active plan is archived. Old tasks will remain in the database but will not affect dashboard, tasks, or progress.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(event) => {
                    event.preventDefault()
                    submit()
                  }}
                  disabled={isPending}
                >
                  {isPending ? 'Regenerating...' : 'Regenerate safely'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
