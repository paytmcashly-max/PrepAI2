import { createClient } from '@/lib/supabase/server'
import { getPlanSettingsData } from '@/lib/queries'
import { PlanSettingsForm } from '@/components/dashboard/plan-settings-form'

export default async function PlanSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { plan, profile, exams } = await getPlanSettingsData(user.id)

  return (
    <PlanSettingsForm
      plan={plan}
      profile={profile}
      exams={exams}
    />
  )
}
