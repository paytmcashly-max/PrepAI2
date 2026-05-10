import type { SupabaseClient } from '@supabase/supabase-js'

type Level = 'weak' | 'average' | 'good'
type Priority = 'low' | 'medium' | 'high'
type TaskType = 'concept' | 'practice' | 'revision' | 'mock' | 'physical' | 'pyq' | 'notes'
type PlanStatus = 'active' | 'generating'

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
  initialStatus?: PlanStatus
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

interface ExamSubjectRule {
  subject_id: string
  weight: number
  is_core: boolean
}

interface PlannerRuleConfig {
  phase_percentages?: Array<{
    id: string
    name: string
    percentage: number
    goal?: string
  }>
  chapter_selection?: Array<{
    max_days: number
    include_priorities: Priority[]
  }>
  level_adjustments?: {
    maths_level?: Partial<Record<Level, {
      extra_practice_multiplier?: number
      concept_time_multiplier?: number
    }>>
    physical_level?: Partial<Record<Level, {
      intensity_multiplier?: number
    }>>
  }
}

interface RevisionRuleRow {
  frequency: string
  rule_config: Record<string, unknown> | null
}

interface MockRuleRow {
  start_after_phase: string | null
  frequency_days: number | null
  mock_type: string | null
  rule_config: Record<string, unknown> | null
}

interface PhysicalRuleRow {
  level: Level
  rule_config: Record<string, unknown> | null
}

interface PhaseBoundary {
  id: string
  name: string
  startDay: number
  endDay: number
}

interface RuleContext {
  planner: PlannerRuleConfig
  examSubjects: ExamSubjectRule[]
  revisionRules: RevisionRuleRow[]
  mockRules: MockRuleRow[]
  physicalRule: PhysicalRuleRow | null
}

const policePhysicalExams = new Set(['bihar_si', 'up_police', 'ssc_gd', 'bihar-si', 'up-police', 'ssc-gd'])
const baseSubjectOrder = ['maths', 'gk_gs', 'gk-gs', 'hindi', 'english', 'reasoning', 'general-awareness', 'computer']
const fallbackPhaseRules = [
  { id: 'foundation', name: 'Foundation', percentage: 25 },
  { id: 'core_syllabus', name: 'Core Syllabus', percentage: 35 },
  { id: 'practice', name: 'Practice', percentage: 25 },
  { id: 'revision', name: 'Revision', percentage: 15 },
]

function addDays(dateValue: string, daysToAdd: number) {
  const date = new Date(`${dateValue}T00:00:00`)
  date.setDate(date.getDate() + daysToAdd)
  return date.toISOString().split('T')[0]
}

function normalizeExamIds(examId: string) {
  const alternateExamId = examId.includes('-')
    ? examId.replaceAll('-', '_')
    : examId.replaceAll('_', '-')
  return [...new Set([examId, alternateExamId])]
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function buildPhaseBoundaries(targetDays: number, planner: PlannerRuleConfig): PhaseBoundary[] {
  const phaseRules = Array.isArray(planner.phase_percentages) && planner.phase_percentages.length > 0
    ? planner.phase_percentages
    : fallbackPhaseRules

  let startDay = 1
  return phaseRules.map((phase, index) => {
    const isLast = index === phaseRules.length - 1
    const days = isLast ? targetDays - startDay + 1 : Math.max(1, Math.round((targetDays * phase.percentage) / 100))
    const endDay = isLast ? targetDays : Math.min(targetDays, startDay + days - 1)
    const boundary = {
      id: phase.id,
      name: phase.name,
      startDay,
      endDay,
    }
    startDay = endDay + 1
    return boundary
  }).filter((phase) => phase.startDay <= phase.endDay)
}

function getPhase(day: number, phases: PhaseBoundary[]) {
  return phases.find((phase) => day >= phase.startDay && day <= phase.endDay) || phases[phases.length - 1]
}

function getPhaseEnd(phases: PhaseBoundary[], phaseId: string | null | undefined) {
  if (!phaseId) return 0
  const normalized = phaseId.replaceAll('-', '_').toLowerCase()
  return phases.find((phase) => phase.id.replaceAll('-', '_').toLowerCase() === normalized)?.endDay || 0
}

function getPhaseReviewDays(targetDays: number, revisionRules: RevisionRuleRow[]) {
  const phaseReviewRule = revisionRules.find((rule) => rule.frequency === 'phase_review')
  const percentages = Array.isArray(phaseReviewRule?.rule_config?.at_percentages)
    ? phaseReviewRule.rule_config.at_percentages.filter((value): value is number => typeof value === 'number')
    : [25, 50, 75, 100]

  return new Set(percentages.map((percentage) => Math.max(1, Math.min(targetDays, Math.ceil((targetDays * percentage) / 100)))))
}

function getWeeklyRevisionFrequency(revisionRules: RevisionRuleRow[]) {
  const weeklyRule = revisionRules.find((rule) => rule.frequency === 'weekly')
  const everyNDays = weeklyRule?.rule_config?.every_n_days
  return typeof everyNDays === 'number' && everyNDays > 0 ? everyNDays : 7
}

function getSpacedRevisionDays(targetDays: number, revisionRules: RevisionRuleRow[]) {
  const spacedRule = revisionRules.find((rule) => rule.frequency === 'spaced_repetition')
  const afterDays = Array.isArray(spacedRule?.rule_config?.after_days)
    ? spacedRule.rule_config.after_days.filter((value): value is number => typeof value === 'number' && value > 1)
    : []

  return new Set(afterDays.filter((day) => day <= targetDays))
}

function filterChaptersByDuration(chapters: ChapterRow[], targetDays: number, planner: PlannerRuleConfig) {
  const matchingRule = planner.chapter_selection
    ?.filter((rule) => Number.isFinite(rule.max_days) && Array.isArray(rule.include_priorities))
    .sort((a, b) => a.max_days - b.max_days)
    .find((rule) => targetDays <= rule.max_days)

  if (matchingRule) {
    return chapters.filter((chapter) => matchingRule.include_priorities.includes(chapter.priority))
  }

  if (targetDays <= 45) return chapters.filter((chapter) => chapter.priority === 'high')
  if (targetDays <= 90) return chapters.filter((chapter) => chapter.priority !== 'low')
  return chapters
}

function distributeSubjects(chapters: ChapterRow[], examSubjects: ExamSubjectRule[]) {
  const subjects = [...new Set(chapters.map((chapter) => chapter.subject_id))]
  const seededOrder = examSubjects
    .filter((rule) => subjects.includes(rule.subject_id) && rule.subject_id !== 'physical')
    .sort((a, b) => b.weight - a.weight)
    .map((rule) => rule.subject_id)
  const ordered = seededOrder.length > 0
    ? seededOrder
    : baseSubjectOrder.filter((subject) => subjects.includes(subject))
  return ordered.length > 0 ? ordered : subjects
}

function buildSubjectWeights(subjectOrder: string[], examSubjects: ExamSubjectRule[], mathsLevel: Level, planner: PlannerRuleConfig) {
  const fallbackWeight = 10
  const mathsBoost = planner.level_adjustments?.maths_level?.[mathsLevel]?.extra_practice_multiplier || 1
  const weightBySubject = new Map(examSubjects.map((rule) => [rule.subject_id, Math.max(0, rule.weight)]))

  return subjectOrder.reduce((acc, subjectId) => {
    const baseWeight = weightBySubject.get(subjectId) || fallbackWeight
    acc[subjectId] = subjectId === 'maths' ? Math.max(1, Math.round(baseWeight * mathsBoost)) : Math.max(1, baseWeight)
    return acc
  }, {} as Record<string, number>)
}

function pickSubjectForSlot(params: {
  subjectOrder: string[]
  subjectWeights: Record<string, number>
  subjectUsage: Record<string, number>
  totalAcademicSlotsPicked: number
  daySubjects: Set<string>
}) {
  const { subjectOrder, subjectWeights, subjectUsage, totalAcademicSlotsPicked, daySubjects } = params
  const totalWeight = Object.values(subjectWeights).reduce((sum, weight) => sum + weight, 0) || subjectOrder.length
  const candidates = subjectOrder.filter((subject) => !daySubjects.has(subject))
  const pool = candidates.length > 0 ? candidates : subjectOrder

  return pool
    .map((subject) => {
      const expected = ((totalAcademicSlotsPicked + 1) * (subjectWeights[subject] || 1)) / totalWeight
      const actual = subjectUsage[subject] || 0
      return { subject, deficit: expected - actual, weight: subjectWeights[subject] || 1 }
    })
    .sort((a, b) => b.deficit - a.deficit || b.weight - a.weight || subjectOrder.indexOf(a.subject) - subjectOrder.indexOf(b.subject))[0]?.subject
    || subjectOrder[totalAcademicSlotsPicked % subjectOrder.length]
}

function physicalMinutes(level: Level, day: number, planner: PlannerRuleConfig) {
  const base = level === 'weak' ? 20 : level === 'average' ? 30 : 40
  const weeklyIncrement = level === 'weak' ? 5 : level === 'average' ? 7 : 10
  const multiplier = planner.level_adjustments?.physical_level?.[level]?.intensity_multiplier || 1
  return Math.min(Math.round((base + Math.floor((day - 1) / 7) * weeklyIncrement) * multiplier), 75)
}

function buildPhysicalCopy(phase: string, level: Level, day: number, physicalRule: PhysicalRuleRow | null) {
  const week = Math.min(3, Math.max(1, Math.ceil(day / 7)))
  const config = asObject(physicalRule?.rule_config)
  const weekPlan = typeof config[`week_${week}`] === 'string' ? config[`week_${week}`] as string : null
  const progression = typeof config.progression === 'string' ? config.progression : 'Progress gradually and avoid overtraining.'
  const strength = asStringArray(config.strength)

  return {
    title: `${phase} physical training`,
    description: weekPlan || 'Running, mobility, strength basics, and recovery according to your current level.',
    howToStudy: [
      'Warm up before running or drills.',
      progression,
      strength.length > 0 ? `Strength: ${strength.join(', ')}.` : 'Stretch and hydrate after training.',
      level === 'weak' ? 'Keep the pace easy and stop before pain.' : 'Track time, distance, and recovery honestly.',
    ],
  }
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
  phase: PhaseBoundary
  isWeeklyRevision: boolean
  isReviewDay: boolean
  isSpacedRevisionDay: boolean
  mockRules: MockRuleRow[]
  phases: PhaseBoundary[]
}) {
  const { day, slot, phase, isWeeklyRevision, isReviewDay, isSpacedRevisionDay, mockRules, phases } = params
  const isMockDay = mockRules.some((rule) => {
    const frequency = rule.frequency_days || 0
    if (frequency <= 0) return false
    const startAfterDay = getPhaseEnd(phases, rule.start_after_phase || 'foundation')
    return day > startAfterDay && (day - startAfterDay) % frequency === 0
  })

  if (isMockDay && slot === 0) return 'mock'
  if ((isReviewDay || isWeeklyRevision || isSpacedRevisionDay) && slot === (isMockDay ? 1 : 0)) return 'revision'
  if (phase.id === 'practice') return slot % 3 === 2 ? 'pyq' : 'practice'
  if (phase.id === 'revision') return slot % 2 === 0 ? 'revision' : 'pyq'
  return slot % 2 === 0 ? 'concept' : 'practice'
}

async function loadRuleContext(supabase: SupabaseClient, examId: string, physicalLevel: Level): Promise<RuleContext> {
  const examIds = normalizeExamIds(examId)
  const [
    plannerResult,
    examSubjectsResult,
    revisionRulesResult,
    mockRulesResult,
    physicalRulesResult,
  ] = await Promise.all([
    supabase.from('planner_rules').select('rule_config').eq('id', 'default').maybeSingle(),
    supabase.from('exam_subjects').select('subject_id, weight, is_core').in('exam_id', examIds),
    supabase.from('revision_rules').select('frequency, rule_config').in('exam_id', examIds),
    supabase.from('mock_rules').select('start_after_phase, frequency_days, mock_type, rule_config').in('exam_id', examIds),
    supabase.from('physical_rules').select('level, rule_config').in('exam_id', examIds).eq('level', physicalLevel).limit(1),
  ])

  if (plannerResult.error && plannerResult.error.code !== 'PGRST116') throw plannerResult.error
  if (examSubjectsResult.error) throw examSubjectsResult.error
  if (revisionRulesResult.error) throw revisionRulesResult.error
  if (mockRulesResult.error) throw mockRulesResult.error
  if (physicalRulesResult.error) throw physicalRulesResult.error

  return {
    planner: asObject(plannerResult.data?.rule_config) as PlannerRuleConfig,
    examSubjects: (examSubjectsResult.data || []) as ExamSubjectRule[],
    revisionRules: (revisionRulesResult.data || []).map((rule) => ({
      frequency: rule.frequency,
      rule_config: asObject(rule.rule_config),
    })),
    mockRules: (mockRulesResult.data || []).map((rule) => ({
      start_after_phase: rule.start_after_phase,
      frequency_days: rule.frequency_days,
      mock_type: rule.mock_type,
      rule_config: asObject(rule.rule_config),
    })),
    physicalRule: ((physicalRulesResult.data || [])[0] as PhysicalRuleRow | undefined) || null,
  }
}

export async function generateStudyPlan(
  supabase: SupabaseClient,
  input: GenerateStudyPlanInput
) {
  const targetDays = Math.max(7, input.targetDays)
  const dailyStudyHours = Math.max(1, input.dailyStudyHours)
  const initialStatus = input.initialStatus || 'active'
  const ruleContext = await loadRuleContext(supabase, input.examId, input.physicalLevel)

  const { data: chapters, error: chaptersError } = await supabase
    .from('chapters')
    .select('id, exam_id, subject_id, name, priority, difficulty, estimated_minutes, order_index')
    .eq('exam_id', input.examId)
    .order('priority', { ascending: true })
    .order('order_index', { ascending: true })

  if (chaptersError) throw chaptersError

  const selectedChapters = filterChaptersByDuration((chapters || []) as ChapterRow[], targetDays, ruleContext.planner)
    .sort((a, b) => {
      const priorityRank: Record<Priority, number> = { high: 0, medium: 1, low: 2 }
      return priorityRank[a.priority] - priorityRank[b.priority] || a.order_index - b.order_index
    })

  if (selectedChapters.length === 0) {
    throw new Error('No master chapters are available for the selected exam.')
  }

  const examIdsForTemplates = normalizeExamIds(input.examId)
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

  const { data: plan, error: planError } = await supabase
    .from('user_study_plans')
    .insert({
      user_id: input.userId,
      exam_id: input.examId,
      target_days: targetDays,
      daily_study_hours: dailyStudyHours,
      start_date: input.startDate,
      status: initialStatus,
    })
    .select('id')
    .single()

  if (planError) throw planError
  if (!plan?.id) throw new Error('Could not create study plan.')

  const subjectOrder = distributeSubjects(selectedChapters, ruleContext.examSubjects)
  const subjectWeights = buildSubjectWeights(subjectOrder, ruleContext.examSubjects, input.mathsLevel, ruleContext.planner)
  const chaptersBySubject = selectedChapters.reduce((acc, chapter) => {
    acc[chapter.subject_id] = acc[chapter.subject_id] || []
    acc[chapter.subject_id].push(chapter)
    return acc
  }, {} as Record<string, ChapterRow[]>)
  const subjectCursor = Object.fromEntries(subjectOrder.map((subject) => [subject, 0])) as Record<string, number>
  const subjectUsage = Object.fromEntries(subjectOrder.map((subject) => [subject, 0])) as Record<string, number>
  let totalAcademicSlotsPicked = 0
  const totalDailyMinutes = dailyStudyHours * 60
  const includesPhysical = ruleContext.examSubjects.some((rule) => rule.subject_id === 'physical' && rule.weight > 0)
    || Boolean(ruleContext.physicalRule)
    || policePhysicalExams.has(input.examId)
  const phases = buildPhaseBoundaries(targetDays, ruleContext.planner)
  const weeklyRevisionFrequency = getWeeklyRevisionFrequency(ruleContext.revisionRules)
  const reviewDays = getPhaseReviewDays(targetDays, ruleContext.revisionRules)
  const spacedRevisionDays = getSpacedRevisionDays(targetDays, ruleContext.revisionRules)
  const tasks: PlannedTask[] = []

  for (let day = 1; day <= targetDays; day++) {
    const taskDate = addDays(input.startDate, day - 1)
    const phase = getPhase(day, phases)
    const isWeeklyRevision = day % weeklyRevisionFrequency === 0
    const isReviewDay = reviewDays.has(day)
    const isSpacedRevisionDay = spacedRevisionDays.has(day)
    const physicalTaskMinutes = includesPhysical ? physicalMinutes(input.physicalLevel, day, ruleContext.planner) : 0
    const studyBudget = Math.max(45, totalDailyMinutes - physicalTaskMinutes)
    const academicTaskCount = Math.min(4, Math.max(2, Math.floor(studyBudget / 45)))
    const perTaskMinutes = Math.max(25, Math.floor(studyBudget / academicTaskCount))
    const daySubjects = new Set<string>()

    for (let slot = 0; slot < academicTaskCount; slot++) {
      const subjectId = pickSubjectForSlot({
        subjectOrder,
        subjectWeights,
        subjectUsage,
        totalAcademicSlotsPicked,
        daySubjects,
      })
      const subjectChapters = chaptersBySubject[subjectId] || selectedChapters
      const cursor = subjectCursor[subjectId] || 0
      const chapter = subjectChapters[cursor % subjectChapters.length]
      subjectCursor[subjectId] = cursor + 1
      subjectUsage[subjectId] = (subjectUsage[subjectId] || 0) + 1
      totalAcademicSlotsPicked += 1
      daySubjects.add(subjectId)

      const taskType = getTaskType({
        day,
        slot,
        phase,
        isWeeklyRevision,
        isReviewDay,
        isSpacedRevisionDay,
        mockRules: ruleContext.mockRules,
        phases,
      }) as TaskType

      tasks.push(buildStudyTask({
        userId: input.userId,
        planId: plan.id,
        day,
        taskDate,
        examId: input.examId,
        chapter,
        phase: phase.name,
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
      const physicalCopy = buildPhysicalCopy(phase.name, input.physicalLevel, day, ruleContext.physicalRule)
      tasks.push({
        user_id: input.userId,
        plan_id: plan.id,
        day_number: day,
        task_date: taskDate,
        exam_id: input.examId,
        subject_id: 'physical',
        chapter_id: null,
        title: physicalCopy.title,
        description: physicalCopy.description,
        task_type: 'physical',
        estimated_minutes: physicalTaskMinutes,
        priority: 'high',
        how_to_study: physicalCopy.howToStudy,
        status: 'pending',
      })
    }
  }

  const chunkSize = 500
  try {
    for (let index = 0; index < tasks.length; index += chunkSize) {
      const chunk = tasks.slice(index, index + chunkSize)
      const { error } = await supabase.from('user_daily_tasks').insert(chunk)
      if (error) throw error
    }
  } catch (error) {
    await supabase
      .from('user_study_plans')
      .delete()
      .eq('id', plan.id)
      .eq('user_id', input.userId)

    throw error
  }

  return { planId: plan.id as string, taskCount: tasks.length }
}
