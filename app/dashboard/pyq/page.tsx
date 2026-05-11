import { Suspense } from "react"
import { getPYQFilterData, getPYQQuestions } from "@/lib/queries/index"
import { PYQContent } from "@/components/dashboard/pyq-content"
import { createClient } from "@/lib/supabase/server"
import { isAdminEmail } from "@/lib/admin-auth"

export const metadata = {
  title: "Previous Year Questions | PrepTrack",
  description: "Practice with previous year questions from SSC CGL exams",
}

export default async function PYQPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isAdmin = isAdminEmail(user?.email)
  const [questions, filterData] = await Promise.all([
    getPYQQuestions({ includeAdminOnly: isAdmin }),
    getPYQFilterData(),
  ])

  return (
    <Suspense fallback={<PYQSkeleton />}>
      <PYQContent 
        questions={questions}
        exams={filterData.exams}
        subjects={filterData.subjects}
        chapters={filterData.chapters}
        years={filterData.years}
        isAdmin={isAdmin}
      />
    </Suspense>
  )
}

function PYQSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
      </div>
      <div className="flex gap-4">
        <div className="h-10 w-40 bg-muted animate-pulse rounded" />
        <div className="h-10 w-40 bg-muted animate-pulse rounded" />
        <div className="h-10 w-40 bg-muted animate-pulse rounded" />
      </div>
      <div className="grid gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  )
}
