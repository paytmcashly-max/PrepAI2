import { Suspense } from "react"
import { getPYQFilterData, getPYQQuestions } from "@/lib/queries/index"
import { PYQContent } from "@/components/dashboard/pyq-content"

export const metadata = {
  title: "Previous Year Questions | PrepTrack",
  description: "Practice with previous year questions from SSC CGL exams",
}

export default async function PYQPage() {
  const [questions, filterData] = await Promise.all([
    getPYQQuestions(),
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
