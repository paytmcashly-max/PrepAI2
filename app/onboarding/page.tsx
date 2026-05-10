import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingForm } from '@/components/onboarding/onboarding-form'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const [{ data: profile }, { data: exams }] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
    supabase
      .from('exams')
      .select('id, name, level')
      .order('name'),
  ])

  const onboardingCompleted = profile?.onboarding_completed ?? Boolean(profile?.exam_target)

  if (onboardingCompleted) {
    redirect('/dashboard')
  }

  return <OnboardingForm exams={exams || []} />
}
