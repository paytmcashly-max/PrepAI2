import { createClient } from '@/lib/supabase/server'
import { getUserNotes, getSubjects } from '@/lib/queries'
import { NotesContent } from '@/components/dashboard/notes-content'

export default async function NotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const [notes, subjects, chaptersResult] = await Promise.all([
    getUserNotes(user.id),
    getSubjects(),
    supabase
      .from('chapters')
      .select('id, exam_id, subject_id, name, priority, difficulty, estimated_minutes, order_index, created_at')
      .order('order_index'),
  ])

  return <NotesContent notes={notes} subjects={subjects} chapters={chaptersResult.data || []} />
}
