import { createClient } from '@/lib/supabase/server'
import { getBacklogData } from '@/lib/queries'
import { BacklogContent } from '@/components/dashboard/backlog-content'

export const metadata = {
  title: 'Backlog Manager | PrepTrack',
}

export default async function BacklogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const backlog = await getBacklogData(user.id)
  return <BacklogContent backlog={backlog} />
}
