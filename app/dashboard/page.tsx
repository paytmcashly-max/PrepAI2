import { createClient } from '@/lib/supabase/server'
import { getAdaptiveRevisionRecommendations, getDashboardStats, getSubjectProgress, getRandomQuote, getTodayTaskGroup, getWeakAreas, getOverdueTaskCount, getPYQProgressSummary } from '@/lib/queries'
import { DashboardContent } from '@/components/dashboard/dashboard-content'
import { getDailyCoachFallbackSuggestions } from '@/lib/actions'
import type { AdaptiveRevisionRecommendation, CoachActionResult, DashboardStats, DayTaskGroup, MotivationalQuote, PYQProgressSummary, SubjectProgress, WeakArea } from '@/lib/types'

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

  const [statsResult, subjectProgressResult, quoteResult, todayTasksResult, weakAreasResult, overdueCountResult, pyqProgressResult, adaptiveRecommendationsResult, dailyCoachResult] = await Promise.allSettled([
    getDashboardStats(user.id),
    getSubjectProgress(user.id),
    getRandomQuote(),
    getTodayTaskGroup(user.id),
    getWeakAreas(user.id),
    getOverdueTaskCount(user.id),
    getPYQProgressSummary(user.id),
    getAdaptiveRevisionRecommendations(user.id),
    getDailyCoachFallbackSuggestions(),
  ])
  const stats = valueOrFallback(statsResult, fallbackStats, 'stats')
  const subjectProgress = valueOrFallback<SubjectProgress[]>(subjectProgressResult, [], 'subject progress')
  const quote = valueOrFallback<MotivationalQuote | null>(quoteResult, null, 'quote')
  const todayTaskGroup = valueOrFallback<DayTaskGroup | null>(todayTasksResult, null, 'today tasks')
  const weakAreas = valueOrFallback<WeakArea[]>(weakAreasResult, [], 'weak areas')
  const overdueTaskCount = valueOrFallback<number>(overdueCountResult, 0, 'overdue task count')
  const pyqProgress = valueOrFallback<PYQProgressSummary | null>(pyqProgressResult, null, 'PYQ progress')
  const adaptiveRecommendations = valueOrFallback<AdaptiveRevisionRecommendation[]>(adaptiveRecommendationsResult, [], 'adaptive revision recommendations')
  const dailyCoach = valueOrFallback<CoachActionResult | null>(dailyCoachResult, null, 'daily coach')

  return (
    <DashboardContent 
      stats={stats} 
      subjectProgress={subjectProgress} 
      quote={quote}
      todayTaskGroup={todayTaskGroup}
      weakAreas={weakAreas}
      overdueTaskCount={overdueTaskCount}
      pyqProgress={pyqProgress}
      adaptiveRecommendations={adaptiveRecommendations}
      dailyCoach={dailyCoach}
    />
  )
}
