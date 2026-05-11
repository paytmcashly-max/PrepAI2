import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin-auth'
import { getPYQFilterData, getPYQQuestionById } from '@/lib/queries'
import { PYQEditForm } from '@/components/dashboard/pyq-edit-form'

export default async function PYQEditPage({ params }: { params: Promise<{ questionId: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdminEmail(user.email)) {
    notFound()
  }

  const { questionId } = await params
  const [question, filterData] = await Promise.all([
    getPYQQuestionById(decodeURIComponent(questionId)),
    getPYQFilterData(),
  ])

  if (!question) {
    notFound()
  }

  return (
    <PYQEditForm
      question={question}
      exams={filterData.exams}
      subjects={filterData.subjects}
      chapters={filterData.chapters}
    />
  )
}
