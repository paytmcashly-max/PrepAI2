/**
 * Study day calculation utilities
 * Helps determine current day in 120-day preparation plan
 */

export interface StudyDayInfo {
  currentDay: number
  totalDays: number
  phase: StudyPhase
  percentComplete: number
  daysRemaining: number
  isCompleted: boolean
  isRevision: boolean
}

export type StudyPhase = 'foundation' | 'core-syllabus' | 'practice' | 'revision-test'

const PHASES = {
  'foundation': { start: 1, end: 30 },
  'core-syllabus': { start: 31, end: 60 },
  'practice': { start: 61, end: 90 },
  'revision-test': { start: 91, end: 120 },
}

/**
 * Calculate current day in 120-day plan based on start date
 */
export function calculateStudyDay(startDate: Date | string): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const today = new Date()
  
  // Reset time to midnight for accurate day calculation
  start.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  
  const diffTime = today.getTime() - start.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
  
  return Math.min(diffDays, 120)
}

/**
 * Determine study phase from day number
 */
export function getPhaseFromDay(day: number): StudyPhase {
  if (day <= 30) return 'foundation'
  if (day <= 60) return 'core-syllabus'
  if (day <= 90) return 'practice'
  return 'revision-test'
}

/**
 * Get comprehensive study day information
 */
export function getStudyDayInfo(startDate: Date | string): StudyDayInfo {
  const currentDay = calculateStudyDay(startDate)
  const phase = getPhaseFromDay(currentDay)
  const percentComplete = Math.round((currentDay / 120) * 100)
  const daysRemaining = Math.max(0, 120 - currentDay + 1)
  const isCompleted = currentDay >= 120
  const isRevision = phase === 'revision-test'

  return {
    currentDay,
    totalDays: 120,
    phase,
    percentComplete,
    daysRemaining,
    isCompleted,
    isRevision,
  }
}

/**
 * Get phase details
 */
export function getPhaseDetails(phase: StudyPhase) {
  const phaseInfo = PHASES[phase]
  const goals = {
    'foundation': 'Build basic concepts and daily discipline.',
    'core-syllabus': 'Cover major exam chapters and start moderate practice.',
    'practice': 'Increase question practice, accuracy, and weekly mocks.',
    'revision-test': 'Revise, solve PYQs, mock tests, and improve weak topics.',
  }

  return {
    startDay: phaseInfo.start,
    endDay: phaseInfo.end,
    duration: phaseInfo.end - phaseInfo.start + 1,
    goal: goals[phase],
  }
}

/**
 * Format study progress for display
 */
export function formatStudyProgress(info: StudyDayInfo): string {
  return `Day ${info.currentDay} of ${info.totalDays} • ${info.percentComplete}% Complete`
}

/**
 * Get next study milestone
 */
export function getNextMilestone(currentDay: number): { day: number; milestone: string } {
  const milestones = [
    { day: 30, milestone: 'Complete Foundation Phase' },
    { day: 60, milestone: 'Complete Core Syllabus Phase' },
    { day: 90, milestone: 'Complete Practice Phase' },
    { day: 120, milestone: 'Complete Full Preparation' },
  ]

  const next = milestones.find(m => m.day >= currentDay)
  return next || { day: 120, milestone: 'Complete Full Preparation' }
}

/**
 * Calculate preparation completion percentage
 */
export function getCompletionPercentage(currentDay: number): number {
  return Math.round((Math.min(currentDay, 120) / 120) * 100)
}
