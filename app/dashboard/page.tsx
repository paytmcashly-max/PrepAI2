import { createClient } from '@/lib/supabase/server'
import { getDashboardStats, getSubjectProgress, getRandomQuote } from '@/lib/queries'
import { DashboardContent } from '@/components/dashboard/dashboard-content'
import type { DashboardStats, MotivationalQuote, SubjectProgress } from '@/lib/types'

const fallbackStats: DashboardStats = {
  currentStreak: 0,
  tasksCompletedThisMonth: 0,
  topicsCovered: 0,
  totalTopics: 0,
  avgMockScore: 0,
  currentDay: 1,
  totalDays: 180,
  todayTaskCount: 0,
  todayCompletedCount: 0,
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

  const [statsResult, subjectProgressResult, quoteResult] = await Promise.allSettled([
    getDashboardStats(user.id),
    getSubjectProgress(user.id),
    getRandomQuote(),
  ])
  const stats = valueOrFallback(statsResult, fallbackStats, 'stats')
  const subjectProgress = valueOrFallback<SubjectProgress[]>(subjectProgressResult, [], 'subject progress')
  const quote = valueOrFallback<MotivationalQuote | null>(quoteResult, null, 'quote')

  return (
    <DashboardContent 
      stats={stats} 
      subjectProgress={subjectProgress} 
      quote={quote}
    />
  )
}
