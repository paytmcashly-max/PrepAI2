import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin-auth'
import { getPYQReviewRows } from '@/lib/queries'
import { PYQReviewContent } from '@/components/dashboard/pyq-review-content'

export default async function PYQReviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdminEmail(user.email)) {
    notFound()
  }

  const questions = await getPYQReviewRows()

  return <PYQReviewContent questions={questions} />
}
