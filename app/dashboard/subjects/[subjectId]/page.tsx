import { getSubjectWithChapters } from '@/lib/queries/subjects'
import { SubjectDetailContent } from '@/components/dashboard/subject-detail-content'
import { notFound } from 'next/navigation'

interface SubjectDetailPageProps {
  params: Promise<{ subjectId: string }>
}

export default async function SubjectDetailPage({ params }: SubjectDetailPageProps) {
  const { subjectId } = await params
  const data = await getSubjectWithChapters(subjectId)
  
  if (!data?.subject) {
    notFound()
  }
  
  return <SubjectDetailContent subject={data.subject} userId={data.userId} />
}
