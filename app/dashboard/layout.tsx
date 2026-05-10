import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { getSidebarPlanSummary } from '@/lib/queries'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const onboardingCompleted = profile?.onboarding_completed ?? Boolean(profile?.exam_target)

  if (!onboardingCompleted) {
    redirect('/onboarding')
  }

  const sidebarSummary = await getSidebarPlanSummary(user.id)

  return (
    <SidebarProvider>
      <DashboardSidebar
        examName={sidebarSummary.examName}
        targetDays={sidebarSummary.targetDays}
        hasActivePlan={sidebarSummary.hasActivePlan}
      />
      <SidebarInset>
        <DashboardHeader user={user} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
