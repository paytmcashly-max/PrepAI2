import { createClient } from '@/lib/supabase/server'
import { getActiveStudyPlan, getSubjectProgress } from '@/lib/queries'
import { SubjectsContent } from '@/components/dashboard/subjects-content'

export default async function SubjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const [plan, progress] = await Promise.all([
    getActiveStudyPlan(user.id),
    getSubjectProgress(user.id),
  ])

  return <SubjectsContent subjects={progress} hasActivePlan={Boolean(plan)} />
}
