import { createClient } from '@/lib/supabase/server'
import { getMockTests, getUserMockTestAttempts } from '@/lib/queries'
import { MockTestsContent } from '@/components/dashboard/mock-tests-content'

export default async function MockTestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const [mockTests, attempts] = await Promise.all([
    getMockTests(),
    getUserMockTestAttempts(user.id),
  ])

  return <MockTestsContent mockTests={mockTests} attempts={attempts} />
}
