import { createClient } from '@/lib/supabase/server'
import { getUserNotes, getSubjects } from '@/lib/queries'
import { NotesContent } from '@/components/dashboard/notes-content'

export default async function NotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const [notes, subjects] = await Promise.all([
    getUserNotes(user.id),
    getSubjects(),
  ])

  return <NotesContent notes={notes} subjects={subjects} />
}
