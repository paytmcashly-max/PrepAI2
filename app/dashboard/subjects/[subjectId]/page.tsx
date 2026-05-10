import { getSubjectWithChapters } from '@/lib/queries'
import { createClient } from '@/lib/supabase/server'
import { SubjectDetailContent } from '@/components/dashboard/subject-detail-content'
import { notFound } from 'next/navigation'

interface SubjectDetailPageProps {
  params: Promise<{ subjectId: string }>
}

export default async function SubjectDetailPage({ params }: SubjectDetailPageProps) {
  const { subjectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let subject

  try {
    subject = await getSubjectWithChapters(subjectId)
  } catch {
    notFound()
  }

  return <SubjectDetailContent subject={subject} userId={user?.id} />
}
