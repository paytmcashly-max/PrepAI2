"use server"

import { differenceInCalendarDays, parseISO, isValid } from 'date-fns'

export interface StudyDayInfo {
  currentDay: number
  totalDays: number
  isActive: boolean
  isCompleted: boolean
  needsOnboarding: boolean
  daysRemaining: number
  progressPercentage: number
  phase: 'foundation' | 'core' | 'practice' | 'revision' | 'final' | 'completed'
  phaseName: string
}

const TOTAL_STUDY_DAYS = 120

export async function calculateStudyDay(startDate: string | Date | null | undefined): Promise<StudyDayInfo> {
  // If no start date, user needs onboarding
  if (!startDate) {
    return {
      currentDay: 0,
      totalDays: TOTAL_STUDY_DAYS,
      isActive: false,
      isCompleted: false,
      needsOnboarding: true,
      daysRemaining: TOTAL_STUDY_DAYS,
      progressPercentage: 0,
      phase: 'foundation',
      phaseName: 'Not Started'
    }
  }

  // Parse the date
  const parsedDate = typeof startDate === 'string' ? parseISO(startDate) : startDate
  
  if (!isValid(parsedDate)) {
    return {
      currentDay: 0,
      totalDays: TOTAL_STUDY_DAYS,
      isActive: false,
      isCompleted: false,
      needsOnboarding: true,
      daysRemaining: TOTAL_STUDY_DAYS,
      progressPercentage: 0,
      phase: 'foundation',
      phaseName: 'Not Started'
    }
  }

  const today = new Date()
  const currentDay = differenceInCalendarDays(today, parsedDate) + 1

  // Determine phase based on current day
  let phase: StudyDayInfo['phase']
  let phaseName: string

  if (currentDay <= 30) {
    phase = 'foundation'
    phaseName = 'Foundation Building'
  } else if (currentDay <= 60) {
    phase = 'core'
    phaseName = 'Core Syllabus'
  } else if (currentDay <= 90) {
    phase = 'practice'
    phaseName = 'Practice Phase'
  } else if (currentDay <= 110) {
    phase = 'revision'
    phaseName = 'Revision Phase'
  } else if (currentDay <= 120) {
    phase = 'final'
    phaseName = 'Final Sprint'
  } else {
    phase = 'completed'
    phaseName = 'Revision Mode'
  }

  const isActive = currentDay >= 1 && currentDay <= TOTAL_STUDY_DAYS
  const isCompleted = currentDay > TOTAL_STUDY_DAYS
  const daysRemaining = Math.max(0, TOTAL_STUDY_DAYS - currentDay + 1)
  const progressPercentage = Math.min(100, Math.max(0, ((currentDay - 1) / TOTAL_STUDY_DAYS) * 100))

  return {
    currentDay: Math.max(1, currentDay),
    totalDays: TOTAL_STUDY_DAYS,
    isActive,
    isCompleted,
    needsOnboarding: false,
    daysRemaining,
    progressPercentage,
    phase,
    phaseName
  }
}

export function getPhaseColor(phase: StudyDayInfo['phase']): string {
  switch (phase) {
    case 'foundation':
      return 'text-blue-500'
    case 'core':
      return 'text-purple-500'
    case 'practice':
      return 'text-green-500'
    case 'revision':
      return 'text-orange-500'
    case 'final':
      return 'text-red-500'
    case 'completed':
      return 'text-emerald-500'
    default:
      return 'text-gray-500'
  }
}

export function getPhaseBgColor(phase: StudyDayInfo['phase']): string {
  switch (phase) {
    case 'foundation':
      return 'bg-blue-500/10'
    case 'core':
      return 'bg-purple-500/10'
    case 'practice':
      return 'bg-green-500/10'
    case 'revision':
      return 'bg-orange-500/10'
    case 'final':
      return 'bg-red-500/10'
    case 'completed':
      return 'bg-emerald-500/10'
    default:
      return 'bg-gray-500/10'
  }
}
