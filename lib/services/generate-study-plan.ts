import type { SupabaseClient } from '@supabase/supabase-js'

type Level = 'weak' | 'average' | 'good'
type Priority = 'low' | 'medium' | 'high'
type TaskType = 'concept' | 'practice' | 'revision' | 'mock' | 'physical' | 'pyq' | 'notes'

interface ChapterRow {
  id: string
  exam_id: string
  subject_id: string
  name: string
  priority: Priority
  difficulty: 'easy' | 'medium' | 'hard'
  estimated_minutes: number
  order_index: number
}

interface GenerateStudyPlanInput {
  userId: string
  examId: string
  targetDays: number
  dailyStudyHours: number
  startDate: string
  mathsLevel: Level
  physicalLevel: Level
}

interface PlannedTask {
  user_id: string
  plan_id: string
  day_number: number
  task_date: string
  exam_id: string
  subject_id: string | null
  chapter_id: string | null
  title: string
  description: string
  task_type: TaskType
  estimated_minutes: number
  priority: Priority
  how_to_study: string[]
  status: 'pending'
}

const policePhysicalExams = new Set(['bihar_si', 'up_police', 'ssc_gd', 'bihar-si', 'up-police', 'ssc-gd'])
const reasoningPriorityExams = new Set(['bihar_si', 'up_police', 'bihar-si', 'up-police'])
const baseSubjectOrder = ['maths', 'gk_gs', 'gk-gs', 'hindi', 'english', 'reasoning', 'general-awareness', 'computer']

function addDays(dateValue: string, daysToAdd: number) {
  const date = new Date(`${dateValue}T00:00:00`)
  date.setDate(date.getDate() + daysToAdd)
  return date.toISOString().split('T')[0]
}

function getPhase(day: number, targetDays: number) {
  const foundationEnd = Math.ceil(targetDays * 0.25)
  const coreEnd = foundationEnd + Math.ceil(targetDays * 0.35)
  const practiceEnd = coreEnd + Math.ceil(targetDays * 0.25)

  if (day <= foundationEnd) return 'Foundation'
  if (day <= coreEnd) return 'Core Syllabus'
  if (day <= practiceEnd) return 'Practice'
  return 'Revision'
}

function filterChaptersByDuration(chapters: ChapterRow[], targetDays: number) {
  if (targetDays <= 45) return chapters.filter((chapter) => chapter.priority === 'high')
  if (targetDays <= 90) return chapters.filter((chapter) => chapter.priority !== 'low')
  return chapters
}

function distributeSubjects(chapters: ChapterRow[], mathsLevel: Level) {
  const subjects = [...new Set(chapters.map((chapter) => chapter.subject_id))]
  const ordered = baseSubjectOrder.filter((subject) => subjects.includes(subject))

  if (mathsLevel === 'weak' && ordered.includes('maths')) {
    return ['maths', ...ordered.filter((subject) => subject !== 'maths'), 'maths']
  }

  return ordered.length > 0 ? ordered : subjects
}

function firstAvailable(subjects: string[], candidates: string[]) {
  return candidates.find((candidate) => subjects.includes(candidate))
}

function pickSubjectForSlot(params: {
  examId: string
  subjectOrder: string[]
  day: number
  slot: number
  mathsLevel: Level
}) {
  const { examId, subjectOrder, day, slot, mathsLevel } = params

  if (!reasoningPriorityExams.has(examId)) {
    return subjectOrder[(day + slot - 1) % subjectOrder.length] || subjectOrder[0]
  }

  const reasoning = firstAvailable(subjectOrder, ['reasoning'])
  const hindi = firstAvailable(subjectOrder, ['hindi'])
  const maths = firstAvailable(subjectOrder, ['maths'])
  const generalStudies = firstAvailable(subjectOrder, ['gk_gs', 'gk-gs'])
  const weekDay = (day - 1) % 7
  const languagePattern = [
    reasoning,
    hindi,
    reasoning,
    hindi,
    reasoning,
    generalStudies || hindi,
    reasoning,
  ]
  const primaryPattern = mathsLevel === 'weak'
    ? [maths, maths, maths, maths, maths, generalStudies, maths]
    : [maths, generalStudies, maths, generalStudies, maths, hindi, maths]

  const preferred = slot === 0
    ? primaryPattern[weekDay]
    : slot === 1
      ? languagePattern[weekDay]
      : subjectOrder[(day + slot - 1) % subjectOrder.length]

  return preferred || subjectOrder[(day + slot - 1) % subjectOrder.length] || subjectOrder[0]
}

function physicalMinutes(level: Level, day: number) {
  const base = level === 'weak' ? 20 : level === 'average' ? 30 : 40
  const weeklyIncrement = level === 'weak' ? 5 : level === 'average' ? 7 : 10
  return Math.min(base + Math.floor((day - 1) / 7) * weeklyIncrement, 75)
}

function buildStudyTask(params: {
  userId: string
  planId: string
  day: number
  taskDate: string
  examId: string
  chapter: ChapterRow
  phase: string
  taskType: TaskType
  minutes: number
}): PlannedTask {
  const action = params.taskType === 'pyq'
    ? 'Solve PYQs for'
    : params.taskType === 'revision'
      ? 'Revise'
      : params.taskType === 'practice'
        ? 'Practice'
        : 'Study'

  return {
    user_id: params.userId,
    plan_id: params.planId,
    day_number: params.day,
    task_date: params.taskDate,
    exam_id: params.examId,
    subject_id: params.chapter.subject_id,
    chapter_id: params.chapter.id,
    title: `${action} ${params.chapter.name}`,
    description: `${params.phase} phase task for ${params.chapter.name}.`,
    task_type: params.taskType,
    estimated_minutes: params.minutes,
    priority: params.chapter.priority,
    how_to_study: [
      'Read core concepts and examples first.',
      'Practice timed questions without checking answers immediately.',
      'Mark weak points for weekly revision.',
    ],
    status: 'pending',
  }
}

export async function generateStudyPlan(
  supabase: SupabaseClient,
  input: GenerateStudyPlanInput
) {
  const targetDays = Math.max(7, input.targetDays)
  const dailyStudyHours = Math.max(1, input.dailyStudyHours)

  const { data: chapters, error: chaptersError } = await supabase
    .from('chapters')
    .select('id, exam_id, subject_id, name, priority, difficulty, estimated_minutes, order_index')
    .eq('exam_id', input.examId)
    .order('priority', { ascending: true })
    .order('order_index', { ascending: true })

  if (chaptersError) throw chaptersError

  const selectedChapters = filterChaptersByDuration((chapters || []) as ChapterRow[], targetDays)
    .sort((a, b) => {
      const priorityRank: Record<Priority, number> = { high: 0, medium: 1, low: 2 }
      return priorityRank[a.priority] - priorityRank[b.priority] || a.order_index - b.order_index
    })

  if (selectedChapters.length === 0) {
    throw new Error('No master chapters are available for the selected exam.')
  }

  await supabase
    .from('user_study_plans')
    .update({ status: 'archived' })
    .eq('user_id', input.userId)
    .eq('status', 'active')

  const { data: plan, error: planError } = await supabase
    .from('user_study_plans')
    .insert({
      user_id: input.userId,
      exam_id: input.examId,
      target_days: targetDays,
      daily_study_hours: dailyStudyHours,
      start_date: input.startDate,
      status: 'active',
    })
    .select('id')
    .single()

  if (planError) throw planError
  if (!plan?.id) throw new Error('Could not create study plan.')

  const subjectOrder = distributeSubjects(selectedChapters, input.mathsLevel)
  const chaptersBySubject = selectedChapters.reduce((acc, chapter) => {
    acc[chapter.subject_id] = acc[chapter.subject_id] || []
    acc[chapter.subject_id].push(chapter)
    return acc
  }, {} as Record<string, ChapterRow[]>)
  const subjectCursor = Object.fromEntries(subjectOrder.map((subject) => [subject, 0])) as Record<string, number>
  const totalDailyMinutes = dailyStudyHours * 60
  const includesPhysical = policePhysicalExams.has(input.examId)
  const foundationEnd = Math.ceil(targetDays * 0.25)
  const reviewDays = new Set([
    Math.ceil(targetDays * 0.25),
    Math.ceil(targetDays * 0.5),
    Math.ceil(targetDays * 0.75),
    targetDays,
  ])
  const tasks: PlannedTask[] = []

  for (let day = 1; day <= targetDays; day++) {
    const taskDate = addDays(input.startDate, day - 1)
    const phase = getPhase(day, targetDays)
    const isWeeklyRevision = day % 7 === 0
    const isMockDay = day > foundationEnd && day % 7 === 0
    const isReviewDay = reviewDays.has(day)
    const physicalTaskMinutes = includesPhysical ? physicalMinutes(input.physicalLevel, day) : 0
    const studyBudget = Math.max(45, totalDailyMinutes - physicalTaskMinutes)
    const academicTaskCount = isMockDay || isReviewDay ? 2 : Math.min(4, Math.max(2, Math.floor(studyBudget / 45)))
    const perTaskMinutes = Math.max(25, Math.floor(studyBudget / academicTaskCount))

    for (let slot = 0; slot < academicTaskCount; slot++) {
      const subjectId = pickSubjectForSlot({
        examId: input.examId,
        subjectOrder,
        day,
        slot,
        mathsLevel: input.mathsLevel,
      })
      const subjectChapters = chaptersBySubject[subjectId] || selectedChapters
      const cursor = subjectCursor[subjectId] || 0
      const chapter = subjectChapters[cursor % subjectChapters.length]
      subjectCursor[subjectId] = cursor + 1

      const taskType: TaskType = isMockDay && slot === 0
        ? 'mock'
        : isReviewDay
          ? 'revision'
          : isWeeklyRevision
            ? 'revision'
            : phase === 'Practice'
              ? 'pyq'
              : phase === 'Revision'
                ? 'revision'
                : slot % 2 === 0
                  ? 'concept'
                  : 'practice'

      tasks.push(buildStudyTask({
        userId: input.userId,
        planId: plan.id,
        day,
        taskDate,
        examId: input.examId,
        chapter,
        phase,
        taskType,
        minutes: taskType === 'mock' ? Math.max(60, perTaskMinutes) : perTaskMinutes,
      }))
    }

    if (includesPhysical) {
      tasks.push({
        user_id: input.userId,
        plan_id: plan.id,
        day_number: day,
        task_date: taskDate,
        exam_id: input.examId,
        subject_id: 'physical',
        chapter_id: null,
        title: `${phase} physical training`,
        description: 'Running, mobility, strength basics, and recovery according to your current level.',
        task_type: 'physical',
        estimated_minutes: physicalTaskMinutes,
        priority: 'high',
        how_to_study: [
          'Warm up before running or drills.',
          'Keep pace comfortable and progress gradually.',
          'Stretch and hydrate after training.',
        ],
        status: 'pending',
      })
    }
  }

  const chunkSize = 500
  for (let index = 0; index < tasks.length; index += chunkSize) {
    const chunk = tasks.slice(index, index + chunkSize)
    const { error } = await supabase.from('user_daily_tasks').insert(chunk)
    if (error) throw error
  }

  return { planId: plan.id as string, taskCount: tasks.length }
}
