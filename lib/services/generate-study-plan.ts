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

interface TaskTemplateRow {
  exam_id: string | null
  subject_id: string | null
  task_type: TaskType
  title_template: string
  description_template: string | null
  estimated_minutes: number
  priority: Priority
  how_to_study: string[] | null
}

const policePhysicalExams = new Set(['bihar_si', 'up_police', 'ssc_gd', 'bihar-si', 'up-police', 'ssc-gd'])
const reasoningPriorityExams = new Set(['bihar_si', 'up_police', 'bihar-si', 'up-police'])
const balancedPoliceExams = new Set(['bihar_si', 'up_police', 'bihar-si', 'up-police'])
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

function resolvePoliceSubject(subjectOrder: string[], subjectKey: 'maths' | 'gk' | 'hindi' | 'reasoning') {
  const candidates = {
    maths: ['maths', 'quant', 'quantitative-aptitude'],
    gk: ['gk_gs', 'gk-gs', 'general-awareness', 'ga'],
    hindi: ['hindi'],
    reasoning: ['reasoning'],
  }[subjectKey]

  return firstAvailable(subjectOrder, candidates)
}

function pickBalancedPoliceSubject(subjectOrder: string[], day: number, slot: number, academicTaskCount: number) {
  const subjectByKey = {
    maths: resolvePoliceSubject(subjectOrder, 'maths'),
    gk: resolvePoliceSubject(subjectOrder, 'gk'),
    hindi: resolvePoliceSubject(subjectOrder, 'hindi'),
    reasoning: resolvePoliceSubject(subjectOrder, 'reasoning'),
  }
  const weekDay = (day - 1) % 7
  const weeklyPattern: Array<Array<keyof typeof subjectByKey>> = academicTaskCount <= 2
    ? [
        ['maths', 'gk'],
        ['gk', 'reasoning'],
        ['maths', 'hindi'],
        ['gk', 'reasoning'],
        ['maths', 'hindi'],
        ['gk', 'reasoning'],
        ['maths', 'hindi'],
      ]
    : academicTaskCount === 3
      ? [
          ['maths', 'gk', 'hindi'],
          ['gk', 'reasoning', 'maths'],
          ['gk', 'hindi', 'reasoning'],
          ['maths', 'gk', 'hindi'],
          ['gk', 'reasoning', 'maths'],
          ['gk', 'reasoning', 'hindi'],
          ['maths', 'gk', 'reasoning'],
        ]
      : [
          ['maths', 'gk', 'hindi', 'reasoning'],
          ['gk', 'maths', 'reasoning', 'hindi'],
          ['gk', 'maths', 'hindi', 'reasoning'],
          ['maths', 'gk', 'gk', 'hindi'],
          ['reasoning', 'gk', 'maths', 'hindi'],
          ['maths', 'gk', 'reasoning', 'gk'],
          ['maths', 'gk', 'hindi', 'reasoning'],
        ]

  const preferredKey = weeklyPattern[weekDay]?.[slot % weeklyPattern[weekDay].length]
  const preferred = preferredKey ? subjectByKey[preferredKey] : null
  if (preferred) return preferred

  return subjectOrder[(day + slot - 1) % subjectOrder.length] || subjectOrder[0]
}

function pickSubjectForSlot(params: {
  examId: string
  subjectOrder: string[]
  day: number
  slot: number
  mathsLevel: Level
  academicTaskCount: number
}) {
  const { examId, subjectOrder, day, slot, mathsLevel, academicTaskCount } = params

  if (balancedPoliceExams.has(examId)) {
    return pickBalancedPoliceSubject(subjectOrder, day, slot, academicTaskCount)
  }

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

function getSubjectKind(subjectId: string | null) {
  if (!subjectId) return 'general'
  if (['gk_gs', 'gk-gs', 'general-awareness', 'ga'].includes(subjectId)) return 'gk'
  if (['maths', 'quant', 'quantitative-aptitude'].includes(subjectId)) return 'maths'
  if (subjectId === 'hindi') return 'hindi'
  if (subjectId === 'reasoning') return 'reasoning'
  if (subjectId === 'english') return 'english'
  return 'general'
}

function buildTaskCopy(chapter: ChapterRow, taskType: TaskType, phase: string) {
  const chapterName = chapter.name
  const subjectKind = getSubjectKind(chapter.subject_id)
  const normalized = chapterName.toLowerCase()
  const typeLabel = taskType === 'pyq' ? 'PYQ drill' : taskType === 'mock' ? 'mock drill' : taskType

  if (taskType === 'mock') {
    return {
      title: `Attempt ${chapterName} mock drill`,
      description: `Solve a timed mixed set around ${chapterName}, then note accuracy, speed, and the top 3 mistakes.`,
      howToStudy: [
        'Set a timer before starting.',
        'Attempt easy questions first, then return to doubtful ones.',
        'Write mistakes and revise the rule or fact immediately.',
      ],
    }
  }

  if (taskType === 'revision') {
    return {
      title: `Revise ${chapterName}`,
      description: `Revise notes and marked mistakes from ${chapterName}, then solve a short recall drill without hints.`,
      howToStudy: [
        'Read yesterday and weekly error notes first.',
        'Rewrite the most important formulas, facts, or rules.',
        'Solve 15-20 mixed questions and mark weak points.',
      ],
    }
  }

  if (subjectKind === 'maths') {
    const concept = normalized.includes('percentage')
      ? 'Learn fraction-to-percentage conversion and solve 25 beginner questions.'
      : normalized.includes('ratio')
        ? 'Learn the core ratio method and solve 25 direct comparison questions.'
        : normalized.includes('profit') || normalized.includes('loss')
          ? 'Practice cost price, selling price, profit, and loss conversions with 25 questions.'
          : `Learn the main formulas for ${chapterName} and solve 25 level-wise questions.`

    return {
      title: `${taskType === 'practice' || taskType === 'pyq' ? 'Practice' : 'Learn'} ${chapterName}`,
      description: concept,
      howToStudy: [
        'Write formulas and one solved example before practice.',
        'Solve without calculator and keep rough work clean.',
        'Mark every wrong question with the exact reason.',
      ],
    }
  }

  if (subjectKind === 'gk') {
    const isCurrentAffairs = normalized.includes('current')
    return {
      title: `${isCurrentAffairs ? 'Read and note' : 'Study'} ${chapterName}`,
      description: isCurrentAffairs
        ? 'Read national plus Bihar/UP current affairs and write 10 exam-ready facts.'
        : `Study ${chapterName}, make 10 short factual notes, and attempt a quick recall quiz.`,
      howToStudy: [
        'Read from one reliable source before making notes.',
        'Write facts in short bullet form for fast revision.',
        'Quiz yourself after 20 minutes without looking at notes.',
      ],
    }
  }

  if (subjectKind === 'hindi') {
    const wordTask = normalized.includes('\u0935\u093f\u0932\u094b\u092e')
      || normalized.includes('\u092a\u0930\u094d\u092f\u093e\u092f')
      || normalized.includes('synonym')
      || normalized.includes('antonym')
    return {
      title: `${taskType === 'practice' || taskType === 'pyq' ? 'Practice' : 'Learn'} ${chapterName}`,
      description: wordTask
        ? `Learn 20 ${chapterName} words and revise yesterday's 20 words.`
        : `Study rules for ${chapterName}, write 10 examples, and solve a short Hindi drill.`,
      howToStudy: [
        'Read the rule or word list aloud once.',
        'Write examples in your notebook using clear Devanagari.',
        'Revise wrong words again before ending the session.',
      ],
    }
  }

  if (subjectKind === 'reasoning') {
    return {
      title: `Solve ${chapterName}`,
      description: normalized.includes('analogy')
        ? 'Solve 30 analogy questions and mark every wrong pattern for revision.'
        : `Solve 30 ${chapterName} questions, then group mistakes by pattern.`,
      howToStudy: [
        'Do the first 10 questions slowly to identify the pattern.',
        'Solve the next 20 questions with a timer.',
        'Record wrong patterns instead of only checking answers.',
      ],
    }
  }

  if (subjectKind === 'english') {
    return {
      title: `${taskType === 'practice' || taskType === 'pyq' ? 'Practice' : 'Study'} ${chapterName}`,
      description: `Study ${chapterName}, write 10 examples, and solve a short accuracy drill.`,
      howToStudy: [
        'Read the rule and one example first.',
        'Practice questions in a timed set.',
        'Write the correction for every wrong answer.',
      ],
    }
  }

  return {
    title: `${typeLabel[0].toUpperCase()}${typeLabel.slice(1)}: ${chapterName}`,
    description: `${phase} phase task for ${chapterName}: study the core idea, practice questions, and mark weak areas.`,
    howToStudy: [
      'Read core concepts and examples first.',
      'Practice timed questions without checking answers immediately.',
      'Mark weak points for weekly revision.',
    ],
  }
}

function normalizeTemplateSteps(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((step): step is string => typeof step === 'string' && step.trim().length > 0) : []
}

function renderTemplate(template: string | null, params: { chapter: ChapterRow; taskType: TaskType; phase: string }) {
  if (!template) return ''

  return template
    .replaceAll('{chapter}', params.chapter.name)
    .replaceAll('{chapter_name}', params.chapter.name)
    .replaceAll('{subject}', params.chapter.subject_id)
    .replaceAll('{subject_id}', params.chapter.subject_id)
    .replaceAll('{task_type}', params.taskType)
    .replaceAll('{phase}', params.phase)
}

function findTaskTemplate(
  templatesByKey: Map<string, TaskTemplateRow>,
  params: { examId: string; subjectId: string; taskType: TaskType }
) {
  return templatesByKey.get(`${params.examId}:${params.subjectId}:${params.taskType}`)
    || templatesByKey.get(`${params.examId}:*:${params.taskType}`)
    || templatesByKey.get(`*:${params.subjectId}:${params.taskType}`)
    || templatesByKey.get(`*:*:${params.taskType}`)
    || null
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
  template: TaskTemplateRow | null
}): PlannedTask {
  const fallbackCopy = buildTaskCopy(params.chapter, params.taskType, params.phase)
  const templateSteps = normalizeTemplateSteps(params.template?.how_to_study)
  const title = renderTemplate(params.template?.title_template || null, {
    chapter: params.chapter,
    taskType: params.taskType,
    phase: params.phase,
  }) || fallbackCopy.title
  const description = renderTemplate(params.template?.description_template || null, {
    chapter: params.chapter,
    taskType: params.taskType,
    phase: params.phase,
  }) || fallbackCopy.description

  return {
    user_id: params.userId,
    plan_id: params.planId,
    day_number: params.day,
    task_date: params.taskDate,
    exam_id: params.examId,
    subject_id: params.chapter.subject_id,
    chapter_id: params.chapter.id,
    title,
    description,
    task_type: params.taskType,
    estimated_minutes: params.template?.estimated_minutes || params.minutes,
    priority: params.template?.priority || params.chapter.priority,
    how_to_study: templateSteps.length > 0 ? templateSteps : fallbackCopy.howToStudy,
    status: 'pending',
  }
}

function getTaskType(params: {
  day: number
  slot: number
  phase: string
  foundationEnd: number
  isWeeklyRevision: boolean
  isReviewDay: boolean
}) {
  const { day, slot, phase, foundationEnd, isWeeklyRevision, isReviewDay } = params
  const isMockDay = day > foundationEnd && day % 7 === 0

  if (isMockDay && slot === 0) return 'mock'
  if ((isReviewDay || isWeeklyRevision) && slot === (isMockDay ? 1 : 0)) return 'revision'
  if (phase === 'Practice') return slot % 3 === 2 ? 'pyq' : 'practice'
  if (phase === 'Revision') return slot % 2 === 0 ? 'revision' : 'pyq'
  return slot % 2 === 0 ? 'concept' : 'practice'
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

  const alternateExamId = input.examId.includes('-')
    ? input.examId.replaceAll('-', '_')
    : input.examId.replaceAll('_', '-')
  const examIdsForTemplates = [...new Set([input.examId, alternateExamId])]
  const { data: templates, error: templatesError } = await supabase
    .from('task_templates')
    .select('exam_id, subject_id, task_type, title_template, description_template, estimated_minutes, priority, how_to_study')
    .in('exam_id', examIdsForTemplates)

  if (templatesError) throw templatesError

  const templatesByKey = new Map<string, TaskTemplateRow>()
  for (const template of (templates || []) as unknown as TaskTemplateRow[]) {
    const examKey = template.exam_id || '*'
    const subjectKey = template.subject_id || '*'
    templatesByKey.set(`${examKey}:${subjectKey}:${template.task_type}`, template)
    if (template.exam_id && template.exam_id !== input.examId) {
      templatesByKey.set(`${input.examId}:${subjectKey}:${template.task_type}`, template)
    }
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
    const isReviewDay = reviewDays.has(day)
    const physicalTaskMinutes = includesPhysical ? physicalMinutes(input.physicalLevel, day) : 0
    const studyBudget = Math.max(45, totalDailyMinutes - physicalTaskMinutes)
    const academicTaskCount = Math.min(4, Math.max(2, Math.floor(studyBudget / 45)))
    const perTaskMinutes = Math.max(25, Math.floor(studyBudget / academicTaskCount))

    for (let slot = 0; slot < academicTaskCount; slot++) {
      const subjectId = pickSubjectForSlot({
        examId: input.examId,
        subjectOrder,
        day,
        slot,
        mathsLevel: input.mathsLevel,
        academicTaskCount,
      })
      const subjectChapters = chaptersBySubject[subjectId] || selectedChapters
      const cursor = subjectCursor[subjectId] || 0
      const chapter = subjectChapters[cursor % subjectChapters.length]
      subjectCursor[subjectId] = cursor + 1

      const taskType = getTaskType({
        day,
        slot,
        phase,
        foundationEnd,
        isWeeklyRevision,
        isReviewDay,
      }) as TaskType

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
        template: findTaskTemplate(templatesByKey, {
          examId: input.examId,
          subjectId: chapter.subject_id,
          taskType,
        }),
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
