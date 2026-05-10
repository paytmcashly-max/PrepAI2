// Server-side queries for PrepTrack
import { createClient } from '@/lib/supabase/server'
import type {
  Subject,
  Chapter,
  RoadmapPhase,
  DailyPlan,
  DailyTask,
  Profile,
  MockTest,
  MockTestAttempt,
  Note,
  PYQQuestion,
  MotivationalQuote,
  DashboardStats,
  SubjectProgress,
  DayTaskGroup,
  DailyTaskWithStatus,
  UserDailyTask,
} from '@/lib/types'

function getCalendarDay(startDate: string) {
  const start = new Date(`${startDate}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

// ============ SUBJECTS ============
export async function getSubjects(): Promise<Subject[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
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
export async function getRoadmapPhases(): Promise<RoadmapPhase[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('roadmap_phases')
    .select('*')
    .order('start_day')

  if (error) throw error
  return data || []
}

export async function getDailyPlans(): Promise<DailyPlan[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('daily_plans')
    .select('*, phase:roadmap_phases(*)')
    .order('day')

  if (error) throw error
  return data || []
}

export async function getDailyPlanByDay(day: number): Promise<DailyPlan | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('daily_plans')
    .select('*, phase:roadmap_phases(*)')
    .eq('day', day)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

// ============ DAILY TASKS ============
export async function getDailyTasks(planId: string): Promise<DailyTask[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('daily_tasks')
    .select('*, subject:subjects(*)')
    .eq('daily_plan_id', planId)
    .order('order_index')

  if (error) throw error
  return data || []
}

export async function getTasksForDay(day: number): Promise<DailyTask[]> {
  const supabase = await createClient()
  
  // First get the daily plan for the day
  const { data: plan, error: planError } = await supabase
    .from('daily_plans')
    .select('id')
    .eq('day', day)
    .single()

  if (planError && planError.code !== 'PGRST116') throw planError
  if (!plan) return []

  const { data, error } = await supabase
    .from('daily_tasks')
    .select('*, subject:subjects(*)')
    .eq('daily_plan_id', plan.id)
    .order('order_index')

  if (error) throw error
  return data || []
}

export async function getAllTasksWithPlans(): Promise<DayTaskGroup[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: plan, error: planError } = await supabase
    .from('user_study_plans')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (planError?.code === 'PGRST205') return []
  if (planError && planError.code !== 'PGRST116') throw planError
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

  return Object.entries(grouped).map(([day, dayTasks]) => {
    const dayNumber = Number(day)
    return {
      id: `${plan.id}-${day}`,
      day: dayNumber,
      date: dayTasks[0]?.task_date || plan.start_date,
      phaseId: null,
      phaseName: null,
      isRevisionDay: dayTasks.some((task) => task.task_type === 'revision'),
      tasks: dayTasks,
      completedCount: dayTasks.filter((task) => task.status === 'completed').length,
      totalCount: dayTasks.length,
    }
  })
}

// ============ TASK COMPLETIONS ============
export async function getUserTaskCompletions(userId: string): Promise<Record<string, boolean>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('task_completions')
    .select('daily_task_id, completed')
    .eq('user_id', userId)

  if (error) throw error
  
  return (data || []).reduce((acc, item) => {
    acc[item.daily_task_id] = item.completed
    return acc
  }, {} as Record<string, boolean>)
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
    .eq('is_active', true)
    .order('created_at', { ascending: false })

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
    .order('created_at', { ascending: false })

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
    .from('motivational_quotes')
    .select('*')

  if (error) throw error
  if (!data || data.length === 0) return null

  return data[Math.floor(Math.random() * data.length)]
}

// ============ DASHBOARD STATS ============
export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const supabase = await createClient()

  const profile = await getProfile(userId)
  const { data: plan } = await supabase
    .from('user_study_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!profile?.start_date || !plan) {
    return {
      currentStreak: 0,
      tasksCompletedThisMonth: 0,
      topicsCovered: 0,
      totalTopics: 0,
      avgMockScore: 0,
      currentDay: 0,
      totalDays: profile?.target_days || 0,
      todayTaskCount: 0,
      todayCompletedCount: 0,
      planState: 'missing',
    }
  }

  const rawCurrentDay = getCalendarDay(profile.start_date)
  const currentDay = Math.min(Math.max(rawCurrentDay, 1), plan.target_days)
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

  const { data: attempts } = await supabase
    .from('mock_test_attempts')
    .select('marks_obtained, total_marks')
    .eq('user_id', userId)
    .eq('status', 'completed')

  let avgMockScore = 0
  if (attempts && attempts.length > 0) {
    const scores = attempts
      .filter(a => a.marks_obtained !== null && a.total_marks !== null && a.total_marks > 0)
      .map(a => (a.marks_obtained! / a.total_marks!) * 100)
    avgMockScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
  }

  return {
    currentStreak,
    tasksCompletedThisMonth: tasksThisMonth || 0,
    topicsCovered,
    totalTopics: totalTopics || 0,
    avgMockScore: Math.round(avgMockScore * 10) / 10,
    currentDay,
    totalDays: plan.target_days,
    todayTaskCount: todayTasks?.length || 0,
    todayCompletedCount: todayTasks?.filter(task => task.status === 'completed').length || 0,
    planState,
  }
}

export async function getSubjectProgress(userId: string): Promise<SubjectProgress[]> {
  const supabase = await createClient()

  const { data: plan } = await supabase
    .from('user_study_plans')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!plan) return []

  const { data: tasks, error } = await supabase
    .from('user_daily_tasks')
    .select('subject_id, status, chapter:chapters(name), subject:subjects(id, name, color)')
    .eq('user_id', userId)
    .eq('plan_id', plan.id)
    .not('subject_id', 'is', null)

  if (error) throw error

  const normalizedTasks = ((tasks || []) as unknown as Array<{
    subject_id: string
    status: string
    chapter: { name: string } | Array<{ name: string }> | null
    subject: { id: string; name: string; color: string | null } | Array<{ id: string; name: string; color: string | null }> | null
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
      color: task.subject?.color || '#3B82F6',
      tasks: [],
    }
    acc[task.subject_id].tasks.push(task)
    return acc
  }, {} as Record<string, {
    id: string
    name: string
    color: string
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
      color: subject.color,
      completedTasks: completedCount,
      totalTasks: totalCount,
      percentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      currentChapter: activeTask?.chapter?.name || null,
      weakChapters,
    }
  })
}
