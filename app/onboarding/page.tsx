import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingForm } from '@/components/onboarding/onboarding-form'
import { getMasterExams } from '@/lib/queries'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const [{ data: profile }, exams] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
    getMasterExams(),
  ])

  const onboardingCompleted = profile?.onboarding_completed ?? Boolean(profile?.exam_target)

  if (onboardingCompleted) {
    redirect('/dashboard')
  }

  return <OnboardingForm exams={exams} />
}
