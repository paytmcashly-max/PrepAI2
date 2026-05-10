// Server-side queries for PrepTrack
import { createClient } from '@/lib/supabase/server'
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

export async function getSubjectWithChapters(subjectId: string): Promise<Subject & { chapters: Chapter[] }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subjects')
    .select('*, chapters(*)')
    .eq('id', subjectId)
    .single()

  if (error) throw error
  return data
}

export async function getChaptersBySubject(subjectId: string): Promise<Chapter[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('subject_id', subjectId)
    .order('order_index')

  if (error) throw error
  return data || []
}

// ============ ROADMAP & PHASES ============
export async function getUserRoadmapData(): Promise<{
  plan: UserStudyPlan | null
  phases: RoadmapPhase[]
  subjects: Subject[]
  currentDay: number
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { plan: null, phases: [], subjects: [], currentDay: 0 }

  const plan = await getActiveStudyPlan(user.id)
  if (!plan) {
    return { plan: null, phases: [], subjects: [], currentDay: 0 }
  }

  const { data: chapters, error: chaptersError } = await supabase
    .from('chapters')
    .select('subject:subjects(*)')
    .eq('exam_id', plan.exam_id)
    .order('order_index')

  if (chaptersError) throw chaptersError

  const subjectsById = new Map<string, Subject>()
  for (const row of chapters || []) {
    const subject = Array.isArray(row.subject) ? row.subject[0] : row.subject
    if (subject?.id && !subjectsById.has(subject.id)) {
      subjectsById.set(subject.id, subject as Subject)
    }
  }

  return {
    plan,
    phases: buildRoadmapPhases(plan.target_days),
    subjects: [...subjectsById.values()],
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
  const { data: tasks, error } = await supabase
    .from('user_daily_tasks')
    .select('*, subject:subjects(*), chapter:chapters(*)')
    .eq('user_id', userId)
    .eq('plan_id', plan.id)
    .eq('day_number', currentDay)
    .order('created_at')

  if (error) throw error

  return buildDayTaskGroup(plan, currentDay, (tasks || []) as UserDailyTask[])
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
  difficulty?: string
}): Promise<PYQQuestion[]> {
  const supabase = await createClient()
  let query = supabase
    .from('pyq_questions')
    .select('*, subject:subjects(*)')
    .order('year', { ascending: false })

  if (filters?.examId) query = query.eq('exam_id', filters.examId)
  if (filters?.year) query = query.eq('year', filters.year)
  if (filters?.subjectId) query = query.eq('subject_id', filters.subjectId)
  if (filters?.difficulty) query = query.eq('difficulty', filters.difficulty)

  const { data, error } = await query

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
    while (completedDates.has(checkDate.toISOString().split('T')[0])) {
      currentStreak++
      checkDate.setDate(checkDate.getDate() - 1)
    }
  }

  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
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

  const { data: todayTasks } = await supabase
    .from('user_daily_tasks')
    .select('status')
    .eq('user_id', userId)
    .eq('plan_id', plan.id)
    .eq('day_number', currentDay)

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
    todayTaskCount: todayTasks?.length || 0,
    todayCompletedCount: todayTasks?.filter(task => task.status === 'completed').length || 0,
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
  }))

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
  })
}
