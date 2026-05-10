import { createClient } from '@/lib/supabase/server'
import { getMasterExams, getMockTests, getUserMockResults } from '@/lib/queries'
import { MockTestsContent } from '@/components/dashboard/mock-tests-content'

export default async function MockTestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const [mockTests, mockResults, examsResult] = await Promise.all([
    getMockTests(),
    getUserMockResults(user.id),
    getMasterExams(),
  ])

  return <MockTestsContent mockTests={mockTests} mockResults={mockResults} exams={examsResult} />
}
