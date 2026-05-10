import { createClient } from '@/lib/supabase/server'
import { getDashboardStats, getSubjectProgress, getRandomQuote } from '@/lib/queries'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null // Layout handles redirect
  }

  const [stats, subjectProgress, quote] = await Promise.all([
    getDashboardStats(user.id),
    getSubjectProgress(user.id),
    getRandomQuote(),
  ])

  return (
    <DashboardContent 
      stats={stats} 
      subjectProgress={subjectProgress} 
      quote={quote}
    />
  )
}
