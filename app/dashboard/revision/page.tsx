import { createClient } from '@/lib/supabase/server'
import { getRevisionQueue } from '@/lib/queries'
import { RevisionQueueContent } from '@/components/dashboard/revision-queue-content'

export const metadata = {
  title: 'Revision Queue | PrepTrack',
}

export default async function RevisionQueuePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const queue = await getRevisionQueue(user.id)
  return <RevisionQueueContent queue={queue} />
}
