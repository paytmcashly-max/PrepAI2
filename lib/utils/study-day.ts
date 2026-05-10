import { differenceInCalendarDays, isValid, parseISO } from 'date-fns'

export type StudyPhase = 'foundation' | 'core' | 'practice' | 'revision' | 'final' | 'completed'

export interface StudyDayInfo {
  currentDay: number
  totalDays: number
  isActive: boolean
  isCompleted: boolean
  needsOnboarding: boolean
  daysRemaining: number
  progressPercentage: number
  phase: StudyPhase
  phaseName: string
}

const TOTAL_STUDY_DAYS = 120

const PHASE_DETAILS: Record<StudyPhase, { startDay: number; endDay: number; goal: string; name: string }> = {
  foundation: {
    startDay: 1,
    endDay: 30,
    goal: 'Build basic concepts and daily discipline.',
    name: 'Foundation Building',
  },
  core: {
    startDay: 31,
    endDay: 60,
    goal: 'Cover major exam chapters and start moderate practice.',
    name: 'Core Syllabus',
  },
  practice: {
    startDay: 61,
    endDay: 90,
    goal: 'Increase question practice, accuracy, and weekly mocks.',
    name: 'Practice Phase',
  },
  revision: {
    startDay: 91,
    endDay: 110,
    goal: 'Revise weak topics and solve previous-year questions.',
    name: 'Revision Phase',
  },
  final: {
    startDay: 111,
    endDay: 120,
    goal: 'Sharpen speed, accuracy, and test strategy.',
    name: 'Final Sprint',
  },
  completed: {
    startDay: 121,
    endDay: TOTAL_STUDY_DAYS,
    goal: 'Keep revising and taking mocks.',
    name: 'Revision Mode',
  },
}

function parseStartDate(startDate: string | Date | null | undefined): Date | null {
  if (!startDate) return null
  const parsedDate = typeof startDate === 'string' ? parseISO(startDate) : new Date(startDate)
  return isValid(parsedDate) ? parsedDate : null
}

export function getPhaseFromDay(day: number): StudyPhase {
  if (day <= 30) return 'foundation'
  if (day <= 60) return 'core'
  if (day <= 90) return 'practice'
  if (day <= 110) return 'revision'
  if (day <= TOTAL_STUDY_DAYS) return 'final'
  return 'completed'
}

export async function calculateStudyDay(startDate: string | Date | null | undefined): Promise<StudyDayInfo> {
  const parsedDate = parseStartDate(startDate)

  if (!parsedDate) {
    return {
      currentDay: 0,
      totalDays: TOTAL_STUDY_DAYS,
      isActive: false,
      isCompleted: false,
      needsOnboarding: true,
      daysRemaining: TOTAL_STUDY_DAYS,
      progressPercentage: 0,
      phase: 'foundation',
      phaseName: 'Not Started',
    }
  }

  const currentDay = differenceInCalendarDays(new Date(), parsedDate) + 1
  const boundedCurrentDay = Math.max(1, currentDay)
  const phase = getPhaseFromDay(boundedCurrentDay)
  const isActive = boundedCurrentDay >= 1 && boundedCurrentDay <= TOTAL_STUDY_DAYS
  const isCompleted = boundedCurrentDay > TOTAL_STUDY_DAYS
  const daysRemaining = Math.max(0, TOTAL_STUDY_DAYS - boundedCurrentDay + 1)
  const progressPercentage = getCompletionPercentage(boundedCurrentDay)

  return {
    currentDay: boundedCurrentDay,
    totalDays: TOTAL_STUDY_DAYS,
    isActive,
    isCompleted,
    needsOnboarding: false,
    daysRemaining,
    progressPercentage,
    phase,
    phaseName: PHASE_DETAILS[phase].name,
  }
}

export async function getStudyDayInfo(startDate: string | Date | null | undefined): Promise<StudyDayInfo> {
  return calculateStudyDay(startDate)
}

export function getPhaseDetails(phase: StudyPhase) {
  const details = PHASE_DETAILS[phase]
  return {
    startDay: details.startDay,
    endDay: details.endDay,
    duration: Math.max(0, details.endDay - details.startDay + 1),
    goal: details.goal,
  }
}

export function formatStudyProgress(info: StudyDayInfo): string {
  return `Day ${info.currentDay} of ${info.totalDays} - ${info.progressPercentage}% Complete`
}

export function getNextMilestone(currentDay: number): { day: number; milestone: string } {
  const milestones = [
    { day: 30, milestone: 'Complete Foundation Phase' },
    { day: 60, milestone: 'Complete Core Syllabus Phase' },
    { day: 90, milestone: 'Complete Practice Phase' },
    { day: 120, milestone: 'Complete Full Preparation' },
  ]

  return milestones.find(m => m.day >= currentDay) || { day: 120, milestone: 'Complete Full Preparation' }
}

export function getCompletionPercentage(currentDay: number): number {
  return Math.round((Math.min(Math.max(currentDay, 0), TOTAL_STUDY_DAYS) / TOTAL_STUDY_DAYS) * 100)
}

export function getPhaseColor(phase: StudyPhase): string {
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

export function getPhaseBgColor(phase: StudyPhase): string {
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
