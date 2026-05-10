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
} from '@/lib/types'

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
  
  const { data: plans, error: plansError } = await supabase
    .from('daily_plans')
    .select('*, phase:roadmap_phases(*)')
    .order('day')

  if (plansError) throw plansError

  const { data: tasks, error: tasksError } = await supabase
    .from('daily_tasks')
    .select('*, subject:subjects(*)')
    .order('order_index')

  if (tasksError) throw tasksError

  // Get current user for task completions
  const { data: { user } } = await supabase.auth.getUser()
  
  let completions: Record<string, { completed: boolean; completed_at: string | null }> = {}
  
  if (user) {
    const { data: completionData } = await supabase
      .from('task_completions')
      .select('daily_task_id, completed, completed_at')
      .eq('user_id', user.id)

    if (completionData) {
      completions = completionData.reduce((acc, c) => {
        acc[c.daily_task_id] = { completed: c.completed, completed_at: c.completed_at }
        return acc
      }, {} as Record<string, { completed: boolean; completed_at: string | null }>)
    }
  }

  // Group tasks by daily plan
  const tasksByPlan = (tasks || []).reduce((acc, task) => {
    if (!acc[task.daily_plan_id]) acc[task.daily_plan_id] = []
    acc[task.daily_plan_id].push(task)
    return acc
  }, {} as Record<string, DailyTask[]>)

  return (plans || []).map(plan => {
    const planTasks = tasksByPlan[plan.id] || []
    const tasksWithStatus: DailyTaskWithStatus[] = planTasks.map(t => ({
      ...t,
      isCompleted: completions[t.id]?.completed || false,
      completedAt: completions[t.id]?.completed_at || null,
    }))

    return {
      id: plan.id,
      day: plan.day,
      date: new Date(Date.now() + (plan.day - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      phaseId: plan.phase_id,
      phaseName: plan.phase?.name || null,
      isRevisionDay: plan.is_revision_day,
      tasks: tasksWithStatus,
      completedCount: tasksWithStatus.filter(t => t.isCompleted).length,
      totalCount: tasksWithStatus.length,
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
    .select('*, mock_test:mock_tests(*)')
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
    .select('*, subject:subjects(*)')
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

  // Get user profile for start date
  const profile = await getProfile(userId)
  const startDate = profile?.start_date ? new Date(profile.start_date) : new Date()
  const today = new Date()
  const currentDay = Math.max(1, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))

  // Get task completions for streak calculation
  const { data: completions } = await supabase
    .from('task_completions')
    .select('completed_at')
    .eq('user_id', userId)
    .eq('completed', true)
    .order('completed_at', { ascending: false })

  // Calculate streak
  let currentStreak = 0
  if (completions && completions.length > 0) {
    const completedDates = new Set(
      completions.map(c => c.completed_at?.split('T')[0]).filter(Boolean)
    )
    
    const checkDate = new Date()
    while (completedDates.has(checkDate.toISOString().split('T')[0])) {
      currentStreak++
      checkDate.setDate(checkDate.getDate() - 1)
    }
  }

  // Get tasks completed this month
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
  const { count: tasksThisMonth } = await supabase
    .from('task_completions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('completed', true)
    .gte('completed_at', monthStart)

  // Get total topics (chapters) and covered topics
  const { count: totalTopics } = await supabase
    .from('chapters')
    .select('*', { count: 'exact', head: true })

  // Topics covered based on completed tasks with chapters
  const { data: completedTaskChapters } = await supabase
    .from('task_completions')
    .select('daily_task_id')
    .eq('user_id', userId)
    .eq('completed', true)

  let topicsCovered = 0
  if (completedTaskChapters && completedTaskChapters.length > 0) {
    const taskIds = completedTaskChapters.map(c => c.daily_task_id)
    const { data: tasksWithChapters } = await supabase
      .from('daily_tasks')
      .select('chapter')
      .in('id', taskIds)
      .not('chapter', 'is', null)

    topicsCovered = new Set(tasksWithChapters?.map(t => t.chapter)).size
  }

  // Get average mock test score
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

  // Get total days in roadmap
  const { data: lastPlan } = await supabase
    .from('daily_plans')
    .select('day')
    .order('day', { ascending: false })
    .limit(1)
    .single()

  return {
    currentStreak,
    tasksCompletedThisMonth: tasksThisMonth || 0,
    topicsCovered,
    totalTopics: totalTopics || 0,
    avgMockScore: Math.round(avgMockScore * 10) / 10,
    currentDay,
    totalDays: lastPlan?.day || 180,
  }
}

export async function getSubjectProgress(userId: string): Promise<SubjectProgress[]> {
  const supabase = await createClient()

  const subjects = await getSubjects()
  
  // Get all tasks grouped by subject
  const { data: allTasks } = await supabase
    .from('daily_tasks')
    .select('id, subject_id')

  // Get user's completed tasks
  const { data: completedTasks } = await supabase
    .from('task_completions')
    .select('daily_task_id')
    .eq('user_id', userId)
    .eq('completed', true)

  const completedTaskIds = new Set(completedTasks?.map(c => c.daily_task_id) || [])

  return subjects.map(subject => {
    const subjectTasks = allTasks?.filter(t => t.subject_id === subject.id) || []
    const completedCount = subjectTasks.filter(t => completedTaskIds.has(t.id)).length
    const totalCount = subjectTasks.length

    return {
      id: subject.id,
      name: subject.name,
      color: subject.color || '#3B82F6',
      completedTasks: completedCount,
      totalTasks: totalCount,
      percentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
    }
  })
}
