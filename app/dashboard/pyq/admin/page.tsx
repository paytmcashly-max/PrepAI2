import { createClient } from '@/lib/supabase/server'
import { getPYQFilterData } from '@/lib/queries'
import { PYQImportForm } from '@/components/dashboard/pyq-import-form'

export const metadata = {
  title: 'Manual PYQ Import | PrepTrack',
}

function getAdminEmails() {
  return (process.env.PYQ_ADMIN_EMAILS || process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export default async function PYQAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const filterData = await getPYQFilterData()
  const adminEmails = getAdminEmails()
  const isAdmin = Boolean(user?.email && adminEmails.includes(user.email.toLowerCase()))

  return (
    <PYQImportForm
      exams={filterData.exams}
      subjects={filterData.subjects}
      chapters={filterData.chapters}
      isAdmin={isAdmin}
      isConfigured={adminEmails.length > 0}
    />
  )
}
