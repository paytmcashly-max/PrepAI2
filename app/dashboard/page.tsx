import { createClient } from '@/lib/supabase/server'
import { getDashboardStats, getSubjectProgress, getRandomQuote, getTodayTaskGroup } from '@/lib/queries'
import { DashboardContent } from '@/components/dashboard/dashboard-content'
import type { DashboardStats, DayTaskGroup, MotivationalQuote, SubjectProgress } from '@/lib/types'

const fallbackStats: DashboardStats = {
  activePlanId: null,
  currentStreak: 0,
  tasksCompletedThisMonth: 0,
  topicsCovered: 0,
  totalTopics: 0,
  avgMockScore: 0,
  currentDay: 0,
  totalDays: 0,
  todayTaskCount: 0,
  todayCompletedCount: 0,
  overallTaskCount: 0,
  overallCompletedCount: 0,
  planState: 'missing',
}

function valueOrFallback<T>(result: PromiseSettledResult<T>, fallback: T, label: string) {
  if (result.status === 'fulfilled') {
    return result.value
  }

  console.error(`[dashboard] Failed to load ${label}`, result.reason)
  return fallback
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null // Layout handles redirect
  }

  const [statsResult, subjectProgressResult, quoteResult, todayTasksResult] = await Promise.allSettled([
    getDashboardStats(user.id),
    getSubjectProgress(user.id),
    getRandomQuote(),
    getTodayTaskGroup(user.id),
  ])
  const stats = valueOrFallback(statsResult, fallbackStats, 'stats')
  const subjectProgress = valueOrFallback<SubjectProgress[]>(subjectProgressResult, [], 'subject progress')
  const quote = valueOrFallback<MotivationalQuote | null>(quoteResult, null, 'quote')
  const todayTaskGroup = valueOrFallback<DayTaskGroup | null>(todayTasksResult, null, 'today tasks')

  return (
    <DashboardContent 
      stats={stats} 
      subjectProgress={subjectProgress} 
      quote={quote}
      todayTaskGroup={todayTaskGroup}
    />
  )
}
