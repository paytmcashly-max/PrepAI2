'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { BookOpen, Flag, RotateCcw, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { clearOriginalPracticeAttempt, explainOriginalPracticeMistake, submitOriginalPracticeAttempt, toggleOriginalPracticeRevisionMark } from '@/lib/actions'
import { normalizePYQAnswer, pyqAnswersMatch } from '@/lib/pyq-answer'
import type { Chapter, CoachActionResult, Exam, OriginalPracticeProgressSummary, OriginalPracticeQuestion, Subject } from '@/lib/types'
import { cn } from '@/lib/utils'

interface OriginalPracticeContentProps {
  questions: OriginalPracticeQuestion[]
  exams: Exam[]
  subjects: Subject[]
  chapters: Chapter[]
  progress: OriginalPracticeProgressSummary | null
}

function normalizeAnswer(value: string | null | undefined) {
  return normalizePYQAnswer(value).text
}

function getPracticeCategoryBadges(question: OriginalPracticeQuestion) {
  if (question.practice_category === 'study_method') {
    return {
      primary: 'Study Method Practice',
      secondary: 'Not Actual Current Affairs Fact MCQ',
      note: 'This checks how to study and revise current affairs. Actual monthly fact practice will appear only when verified/source-based content is added.',
    }
  }

  if (question.practice_category === 'fact_practice') {
    return {
      primary: 'Current Affairs Fact Practice',
      secondary: 'Source-based Practice',
      note: 'Current affairs fact practice should be based on explicit source data.',
    }
  }

  return {
    primary: 'PrepAI Original Practice',
    secondary: 'Not Official PYQ',
    note: 'PrepAI Original Practice - Not Official PYQ.',
  }
}

export function OriginalPracticeContent({ questions, exams, subjects, chapters, progress }: OriginalPracticeContentProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [coachPendingQuestionId, setCoachPendingQuestionId] = useState<string | null>(null)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [mistakeNotes, setMistakeNotes] = useState<Record<string, string>>({})
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)
  const [coachResponses, setCoachResponses] = useState<Record<string, CoachActionResult>>({})
  const [filterExam, setFilterExam] = useState(searchParams.get('exam') || 'all')
  const [filterSubject, setFilterSubject] = useState(searchParams.get('subject') || 'all')
  const [filterChapter, setFilterChapter] = useState(searchParams.get('chapter') || 'all')
  const [filterDifficulty, setFilterDifficulty] = useState(searchParams.get('difficulty') || 'all')
  const [filterAttempt, setFilterAttempt] = useState(searchParams.get('attempt') || 'all')
  const [attemptsByQuestionId, setAttemptsByQuestionId] = useState(() => (
    questions.reduce((acc, question) => {
      if (question.attempt) acc[question.id] = question.attempt
      return acc
    }, {} as Record<string, NonNullable<OriginalPracticeQuestion['attempt']>>)
  ))

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') params.delete(key)
    else params.set(key, value)
    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname, { scroll: false })
  }

  const getAttempt = (question: OriginalPracticeQuestion) => attemptsByQuestionId[question.id] || question.attempt || null
  const filteredChapters = chapters.filter((chapter) => {
    if (filterExam !== 'all' && chapter.exam_id !== filterExam) return false
    if (filterSubject !== 'all' && chapter.subject_id !== filterSubject) return false
    return true
  })
  const filteredQuestions = questions.filter((question) => {
    if (filterExam !== 'all' && question.exam_id !== filterExam) return false
    if (filterSubject !== 'all' && question.subject_id !== filterSubject) return false
    if (filterChapter !== 'all' && question.chapter_id !== filterChapter) return false
    if (filterDifficulty !== 'all' && question.difficulty !== filterDifficulty) return false
    const attempt = getAttempt(question)
    if (filterAttempt === 'attempted' && !attempt?.selected_answer) return false
    if (filterAttempt === 'not_attempted' && attempt?.selected_answer) return false
    if (filterAttempt === 'incorrect' && attempt?.is_correct !== false) return false
    if (filterAttempt === 'marked' && !attempt?.marked_for_revision) return false
    return true
  })

  const handleSubmit = (question: OriginalPracticeQuestion) => {
    const selectedAnswer = selectedAnswers[question.id] || getAttempt(question)?.selected_answer || ''
    if (!selectedAnswer.trim()) {
      toast.error('Select an option before submitting.')
      return
    }
    startTransition(async () => {
      try {
        const attempt = await submitOriginalPracticeAttempt(question.id, selectedAnswer, mistakeNotes[question.id])
        setAttemptsByQuestionId((current) => ({ ...current, [question.id]: attempt }))
        setExpandedQuestion(question.id)
        router.refresh()
        toast.success(attempt.is_correct ? 'Correct answer.' : 'Saved as incorrect for revision.')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not submit answer.')
      }
    })
  }

  const handleMark = (question: OriginalPracticeQuestion) => {
    startTransition(async () => {
      try {
        const attempt = await toggleOriginalPracticeRevisionMark(question.id)
        setAttemptsByQuestionId((current) => ({ ...current, [question.id]: attempt }))
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not update revision mark.')
      }
    })
  }

  const handleClear = (question: OriginalPracticeQuestion) => {
    if (getAttempt(question)?.mistake_note && !window.confirm('Clear this attempt and mistake note?')) return
    startTransition(async () => {
      try {
        await clearOriginalPracticeAttempt(question.id)
        setAttemptsByQuestionId((current) => {
          const next = { ...current }
          delete next[question.id]
          return next
        })
        router.refresh()
        toast.success('Attempt cleared.')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not clear attempt.')
      }
    })
  }

  const handleAskCoach = (question: OriginalPracticeQuestion) => {
    setCoachPendingQuestionId(question.id)
    startTransition(async () => {
      try {
        const response = await explainOriginalPracticeMistake(question.id)
        setCoachResponses((current) => ({ ...current, [question.id]: response }))
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Coach explanation failed.')
      } finally {
        setCoachPendingQuestionId(null)
      }
    })
  }

  return (
    <div className="space-y-5 overflow-hidden p-4 sm:space-y-6 sm:p-6">
      <div className="min-w-0">
        <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">PrepAI Original Practice</h1>
        <p className="break-words text-sm text-muted-foreground sm:text-base">Exam-style practice made by PrepAI. Not official previous-year questions.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Attempted</p><p className="text-2xl font-bold">{progress?.attemptedCount || 0}/{progress?.totalQuestions || questions.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Accuracy</p><p className="text-2xl font-bold">{progress?.accuracyPercentage || 0}%</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Incorrect</p><p className="text-2xl font-bold">{progress?.incorrectCount || 0}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Marked</p><p className="text-2xl font-bold">{progress?.markedForRevisionCount || 0}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Open task links prefill exam, subject, and chapter filters.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Select value={filterExam} onValueChange={(value) => { setFilterExam(value); updateParam('exam', value) }}>
            <SelectTrigger><SelectValue placeholder="Exam" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Exams</SelectItem>{exams.map((exam) => <SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filterSubject} onValueChange={(value) => { setFilterSubject(value); updateParam('subject', value) }}>
            <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Subjects</SelectItem>{subjects.map((subject) => <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filterChapter} onValueChange={(value) => { setFilterChapter(value); updateParam('chapter', value) }}>
            <SelectTrigger><SelectValue placeholder="Chapter" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Chapters</SelectItem>{filteredChapters.map((chapter) => <SelectItem key={chapter.id} value={chapter.id}>{chapter.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filterDifficulty} onValueChange={(value) => { setFilterDifficulty(value); updateParam('difficulty', value) }}>
            <SelectTrigger><SelectValue placeholder="Difficulty" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Levels</SelectItem><SelectItem value="easy">Easy</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="hard">Hard</SelectItem></SelectContent>
          </Select>
          <Select value={filterAttempt} onValueChange={(value) => { setFilterAttempt(value); updateParam('attempt', value) }}>
            <SelectTrigger><SelectValue placeholder="Attempt" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="attempted">Attempted</SelectItem><SelectItem value="not_attempted">Not attempted</SelectItem><SelectItem value="incorrect">Incorrect</SelectItem><SelectItem value="marked">Marked</SelectItem></SelectContent>
          </Select>
        </CardContent>
      </Card>

      {filteredQuestions.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><BookOpen /></EmptyMedia>
            <EmptyTitle>No original practice found</EmptyTitle>
            <EmptyDescription>Try a broader filter or open a Day 1 task with starter resources.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((question) => {
            const attempt = getAttempt(question)
            const activeAnswer = selectedAnswers[question.id] || attempt?.selected_answer || ''
            const isExpanded = expandedQuestion === question.id || Boolean(attempt?.selected_answer)
            const coach = coachResponses[question.id]
            const options = Array.isArray(question.options) ? question.options : []
            const categoryBadges = getPracticeCategoryBadges(question)
            return (
              <Card id={`opq-${question.id}`} key={question.id} className="overflow-hidden scroll-mt-6">
                <CardHeader>
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <Badge>{categoryBadges.primary}</Badge>
                    <Badge variant="outline">{categoryBadges.secondary}</Badge>
                    {categoryBadges.secondary !== 'Not Official PYQ' && <Badge variant="outline">Not Official PYQ</Badge>}
                    <Badge variant="secondary">{question.difficulty}</Badge>
                    {attempt?.is_correct === true && <Badge className="bg-green-500/10 text-green-600">Correct</Badge>}
                    {attempt?.is_correct === false && <Badge className="bg-red-500/10 text-red-600">Incorrect</Badge>}
                    {attempt?.marked_for_revision && <Badge className="bg-amber-500/10 text-amber-600">Marked</Badge>}
                  </div>
                  <CardTitle className="break-words text-base leading-relaxed">{question.question}</CardTitle>
                  <CardDescription className="break-words">{question.exam?.name || question.exam_id} - {question.subject?.name || question.subject_id}{question.chapter?.name ? ` - ${question.chapter.name}` : ''}</CardDescription>
                  {question.practice_category === 'study_method' && (
                    <p className="break-words text-xs leading-relaxed text-amber-600 dark:text-amber-300">
                      Actual monthly fact practice will appear only when verified/source-based content is added.
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {options.map((option, index) => {
                      const letter = String.fromCharCode(65 + index)
                      const isCorrectOption = pyqAnswersMatch(option, question.answer, options)
                      const isSelected = normalizeAnswer(activeAnswer) === normalizeAnswer(option)
                      return (
                        <button
                          key={`${question.id}-${index}`}
                          type="button"
                          disabled={isPending}
                          onClick={() => setSelectedAnswers((current) => ({ ...current, [question.id]: option }))}
                          className={cn(
                            'flex w-full min-w-0 items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 disabled:opacity-70',
                            isSelected && 'border-primary bg-primary/10',
                            attempt?.selected_answer && isCorrectOption && 'border-green-500/50 bg-green-500/10',
                            attempt?.is_correct === false && isSelected && !isCorrectOption && 'border-red-500/50 bg-red-500/10'
                          )}
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{letter}</span>
                          <span className="min-w-0 break-words leading-relaxed">{option}</span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mistake note</label>
                    <Textarea value={mistakeNotes[question.id] ?? attempt?.mistake_note ?? ''} onChange={(event) => setMistakeNotes((current) => ({ ...current, [question.id]: event.target.value }))} placeholder="Optional: write what confused you." />
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Button onClick={() => handleSubmit(question)} disabled={isPending || !activeAnswer.trim() || options.length === 0} className="w-full sm:w-fit">Submit Answer</Button>
                    <Button variant={attempt?.marked_for_revision ? 'default' : 'outline'} onClick={() => handleMark(question)} disabled={isPending} className="w-full sm:w-fit"><Flag className="h-4 w-4" />{attempt?.marked_for_revision ? 'Marked' : 'Mark Revision'}</Button>
                    {attempt && <Button variant="ghost" onClick={() => handleClear(question)} disabled={isPending} className="w-full sm:w-fit"><RotateCcw className="h-4 w-4" />Clear</Button>}
                    <Button variant="ghost" onClick={() => setExpandedQuestion(isExpanded ? null : question.id)} className="w-full sm:w-fit">{isExpanded ? 'Hide Answer' : 'Show Answer'}</Button>
                    {isExpanded && <Button variant="outline" onClick={() => handleAskCoach(question)} disabled={coachPendingQuestionId === question.id} className="w-full sm:w-fit"><Sparkles className="h-4 w-4" />{coachPendingQuestionId === question.id ? 'Asking...' : 'Ask Coach'}</Button>}
                  </div>

                  {isExpanded && (
                    <div className="rounded-lg border bg-muted/20 p-4">
                      <p className="font-medium">Answer: {question.answer}</p>
                      {question.explanation && <p className="mt-2 break-words text-sm leading-relaxed text-muted-foreground">{question.explanation}</p>}
                      <p className="mt-2 text-xs text-amber-600 dark:text-amber-300">{categoryBadges.note}</p>
                    </div>
                  )}

                  {(coachPendingQuestionId === question.id || coach) && (
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <p className="font-medium">Groq Coach</p>
                      {coachPendingQuestionId === question.id ? (
                        <p className="mt-2 text-sm text-muted-foreground">Preparing explanation...</p>
                      ) : (
                        <div className="mt-2 space-y-2">
                          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{coach?.explanation}</p>
                          {coach?.fallbackReason && <p className="text-xs text-muted-foreground">{coach.fallbackReason}</p>}
                          <p className="text-xs text-amber-600 dark:text-amber-300">{coach?.warning}</p>
                          <p className="text-xs text-muted-foreground">AI explains the stored PrepAI Original question; it does not verify any source.</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Button asChild variant="outline">
        <Link href="/dashboard/revision">Open revision queue</Link>
      </Button>
    </div>
  )
}
