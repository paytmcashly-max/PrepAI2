import { getOriginalPracticeFilterData, getOriginalPracticeProgressSummary, getOriginalPracticeQuestions } from '@/lib/queries'
import { createClient } from '@/lib/supabase/server'
import { OriginalPracticeContent } from '@/components/dashboard/original-practice-content'

export const metadata = {
  title: 'PrepAI Original Practice | PrepTrack',
}

export default async function OriginalPracticePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const examId = typeof params.exam === 'string' ? params.exam : undefined
  const subjectId = typeof params.subject === 'string' ? params.subject : undefined
  const chapterId = typeof params.chapter === 'string' ? params.chapter : undefined
  const difficulty = typeof params.difficulty === 'string' ? params.difficulty : undefined

  const [questions, filterData, progress] = await Promise.all([
    getOriginalPracticeQuestions({
      examId,
      subjectId,
      chapterId,
      difficulty,
      userId: user.id,
    }),
    getOriginalPracticeFilterData(),
    getOriginalPracticeProgressSummary(user.id),
  ])

  return (
    <OriginalPracticeContent
      questions={questions}
      exams={filterData.exams}
      subjects={filterData.subjects}
      chapters={filterData.chapters}
      progress={progress}
    />
  )
}
