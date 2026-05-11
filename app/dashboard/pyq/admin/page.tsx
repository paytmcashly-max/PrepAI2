import { createClient } from '@/lib/supabase/server'
import { getPYQFilterData } from '@/lib/queries'
import { PYQImportForm } from '@/components/dashboard/pyq-import-form'
import { getAdminEmails, isAdminEmail } from '@/lib/admin-auth'

export const metadata = {
  title: 'Manual PYQ Import | PrepTrack',
}

export default async function PYQAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const filterData = await getPYQFilterData()
  const adminEmails = getAdminEmails()
  const isAdmin = isAdminEmail(user?.email)

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
