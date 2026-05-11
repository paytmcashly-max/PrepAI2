// Server-side queries for PrepTrack
import { createClient } from '@/lib/supabase/server'
import { toLocalDateString } from '@/lib/date-utils'
import type {
  Exam,
  Subject,
  Chapter,
  RoadmapPhase,
  Profile,
  MockTest,
  MockTestAttempt,
  Note,
  PYQQuestion,
  MotivationalQuote,
  DashboardStats,
  SubjectProgress,
  DayTaskGroup,
  UserDailyTask,
  UserStudyPlan,
  PlanSettingsData,
  RoadmapSubject,
  ActivePlanSubjectDetail,
  SubjectChapterProgress,
  WeakArea,
  RevisionQueueData,
  RevisionWeakChapter,
  BacklogData,
  BacklogTaskGroup,
  AdminDebugSnapshot,
} from '@/lib/types'

function getCalendarDay(startDate: string) {
  const start = new Date(`${startDate}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function toDateString(date: Date) {
  return toLocalDateString(date)
}

function isMissingSingleRow(error: { code?: string } | null) {
  return error?.code === 'PGRST205' || error?.code === 'PGRST116'
}

function buildDayTaskGroup(plan: UserStudyPlan, dayNumber: number, tasks: UserDailyTask[]): DayTaskGroup {
  return {
    id: `${plan.id}-${dayNumber}`,
    day: dayNumber,
    date: tasks[0]?.task_date || plan.start_date,
    phaseId: null,
    phaseName: null,
    isRevisionDay: tasks.some((task) => task.task_type === 'revision'),
    tasks,
    completedCount: tasks.filter((task) => task.status === 'completed').length,
    totalCount: tasks.length,
  }
}

function dedupeTasks(tasks: UserDailyTask[]) {
  const tasksById = new Map<string, UserDailyTask>()
  for (const task of tasks) {
    tasksById.set(task.id, task)
  }
  return [...tasksById.values()]
}

export async function getActiveStudyPlan(userId: string): Promise<UserStudyPlan | null> {
  const supabase = await createClient()
  const { data: plan, error } = await supabase
    .from('user_study_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (isMissingSingleRow(error) || !plan) return null
  if (error) throw error
  return plan
}

// ============ SUBJECTS ============
export async function getSubjects(): Promise<Subject[]> {
  const supabase = await createClient()
  const { data: linkedSubjects, error: linkedSubjectsError } = await supabase
    .from('exam_subjects')
    .select('subject:subjects(*)')

  if (!linkedSubjectsError && linkedSubjects && linkedSubjects.length > 0) {
    const subjectsById = new Map<string, Subject>()
    for (const row of linkedSubjects) {
      const subject = Array.isArray(row.subject) ? row.subject[0] : row.subject
      if (subject?.id && !subjectsById.has(subject.id)) {
        subjectsById.set(subject.id, subject as Subject)
      }
    }

    return [...subjectsById.values()].sort((a, b) => (
      (a.order_index || 0) - (b.order_index || 0) || a.name.localeCompare(b.name)
    ))
  }

  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .order('order_index')
    .order('name')

  if (error) throw error
  return data || []
}

export async function getSubjectWithChapters(subjectId: string, examId: string): Promise<Subject & { chapters: Chapter[] }> {
  if (!examId) throw new Error('examId is required when fetching subject chapters.')

  const supabase = await createClient()
  const { data: subject, error: subjectError } = await supabase
    .from('subjects')
    .select('*')
    .eq('id', subjectId)
    .single()

  if (subjectError) throw subjectError

  const chapters = await getChaptersBySubject(subjectId, examId)
  return { ...(subject as Subject), chapters }
}

export async function getChaptersBySubject(subjectId: string, examId: string): Promise<Chapter[]> {
  if (!examId) throw new Error('examId is required when fetching subject chapters.')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('exam_id', examId)
    .eq('subject_id', subjectId)
    .order('order_index')

  if (error) throw error
  return data || []
}

// ============ ROADMAP & PHASES ============
export async function getUserRoadmapData(): Promise<{
  plan: UserStudyPlan | null
  phases: RoadmapPhase[]
  subjects: RoadmapSubject[]
  currentDay: number
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { plan: null, phases: [], subjects: [], currentDay: 0 }

  const plan = await getActiveStudyPlan(user.id)
  if (!plan) {
    return { plan: null, phases: [], subjects: [], currentDay: 0 }
  }

  const { data: tasks, error: tasksError } = await supabase
    .from('user_daily_tasks')
    .select('subject_id, estimated_minutes, subject:subjects(*)')
    .eq('user_id', user.id)
    .eq('plan_id', plan.id)
    .not('subject_id', 'is', null)

  if (tasksError) throw tasksError

  const subjectsById = new Map<string, RoadmapSubject>()
  for (const row of tasks || []) {
    const subject = Array.isArray(row.subject) ? row.subject[0] : row.subject
    if (!subject?.id) continue

    const existing = subjectsById.get(subject.id)
    if (existing) {
      const totalMinutes = existing.averageMinutes * existing.totalTasks + (row.estimated_minutes || 0)
      const totalTasks = existing.totalTasks + 1
      subjectsById.set(subject.id, {
        ...existing,
        totalTasks,
        averageMinutes: Math.round(totalMinutes / totalTasks),
      })
    } else {
      subjectsById.set(subject.id, {
        ...(subject as Subject),
        totalTasks: 1,
        averageMinutes: row.estimated_minutes || 0,
      })
    }
  }

  return {
    plan,
    phases: buildRoadmapPhases(plan.target_days),
    subjects: [...subjectsById.values()].sort((a, b) => a.order_index - b.order_index),
    currentDay: clamp(getCalendarDay(plan.start_date), 1, plan.target_days),
  }
}

function buildRoadmapPhases(targetDays: number): RoadmapPhase[] {
  const foundationEnd = Math.max(1, Math.round(targetDays * 0.25))
  const coreEnd = Math.max(foundationEnd + 1, Math.round(targetDays * 0.60))
  const practiceEnd = Math.max(coreEnd + 1, Math.round(targetDays * 0.85))

  return [
    {
      id: 'foundation',
      name: 'Foundation',
      start_day: 1,
      end_day: foundationEnd,
      goal: 'Basics, habit building, and beginner-level tasks.',
      created_at: '',
    },
    {
      id: 'core-syllabus',
      name: 'Core Syllabus',
      start_day: foundationEnd + 1,
      end_day: coreEnd,
      goal: 'Main chapters, regular practice, and concept consolidation.',
      created_at: '',
    },
    {
      id: 'practice',
      name: 'Practice',
      start_day: coreEnd + 1,
      end_day: practiceEnd,
      goal: 'PYQ-style drills, mixed practice, and mock-test rhythm.',
      created_at: '',
    },
    {
      id: 'revision',
      name: 'Revision',
      start_day: practiceEnd + 1,
      end_day: targetDays,
      goal: 'Revision, weak topics, and full mock-test analysis.',
      created_at: '',
    },
  ].filter((phase) => phase.start_day <= phase.end_day)
}

export async function getAllTasksWithPlans(): Promise<DayTaskGroup[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const plan = await getActiveStudyPlan(user.id)
  if (!plan) return []

  const { data: tasks, error: tasksError } = await supabase
    .from('user_daily_tasks')
    .select('*, subject:subjects(*), chapter:chapters(*)')
    .eq('user_id', user.id)
    .eq('plan_id', plan.id)
    .order('day_number')
    .order('created_at')

  if (tasksError?.code === 'PGRST205') return []
  if (tasksError) throw tasksError

  const grouped = ((tasks || []) as UserDailyTask[]).reduce((acc, task) => {
    acc[task.day_number] = acc[task.day_number] || []
    acc[task.day_number].push(task)
    return acc
  }, {} as Record<number, UserDailyTask[]>)

  return Object.entries(grouped).map(([day, dayTasks]) => buildDayTaskGroup(plan, Number(day), dayTasks))
}

export async function getTodayTaskGroup(userId: string): Promise<DayTaskGroup | null> {
  const supabase = await createClient()
  const plan = await getActiveStudyPlan(userId)
  if (!plan) return null

  const currentDay = clamp(getCalendarDay(plan.start_date), 1, plan.target_days)
  const today = toDateString(new Date())
  const { data: tasks, error } = await supabase
    .from('user_daily_tasks')
    .select('*, subject:subjects(*), chapter:chapters(*)')
    .eq('user_id', userId)
    .eq('plan_id', plan.id)
    .or(`day_number.eq.${currentDay},task_date.eq.${today}`)
    .order('task_date')
    .order('created_at')

  if (error) throw error

  const todayTasks = dedupeTasks((tasks || []) as UserDailyTask[])
  return {
    ...buildDayTaskGroup(plan, currentDay, todayTasks),
    id: `${plan.id}-today`,
    date: today,
  }
}

export async function getBacklogData(userId: string): Promise<BacklogData> {
  const supabase = await createClient()
  const plan = await getActiveStudyPlan(userId)

  if (!plan) {
    return {
      plan: null,
      overdueTasks: [],
      groups: [],
      totalCount: 0,
    }
  }

  const today = toDateString(new Date())
  const { data, error } = await supabase
    .from('user_daily_tasks')
    .select('*, subject:subjects(*), chapter:chapters(*)')
    .eq('user_id', userId)
    .eq('plan_id', plan.id)
    .eq('status', 'pending')
    .lt('task_date', today)
    .order('task_date', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error

  const overdueTasks = (data || []) as UserDailyTask[]
  const groupsByKey = new Map<string, BacklogTaskGroup>()

  for (const task of overdueTasks) {
    const subjectName = task.subject?.name || task.subject_id || 'General'
    const key = `${task.subject_id || 'general'}:${task.task_date}`
    const existing = groupsByKey.get(key)

    if (existing) {
      existing.tasks.push(task)
      existing.totalCount += 1
      existing.totalMinutes += task.estimated_minutes || 0
    } else {
      groupsByKey.set(key, {
        id: key,
        subject_id: task.subject_id,
        subject_name: subjectName,
        date: task.task_date,
        tasks: [task],
        totalCount: 1,
        totalMinutes: task.estimated_minutes || 0,
      })
    }
  }

  const groups = [...groupsByKey.values()].sort((a, b) => (
    a.date.localeCompare(b.date) || a.subject_name.localeCompare(b.subject_name)
  ))

  return {
    plan,
    overdueTasks,
    groups,
    totalCount: overdueTasks.length,
  }
}

export async function getOverdueTaskCount(userId: string): Promise<number> {
  const supabase = await createClient()
  const plan = await getActiveStudyPlan(userId)
  if (!plan) return 0

  const today = toDateString(new Date())
  const { count, error } = await supabase
    .from('user_daily_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('plan_id', plan.id)
    .eq('status', 'pending')
    .lt('task_date', today)

  if (error) throw error
  return count || 0
}

// ============ PROFILE ============
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

// ============ MOCK TESTS ============
export async function getMockTests(): Promise<MockTest[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mock_tests')
    .select('*')
    .is('user_id', null)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// ============ EXAMS ============
export async function getMasterExams(): Promise<Exam[]> {
  const supabase = await createClient()
  const { data: linkedExams, error: linkedExamsError } = await supabase
    .from('exam_subjects')
    .select('exam:exams(*)')

  if (!linkedExamsError && linkedExams && linkedExams.length > 0) {
    const examsById = new Map<string, Exam>()
    for (const row of linkedExams) {
      const exam = Array.isArray(row.exam) ? row.exam[0] : row.exam
      if (exam?.id && !examsById.has(exam.id)) {
        examsById.set(exam.id, exam as Exam)
      }
    }

    return [...examsById.values()].sort((a, b) => a.name.localeCompare(b.name))
  }

  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .order('name')

  if (error) throw error
  return data || []
}

export async function getUserMockResults(userId: string): Promise<MockTest[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mock_tests')
    .select('*')
    .eq('user_id', userId)
    .order('test_date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getMockTestWithQuestions(testId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mock_tests')
    .select('*, questions:mock_test_questions(*, subject:subjects(*))')
    .eq('id', testId)
    .single()

  if (error) throw error
  return data
}

export async function getUserMockTestAttempts(userId: string): Promise<MockTestAttempt[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mock_test_attempts')
    .select('*')
    .eq('user_id', userId)
    .order('test_date', { ascending: false })

  if (error) throw error
  return data || []
}

// ============ NOTES ============
export async function getUserNotes(userId: string): Promise<Note[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notes')
    .select('*, subject:subjects(*), chapter_ref:chapters(*)')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getNoteById(noteId: string): Promise<Note | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notes')
    .select('*, subject:subjects(*)')
    .eq('id', noteId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

// ============ PYQ QUESTIONS ============
export async function getPYQQuestions(filters?: {
  examId?: string
  year?: number
  subjectId?: string
  chapterId?: string
  difficulty?: string
  verifiedOnly?: boolean
}): Promise<PYQQuestion[]> {
  const supabase = await createClient()
  let query = supabase
    .from('pyq_questions')
    .select('*, subject:subjects(*), exam:exams(*), chapter_ref:chapters(*)')
    .order('year', { ascending: false })

  if (filters?.examId) query = query.eq('exam_id', filters.examId)
  if (filters?.year) query = query.eq('year', filters.year)
  if (filters?.subjectId) query = query.eq('subject_id', filters.subjectId)
  if (filters?.chapterId) query = query.eq('chapter_id', filters.chapterId)
  if (filters?.difficulty) query = query.eq('difficulty', filters.difficulty)
  if (filters?.verifiedOnly) query = query.eq('source', 'verified_pyq').eq('is_verified', true)

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function getPYQQuestionById(questionId: string): Promise<PYQQuestion | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pyq_questions')
    .select('*, subject:subjects(*), exam:exams(*), chapter_ref:chapters(*)')
    .eq('id', questionId)
    .maybeSingle()

  if (error) throw error
  return data || null
}

export async function getPYQReviewRows(): Promise<PYQQuestion[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pyq_questions')
    .select('*, subject:subjects(*), exam:exams(*), chapter_ref:chapters(*)')
    .eq('source', 'trusted_third_party')
    .in('verification_status', ['in_review', 'third_party_reviewed'])
    .eq('is_verified', false)
    .order('verification_status')
    .order('year', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getPYQYears(): Promise<number[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pyq_questions')
    .select('year')
    .order('year', { ascending: false })

  if (error) throw error
  
  const years = [...new Set((data || []).map(d => d.year))]
  return years
}

// ============ MOTIVATIONAL QUOTES ============
export async function getRandomQuote(): Promise<MotivationalQuote | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('quote_bank')
    .select('id, text, category, author, created_at')

  if (error) throw error
  if (!data || data.length === 0) return null

  const quote = data[Math.floor(Math.random() * data.length)]
  return {
    id: quote.id,
    quote: quote.text,
    category: quote.category,
    author: quote.author,
    created_at: quote.created_at,
  }
}

export async function getPYQFilterData(): Promise<{
  exams: Exam[]
  subjects: Subject[]
  chapters: Chapter[]
  years: number[]
}> {
  const supabase = await createClient()
  const [exams, subjects, yearsResult, chaptersResult] = await Promise.all([
    getMasterExams(),
    getSubjects(),
    getPYQYears(),
    supabase
      .from('chapters')
      .select('*')
      .order('exam_id')
      .order('subject_id')
      .order('order_index'),
  ])

  if (chaptersResult.error) throw chaptersResult.error

  return {
    exams,
    subjects,
    chapters: (chaptersResult.data || []) as Chapter[],
    years: yearsResult,
  }
}

// ============ DASHBOARD STATS ============
export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const supabase = await createClient()

  const profile = await getProfile(userId)
  const plan = await getActiveStudyPlan(userId)

  if (!plan) {
    return {
      activePlanId: null,
      currentStreak: 0,
      tasksCompletedThisMonth: 0,
      topicsCovered: 0,
      totalTopics: 0,
      avgMockScore: 0,
      currentDay: 0,
      totalDays: profile?.target_days || 0,
      todayTaskCount: 0,
      todayCompletedCount: 0,
      overallTaskCount: 0,
      overallCompletedCount: 0,
      planState: 'missing',
    }
  }

  const rawCurrentDay = getCalendarDay(plan.start_date)
  const currentDay = clamp(rawCurrentDay, 1, plan.target_days)
  const planState = rawCurrentDay < 1 ? 'starts-soon' : rawCurrentDay > plan.target_days ? 'completed' : 'active'

  const { data: completedTasks } = await supabase
    .from('user_daily_tasks')
    .select('task_date, completed_at, chapter_id')
    .eq('user_id', userId)
    .eq('plan_id', plan.id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })

  let currentStreak = 0
  if (completedTasks && completedTasks.length > 0) {
    const completedDates = new Set(
      completedTasks.map(task => task.task_date).filter(Boolean)
    )
    
    const checkDate = new Date()
    while (completedDates.has(toDateString(checkDate))) {
      currentStreak++
      checkDate.setDate(checkDate.getDate() - 1)
    }
  }

  const today = new Date()
  const monthStart = toDateString(new Date(today.getFullYear(), today.getMonth(), 1))
  const { count: tasksThisMonth } = await supabase
    .from('user_daily_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('plan_id', plan.id)
    .eq('status', 'completed')
    .gte('task_date', monthStart)

  const { count: totalTopics } = await supabase
    .from('chapters')
    .select('*', { count: 'exact', head: true })
    .eq('exam_id', plan.exam_id)

  const topicsCovered = new Set((completedTasks || []).map(task => task.chapter_id).filter(Boolean)).size

  const todayString = toDateString(new Date())
  const { data: todayTaskRows } = await supabase
    .from('user_daily_tasks')
    .select('id, status')
    .eq('user_id', userId)
    .eq('plan_id', plan.id)
    .or(`day_number.eq.${currentDay},task_date.eq.${todayString}`)

  const todayTasks = [...new Map((todayTaskRows || []).map((task) => [task.id, task])).values()]

  const { count: overallTaskCount } = await supabase
    .from('user_daily_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('plan_id', plan.id)

  const { count: overallCompletedCount } = await supabase
    .from('user_daily_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('plan_id', plan.id)
    .eq('status', 'completed')

  const { data: attempts } = await supabase
    .from('mock_tests')
    .select('marks_obtained, total_marks')
    .eq('user_id', userId)

  let avgMockScore = 0
  if (attempts && attempts.length > 0) {
    const scores = attempts
      .filter(a => a.marks_obtained !== null && a.total_marks !== null && a.total_marks > 0)
      .map(a => (a.marks_obtained! / a.total_marks!) * 100)
    avgMockScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
  }

  return {
    activePlanId: plan.id,
    currentStreak,
    tasksCompletedThisMonth: tasksThisMonth || 0,
    topicsCovered,
    totalTopics: totalTopics || 0,
    avgMockScore: Math.round(avgMockScore * 10) / 10,
    currentDay,
    totalDays: plan.target_days,
    todayTaskCount: todayTasks.length,
    todayCompletedCount: todayTasks.filter(task => task.status === 'completed').length,
    overallTaskCount: overallTaskCount || 0,
    overallCompletedCount: overallCompletedCount || 0,
    planState,
  }
}

export async function getSubjectProgress(userId: string): Promise<SubjectProgress[]> {
  const supabase = await createClient()

  const plan = await getActiveStudyPlan(userId)
  if (!plan) return []

  const { data: tasks, error } = await supabase
    .from('user_daily_tasks')
    .select('subject_id, status, chapter:chapters(name), subject:subjects(id, name, icon, color)')
    .eq('user_id', userId)
    .eq('plan_id', plan.id)
    .not('subject_id', 'is', null)

  if (error) throw error

  const normalizedTasks = ((tasks || []) as unknown as Array<{
    subject_id: string
    status: string
    chapter: { name: string } | Array<{ name: string }> | null
    subject: { id: string; name: string; icon: string | null; color: string | null } | Array<{ id: string; name: string; icon: string | null; color: string | null }> | null
  }>).map((task) => ({
    subject_id: task.subject_id,
    status: task.status,
    chapter: Array.isArray(task.chapter) ? task.chapter[0] || null : task.chapter,
    subject: Array.isArray(task.subject) ? task.subject[0] || null : task.subject,
  })).filter((task) => task.subject?.id)

  const bySubject = normalizedTasks.reduce((acc, task) => {
    acc[task.subject_id] = acc[task.subject_id] || {
      id: task.subject_id,
      name: task.subject?.name || task.subject_id,
      icon: task.subject?.icon || null,
      color: task.subject?.color || '#3B82F6',
      tasks: [],
    }
    acc[task.subject_id].tasks.push(task)
    return acc
  }, {} as Record<string, {
    id: string
    name: string
    color: string
    icon: string | null
    tasks: Array<{ status: string; chapter: { name: string } | null }>
  }>)

  return Object.values(bySubject).map(subject => {
    const subjectTasks = subject.tasks
    const completedCount = subjectTasks.filter(task => task.status === 'completed').length
    const totalCount = subjectTasks.length
    const activeTask = subjectTasks.find(task => task.status !== 'completed')
    const weakChapters = [...new Set(
      subjectTasks
        .filter(task => task.status !== 'completed' && task.chapter?.name)
        .map(task => task.chapter?.name)
        .filter(Boolean) as string[]
    )].slice(0, 3)

    return {
      id: subject.id,
      name: subject.name,
      icon: subject.icon,
      color: subject.color,
      completedTasks: completedCount,
      totalTasks: totalCount,
      percentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      currentChapter: activeTask?.chapter?.name || null,
      weakChapters,
    }
  }).filter((subject) => subject.totalTasks > 0)
}

export async function getWeakAreas(userId: string): Promise<WeakArea[]> {
  const supabase = await createClient()
  const plan = await getActiveStudyPlan(userId)
  if (!plan) return []

  const today = toDateString(new Date())
  const currentDay = getCalendarDay(plan.start_date)
  const { data: tasks, error: tasksError } = await supabase
    .from('user_daily_tasks')
    .select('subject_id, chapter_id, status, task_date, subject:subjects(id, name), chapter:chapters(id, name)')
    .eq('user_id', userId)
    .eq('plan_id', plan.id)
    .not('subject_id', 'is', null)

  if (tasksError) throw tasksError

  const normalizedTasks = ((tasks || []) as unknown as Array<{
    subject_id: string | null
    chapter_id: string | null
    status: string
    task_date: string
    subject: { id: string; name: string } | Array<{ id: string; name: string }> | null
    chapter: { id: string; name: string } | Array<{ id: string; name: string }> | null
  }>).map((task) => ({
    ...task,
    subject: Array.isArray(task.subject) ? task.subject[0] || null : task.subject,
    chapter: Array.isArray(task.chapter) ? task.chapter[0] || null : task.chapter,
  }))

  const weakAreas = new Map<string, WeakArea & { score: number }>()
  const upsertWeakArea = (area: WeakArea, score: number) => {
    const key = `${area.subject_id || 'general'}:${area.chapter_id || area.chapter_name || area.reason}`
    const existing = weakAreas.get(key)
    if (!existing || score > existing.score) {
      weakAreas.set(key, { ...area, score })
    }
  }

  const bySubject = new Map<string, typeof normalizedTasks>()
  const byChapter = new Map<string, typeof normalizedTasks>()
  for (const task of normalizedTasks) {
    if (task.subject_id) {
      bySubject.set(task.subject_id, [...(bySubject.get(task.subject_id) || []), task])
    }
    if (task.chapter_id) {
      byChapter.set(task.chapter_id, [...(byChapter.get(task.chapter_id) || []), task])
    }
  }

  for (const task of normalizedTasks) {
    if (task.status !== 'pending' || task.task_date >= today) continue
    upsertWeakArea({
      subject_id: task.subject_id,
      subject_name: task.subject?.name || task.subject_id,
      chapter_id: task.chapter_id,
      chapter_name: task.chapter?.name || null,
      reason: 'Pending overdue task',
      priority: 'high',
      suggested_action: `Finish the overdue ${task.chapter?.name || task.subject?.name || 'task'} today, then mark mistakes for revision.`,
      actionTarget: '/dashboard/tasks?focus=today#today-tasks',
    }, 90)
  }

  for (const [chapterId, chapterTasks] of byChapter.entries()) {
    const total = chapterTasks.length
    const pending = chapterTasks.filter((task) => task.status === 'pending').length
    if (total < 2 || pending < 2) continue
    const sample = chapterTasks[0]
    const pendingRate = pending / total
    upsertWeakArea({
      subject_id: sample.subject_id,
      subject_name: sample.subject?.name || sample.subject_id,
      chapter_id: chapterId,
      chapter_name: sample.chapter?.name || null,
      reason: `${pending} incomplete tasks in this chapter`,
      priority: pendingRate >= 0.75 ? 'high' : 'medium',
      suggested_action: `Revise ${sample.chapter?.name || 'this chapter'} and complete two pending practice tasks before moving ahead.`,
      actionTarget: sample.subject_id ? `/dashboard/subjects/${sample.subject_id}` : '/dashboard/tasks?focus=today#today-tasks',
    }, 60 + pending)
  }

  if (currentDay >= 7) {
    for (const [subjectId, subjectTasks] of bySubject.entries()) {
      const total = subjectTasks.length
      const completed = subjectTasks.filter((task) => task.status === 'completed').length
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
      if (total < 3 || percentage >= 40) continue
      const sample = subjectTasks[0]
      upsertWeakArea({
        subject_id: subjectId,
        subject_name: sample.subject?.name || subjectId,
        chapter_id: null,
        chapter_name: null,
        reason: `Low subject progress (${percentage}%)`,
        priority: percentage < 25 ? 'high' : 'medium',
        suggested_action: `Do a focused ${sample.subject?.name || subjectId} catch-up block and complete the next pending chapter task.`,
        actionTarget: `/dashboard/subjects/${subjectId}`,
      }, 50 + (40 - percentage))
    }
  }

  const { data: mockRows, error: mockError } = await supabase
    .from('mock_tests')
    .select('weak_areas, exam_id, test_date')
    .eq('user_id', userId)
    .eq('exam_id', plan.exam_id)
    .order('test_date', { ascending: false })
    .limit(10)

  if (mockError) throw mockError

  const mockWeakAreaCounts = new Map<string, number>()
  for (const row of mockRows || []) {
    const values = Array.isArray(row.weak_areas) ? row.weak_areas : []
    for (const area of values) {
      if (typeof area !== 'string' || !area.trim()) continue
      const key = area.trim()
      mockWeakAreaCounts.set(key, (mockWeakAreaCounts.get(key) || 0) + 1)
    }
  }

  for (const [area, count] of mockWeakAreaCounts.entries()) {
    upsertWeakArea({
      subject_id: null,
      subject_name: null,
      chapter_id: null,
      chapter_name: area,
      reason: `Mentioned in ${count} mock result${count > 1 ? 's' : ''}`,
      priority: count >= 2 ? 'high' : 'medium',
      suggested_action: `Add ${area} to tomorrow's revision and review the related mock mistakes.`,
      actionTarget: '/dashboard/mock-tests',
    }, 55 + count * 5)
  }

  return [...weakAreas.values()]
    .sort((a, b) => b.score - a.score)
    .map(({ score: _score, ...area }) => area)
    .slice(0, 8)
}

export async function getRevisionQueue(userId: string): Promise<RevisionQueueData> {
  const supabase = await createClient()
  const plan = await getActiveStudyPlan(userId)

  if (!plan) {
    return {
      plan: null,
      currentDay: 0,
      overdueTasks: [],
      weakChapters: [],
      mockWeakAreas: [],
      currentWeekRevisionTasks: [],
      suggestedOrder: [],
    }
  }

  const rawCurrentDay = getCalendarDay(plan.start_date)
  const currentDay = clamp(rawCurrentDay, 1, plan.target_days)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayString = toDateString(today)
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  const weekStartString = toDateString(weekStart)
  const weekEndString = toDateString(weekEnd)

  const { data: taskRows, error: taskError } = await supabase
    .from('user_daily_tasks')
    .select('*, subject:subjects(*), chapter:chapters(*)')
    .eq('user_id', userId)
    .eq('plan_id', plan.id)
    .order('task_date')
    .order('created_at')

  if (taskError) throw taskError

  const tasks = (taskRows || []) as UserDailyTask[]
  const overdueTasks = tasks
    .filter((task) => task.status === 'pending' && task.task_date < todayString)
    .slice(0, 10)
  const currentWeekRevisionTasks = tasks
    .filter((task) => (
      task.status === 'pending'
      && task.task_type === 'revision'
      && task.task_date >= weekStartString
      && task.task_date <= weekEndString
    ))
    .slice(0, 10)

  const chapterMap = new Map<string, RevisionWeakChapter>()
  for (const task of tasks) {
    if (!task.chapter_id) continue
    const existing = chapterMap.get(task.chapter_id) || {
      subject_id: task.subject_id,
      subject_name: task.subject?.name || task.subject_id,
      chapter_id: task.chapter_id,
      chapter_name: task.chapter?.name || 'Chapter',
      pendingTasks: 0,
      totalTasks: 0,
      completedTasks: 0,
      priority: 'low' as const,
    }
    existing.totalTasks += 1
    if (task.status === 'completed') {
      existing.completedTasks += 1
    } else if (task.status === 'pending') {
      existing.pendingTasks += 1
    }
    const pendingRate = existing.totalTasks > 0 ? existing.pendingTasks / existing.totalTasks : 0
    existing.priority = existing.pendingTasks >= 3 || pendingRate >= 0.75 ? 'high' : existing.pendingTasks >= 2 ? 'medium' : 'low'
    chapterMap.set(task.chapter_id, existing)
  }

  const weakChapters = [...chapterMap.values()]
    .filter((chapter) => chapter.totalTasks >= 2 && chapter.pendingTasks > 0)
    .sort((a, b) => {
      const priorityRank = { high: 0, medium: 1, low: 2 }
      return priorityRank[a.priority] - priorityRank[b.priority] || b.pendingTasks - a.pendingTasks
    })
    .slice(0, 8)

  const { data: mockRows, error: mockError } = await supabase
    .from('mock_tests')
    .select('weak_areas, test_date')
    .eq('user_id', userId)
    .eq('exam_id', plan.exam_id)
    .order('test_date', { ascending: false })
    .limit(10)

  if (mockError) throw mockError

  const mockCounts = new Map<string, number>()
  for (const row of mockRows || []) {
    const areas = Array.isArray(row.weak_areas) ? row.weak_areas : []
    for (const area of areas) {
      if (typeof area !== 'string' || !area.trim()) continue
      const key = area.trim()
      mockCounts.set(key, (mockCounts.get(key) || 0) + 1)
    }
  }

  const mockWeakAreas = [...mockCounts.entries()]
    .map(([area, count]) => ({ area, count }))
    .sort((a, b) => b.count - a.count || a.area.localeCompare(b.area))
    .slice(0, 8)

  const suggestedOrder = [
    ...overdueTasks.slice(0, 3).map((task) => ({
      id: `overdue-${task.id}`,
      title: task.title,
      reason: `Overdue from ${task.task_date}`,
      priority: 'high' as const,
      actionTarget: '/dashboard/tasks?focus=today#today-tasks',
    })),
    ...weakChapters.slice(0, 3).map((chapter) => ({
      id: `chapter-${chapter.chapter_id || chapter.chapter_name}`,
      title: chapter.chapter_name,
      reason: `${chapter.pendingTasks}/${chapter.totalTasks} tasks pending`,
      priority: chapter.priority,
      actionTarget: chapter.subject_id ? `/dashboard/subjects/${chapter.subject_id}` : '/dashboard/subjects',
    })),
    ...mockWeakAreas.slice(0, 2).map((area) => ({
      id: `mock-${area.area}`,
      title: area.area,
      reason: `Repeated in ${area.count} mock result${area.count > 1 ? 's' : ''}`,
      priority: area.count > 1 ? 'high' as const : 'medium' as const,
      actionTarget: '/dashboard/mock-tests',
    })),
    ...currentWeekRevisionTasks.slice(0, 3).map((task) => ({
      id: `revision-${task.id}`,
      title: task.title,
      reason: `Revision task for ${task.task_date}`,
      priority: task.priority,
      actionTarget: '/dashboard/tasks?focus=today#today-tasks',
    })),
  ].slice(0, 10)

  return {
    plan,
    currentDay,
    overdueTasks,
    weakChapters,
    mockWeakAreas,
    currentWeekRevisionTasks,
    suggestedOrder,
  }
}

export async function getActivePlanSubjectDetail(userId: string, subjectId: string): Promise<ActivePlanSubjectDetail> {
  const supabase = await createClient()
  const plan = await getActiveStudyPlan(userId)

  const { data: subject, error: subjectError } = await supabase
    .from('subjects')
    .select('*')
    .eq('id', subjectId)
    .single()

  if (subjectError && subjectError.code !== 'PGRST116') throw subjectError

  if (!plan || !subject) {
    return {
      plan,
      subject: subject || null,
      chapters: [],
      completedTasks: 0,
      totalTasks: 0,
      percentage: 0,
    }
  }

  const { data: chapters, error: chaptersError } = await supabase
    .from('chapters')
    .select('*')
    .eq('exam_id', plan.exam_id)
    .eq('subject_id', subjectId)
    .order('order_index')

  if (chaptersError) throw chaptersError

  const { data: tasks, error: tasksError } = await supabase
    .from('user_daily_tasks')
    .select('chapter_id, status')
    .eq('user_id', userId)
    .eq('plan_id', plan.id)
    .eq('subject_id', subjectId)
    .not('chapter_id', 'is', null)

  if (tasksError) throw tasksError

  const taskCountsByChapter = ((tasks || []) as Array<{ chapter_id: string | null; status: string }>).reduce((acc, task) => {
    if (!task.chapter_id) return acc
    acc[task.chapter_id] = acc[task.chapter_id] || { total: 0, completed: 0 }
    acc[task.chapter_id].total += 1
    if (task.status === 'completed') acc[task.chapter_id].completed += 1
    return acc
  }, {} as Record<string, { total: number; completed: number }>)

  const chapterProgress = ((chapters || []) as Chapter[]).map((chapter) => {
    const counts = taskCountsByChapter[chapter.id] || { total: 0, completed: 0 }
    const percentage = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0
    const status: SubjectChapterProgress['status'] = counts.total === 0 || counts.completed === 0
      ? 'not_started'
      : counts.completed >= counts.total
        ? 'completed'
        : 'in_progress'

    return {
      ...chapter,
      completedTasks: counts.completed,
      totalTasks: counts.total,
      percentage,
      status,
    }
  })

  const totalTasks = chapterProgress.reduce((sum, chapter) => sum + chapter.totalTasks, 0)
  const completedTasks = chapterProgress.reduce((sum, chapter) => sum + chapter.completedTasks, 0)

  return {
    plan,
    subject: subject as Subject,
    chapters: chapterProgress,
    completedTasks,
    totalTasks,
    percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
  }
}

export async function getPlanSettingsData(userId: string): Promise<PlanSettingsData> {
  const [plan, profile, exams] = await Promise.all([
    getActiveStudyPlan(userId),
    getProfile(userId),
    getMasterExams(),
  ])

  return { plan, profile, exams }
}

export async function getSidebarPlanSummary(userId: string): Promise<{
  examName: string | null
  targetDays: number | null
  hasActivePlan: boolean
}> {
  const supabase = await createClient()
  const plan = await getActiveStudyPlan(userId)

  if (!plan) {
    return { examName: null, targetDays: null, hasActivePlan: false }
  }

  const { data: exam, error } = await supabase
    .from('exams')
    .select('name')
    .eq('id', plan.exam_id)
    .single()

  if (error && error.code !== 'PGRST116') throw error

  return {
    examName: exam?.name || plan.exam_id,
    targetDays: plan.target_days,
    hasActivePlan: true,
  }
}

export async function getAdminDebugSnapshot(user: { id: string; email?: string | null }): Promise<AdminDebugSnapshot> {
  const supabase = await createClient()
  const plan = await getActiveStudyPlan(user.id)

  const [
    archivedPlanResult,
    pyqCountResult,
    verifiedPyqCountResult,
    trustedThirdPartyPyqCountResult,
    trustedThirdPartyInReviewPyqCountResult,
    trustedThirdPartyReviewedPyqCountResult,
    memoryBasedPyqCountResult,
    aiPracticePyqCountResult,
    mockResultCountResult,
    weakAreas,
    revisionQueue,
  ] = await Promise.all([
    supabase
      .from('user_study_plans')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'archived'),
    supabase
      .from('pyq_questions')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('pyq_questions')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'verified_pyq')
      .eq('is_verified', true),
    supabase
      .from('pyq_questions')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'trusted_third_party'),
    supabase
      .from('pyq_questions')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'trusted_third_party')
      .eq('verification_status', 'in_review'),
    supabase
      .from('pyq_questions')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'trusted_third_party')
      .eq('verification_status', 'third_party_reviewed'),
    supabase
      .from('pyq_questions')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'memory_based'),
    supabase
      .from('pyq_questions')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'ai_generated'),
    supabase
      .from('mock_tests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    getWeakAreas(user.id),
    getRevisionQueue(user.id),
  ])

  if (archivedPlanResult.error) throw archivedPlanResult.error
  if (pyqCountResult.error) throw pyqCountResult.error
  if (verifiedPyqCountResult.error) throw verifiedPyqCountResult.error
  if (trustedThirdPartyPyqCountResult.error) throw trustedThirdPartyPyqCountResult.error
  if (trustedThirdPartyInReviewPyqCountResult.error) throw trustedThirdPartyInReviewPyqCountResult.error
  if (trustedThirdPartyReviewedPyqCountResult.error) throw trustedThirdPartyReviewedPyqCountResult.error
  if (memoryBasedPyqCountResult.error) throw memoryBasedPyqCountResult.error
  if (aiPracticePyqCountResult.error) throw aiPracticePyqCountResult.error
  if (mockResultCountResult.error) throw mockResultCountResult.error

  const emptyTaskCounts = {
    total: 0,
    today: 0,
    completed: 0,
    pending: 0,
    skipped: 0,
    overduePending: 0,
  }

  if (!plan) {
    return {
      user: {
        id: user.id,
        email: user.email || null,
      },
      activePlan: null,
      archivedPlanCount: archivedPlanResult.count || 0,
      taskCounts: emptyTaskCounts,
      subjectDistribution: [],
      weakAreasCount: weakAreas.length,
      revisionQueueCounts: {
        overdueTasks: revisionQueue.overdueTasks.length,
        weakChapters: revisionQueue.weakChapters.length,
        mockWeakAreas: revisionQueue.mockWeakAreas.length,
        currentWeekRevisionTasks: revisionQueue.currentWeekRevisionTasks.length,
        suggestedOrder: revisionQueue.suggestedOrder.length,
      },
      pyqCounts: {
        total: pyqCountResult.count || 0,
        verified: verifiedPyqCountResult.count || 0,
        trustedThirdParty: trustedThirdPartyPyqCountResult.count || 0,
        trustedThirdPartyInReview: trustedThirdPartyInReviewPyqCountResult.count || 0,
        trustedThirdPartyReviewed: trustedThirdPartyReviewedPyqCountResult.count || 0,
        memoryBased: memoryBasedPyqCountResult.count || 0,
        aiPractice: aiPracticePyqCountResult.count || 0,
      },
      mockResultCount: mockResultCountResult.count || 0,
    }
  }

  const rawCurrentDay = getCalendarDay(plan.start_date)
  const currentDay = clamp(rawCurrentDay, 1, plan.target_days)
  const today = toDateString(new Date())

  const [examResult, taskResult] = await Promise.all([
    supabase
      .from('exams')
      .select('name')
      .eq('id', plan.exam_id)
      .single(),
    supabase
      .from('user_daily_tasks')
      .select('id, status, task_date, day_number, subject_id, subject:subjects(id, name)')
      .eq('user_id', user.id)
      .eq('plan_id', plan.id),
  ])

  if (examResult.error && examResult.error.code !== 'PGRST116') throw examResult.error
  if (taskResult.error) throw taskResult.error

  const tasks = ((taskResult.data || []) as Array<{
    id: string
    status: UserDailyTask['status']
    task_date: string
    day_number: number
    subject_id: string | null
    subject: Pick<Subject, 'id' | 'name'> | Array<Pick<Subject, 'id' | 'name'>> | null
  }>).map((task) => ({
    ...task,
    subject: Array.isArray(task.subject) ? task.subject[0] || null : task.subject,
  }))

  const todayTasks = new Map(
    tasks
      .filter((task) => task.day_number === currentDay || task.task_date === today)
      .map((task) => [task.id, task])
  )
  const subjectDistributionById = new Map<string, AdminDebugSnapshot['subjectDistribution'][number]>()

  for (const task of tasks) {
    const key = task.subject_id || 'general'
    const existing = subjectDistributionById.get(key) || {
      subjectId: task.subject_id,
      subjectName: task.subject?.name || task.subject_id || 'General',
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      skippedTasks: 0,
    }

    existing.totalTasks += 1
    if (task.status === 'completed') existing.completedTasks += 1
    if (task.status === 'pending') existing.pendingTasks += 1
    if (task.status === 'skipped') existing.skippedTasks += 1
    subjectDistributionById.set(key, existing)
  }

  return {
    user: {
      id: user.id,
      email: user.email || null,
    },
    activePlan: {
      id: plan.id,
      examId: plan.exam_id,
      examName: examResult.data?.name || plan.exam_id,
      targetDays: plan.target_days,
      currentDay,
    },
    archivedPlanCount: archivedPlanResult.count || 0,
    taskCounts: {
      total: tasks.length,
      today: todayTasks.size,
      completed: tasks.filter((task) => task.status === 'completed').length,
      pending: tasks.filter((task) => task.status === 'pending').length,
      skipped: tasks.filter((task) => task.status === 'skipped').length,
      overduePending: tasks.filter((task) => task.status === 'pending' && task.task_date < today).length,
    },
    subjectDistribution: [...subjectDistributionById.values()].sort((a, b) => (
      b.totalTasks - a.totalTasks || a.subjectName.localeCompare(b.subjectName)
    )),
    weakAreasCount: weakAreas.length,
    revisionQueueCounts: {
      overdueTasks: revisionQueue.overdueTasks.length,
      weakChapters: revisionQueue.weakChapters.length,
      mockWeakAreas: revisionQueue.mockWeakAreas.length,
      currentWeekRevisionTasks: revisionQueue.currentWeekRevisionTasks.length,
      suggestedOrder: revisionQueue.suggestedOrder.length,
    },
    pyqCounts: {
      total: pyqCountResult.count || 0,
      verified: verifiedPyqCountResult.count || 0,
      trustedThirdParty: trustedThirdPartyPyqCountResult.count || 0,
      trustedThirdPartyInReview: trustedThirdPartyInReviewPyqCountResult.count || 0,
      trustedThirdPartyReviewed: trustedThirdPartyReviewedPyqCountResult.count || 0,
      memoryBased: memoryBasedPyqCountResult.count || 0,
      aiPractice: aiPracticePyqCountResult.count || 0,
    },
    mockResultCount: mockResultCountResult.count || 0,
  }
}
