import { createClient } from '@/lib/supabase/server'
import { getSubjects, getSubjectProgress } from '@/lib/queries'
import { SubjectsContent } from '@/components/dashboard/subjects-content'

export default async function SubjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const [subjects, progress] = await Promise.all([
    getSubjects(),
    getSubjectProgress(user.id),
  ])

  // Merge subjects with progress data
  const subjectsWithProgress = subjects.map(subject => {
    const progressData = progress.find(p => p.id === subject.id)
    return {
      ...subject,
      progress: progressData?.percentage || 0,
      completedTasks: progressData?.completedTasks || 0,
      totalTasks: progressData?.totalTasks || 0,
    }
  }).filter((subject) => subject.totalTasks > 0)

  return <SubjectsContent subjects={subjectsWithProgress} />
}
