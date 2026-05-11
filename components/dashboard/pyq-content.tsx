'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import {
  FileText, 
  Calendar, 
  BookOpen, 
  TrendingUp, 
  BarChart3,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  Filter,
  ChevronDown,
  ChevronUp,
  Upload,
  Flag,
  RotateCcw,
  XCircle,
} from 'lucide-react'
import { clearPYQAttempt, submitPYQAttempt, togglePYQRevisionMark } from '@/lib/actions'
import type { Chapter, Exam, PYQQuestion, PYQSource, Subject, UserPYQAttempt } from '@/lib/types'
import { cn } from '@/lib/utils'

interface PYQContentProps {
  questions: PYQQuestion[]
  exams: Exam[]
  subjects: Subject[]
  chapters: Chapter[]
  years: number[]
  isAdmin?: boolean
}

export function PYQContent({ questions, exams, subjects, chapters, years, isAdmin = false }: PYQContentProps) {
  const [isPending, startTransition] = useTransition()
  const [filterExam, setFilterExam] = useState<string>('all')
  const [filterYear, setFilterYear] = useState<string>('all')
  const [filterSubject, setFilterSubject] = useState<string>('all')
  const [filterChapter, setFilterChapter] = useState<string>('all')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')
  const [filterAttempt, setFilterAttempt] = useState<string>('all')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)
  const [pendingQuestionId, setPendingQuestionId] = useState<string | null>(null)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [mistakeNotes, setMistakeNotes] = useState<Record<string, string>>({})
  const [attemptsByQuestionId, setAttemptsByQuestionId] = useState<Record<string, UserPYQAttempt>>(() => (
    questions.reduce((acc, question) => {
      if (question.attempt) acc[question.id] = question.attempt
      return acc
    }, {} as Record<string, UserPYQAttempt>)
  ))

  const getAttempt = (question: PYQQuestion) => attemptsByQuestionId[question.id] || question.attempt || null

  const filteredChapters = chapters.filter((chapter) => {
    if (filterExam !== 'all' && chapter.exam_id !== filterExam) return false
    if (filterSubject !== 'all' && chapter.subject_id !== filterSubject) return false
    return true
  })

  const filteredQuestions = questions.filter(q => {
    if (filterExam !== 'all' && q.exam_id !== filterExam) return false
    if (filterYear !== 'all' && q.year !== parseInt(filterYear)) return false
    if (filterSubject !== 'all' && q.subject_id !== filterSubject) return false
    if (filterChapter !== 'all' && q.chapter_id !== filterChapter) return false
    if (filterDifficulty !== 'all' && q.difficulty !== filterDifficulty) return false
    if (verifiedOnly && !(q.source === 'verified_pyq' && q.is_verified)) return false
    if (!isAdmin && (q.verification_status === 'needs_manual_review' || q.verification_status === 'auto_rejected')) return false
    const attempt = getAttempt(q)
    if (filterAttempt === 'attempted' && !attempt?.selected_answer) return false
    if (filterAttempt === 'not_attempted' && attempt?.selected_answer) return false
    if (filterAttempt === 'incorrect' && attempt?.is_correct !== false) return false
    if (filterAttempt === 'marked' && !attempt?.marked_for_revision) return false
    return true
  })

  // Calculate stats
  const totalQuestions = questions.length
  const questionsByDifficulty = {
    easy: questions.filter(q => q.difficulty === 'easy').length,
    medium: questions.filter(q => q.difficulty === 'medium').length,
    hard: questions.filter(q => q.difficulty === 'hard').length,
  }

  const verifiedCount = questions.filter((question) => question.source === 'verified_pyq' && question.is_verified).length
  const uniqueTopics = new Set(questions.map(q => q.chapter_ref?.name || q.chapter || q.topic).filter(Boolean))

  // Get most frequent topics
  const topicFrequency = questions.reduce((acc, q) => {
    const topic = q.chapter_ref?.name || q.chapter || q.topic
    if (topic) {
      acc[topic] = (acc[topic] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  const topTopics = Object.entries(topicFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500/10 text-green-600 border-green-500/20'
      case 'medium':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
      case 'hard':
        return 'bg-red-500/10 text-red-600 border-red-500/20'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const normalizeAnswer = (value: string | null | undefined) => (value || '').trim().replace(/\s+/g, ' ').toLowerCase()

  const getAttemptStatus = (attempt: UserPYQAttempt | null) => {
    if (attempt?.marked_for_revision) {
      return {
        label: 'Marked for revision',
        className: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
      }
    }
    if (attempt?.is_correct === true) {
      return {
        label: 'Correct',
        className: 'border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300',
      }
    }
    if (attempt?.is_correct === false) {
      return {
        label: 'Incorrect',
        className: 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300',
      }
    }
    return {
      label: 'Not attempted',
      className: 'border-muted bg-muted text-muted-foreground',
    }
  }

  const handleActionError = (error: unknown) => {
    const message = error instanceof Error ? error.message : 'Something went wrong.'
    toast.error(message)
  }

  const handleSubmitAttempt = (question: PYQQuestion) => {
    const selectedAnswer = selectedAnswers[question.id] || getAttempt(question)?.selected_answer || ''
    if (!selectedAnswer.trim()) {
      toast.error('Select an option before submitting.')
      return
    }

    setPendingQuestionId(question.id)
    startTransition(() => {
      void (async () => {
        try {
          const attempt = await submitPYQAttempt(question.id, selectedAnswer, mistakeNotes[question.id])
          setAttemptsByQuestionId((current) => ({
            ...current,
            [question.id]: attempt as UserPYQAttempt,
          }))
          setExpandedQuestion(question.id)
          toast.success(attempt.is_correct ? 'Correct answer saved.' : 'Mistake saved for review.')
        } catch (error) {
          handleActionError(error)
        } finally {
          setPendingQuestionId(null)
        }
      })()
    })
  }

  const handleToggleRevision = (question: PYQQuestion) => {
    setPendingQuestionId(question.id)
    startTransition(() => {
      void (async () => {
        try {
          const attempt = await togglePYQRevisionMark(question.id)
          setAttemptsByQuestionId((current) => ({
            ...current,
            [question.id]: attempt as UserPYQAttempt,
          }))
          toast.success(attempt.marked_for_revision ? 'Marked for revision.' : 'Removed from revision.')
        } catch (error) {
          handleActionError(error)
        } finally {
          setPendingQuestionId(null)
        }
      })()
    })
  }

  const handleClearAttempt = (question: PYQQuestion) => {
    setPendingQuestionId(question.id)
    startTransition(() => {
      void (async () => {
        try {
          await clearPYQAttempt(question.id)
          setAttemptsByQuestionId((current) => {
            const next = { ...current }
            delete next[question.id]
            return next
          })
          setSelectedAnswers((current) => {
            const next = { ...current }
            delete next[question.id]
            return next
          })
          setMistakeNotes((current) => {
            const next = { ...current }
            delete next[question.id]
            return next
          })
          toast.success('PYQ attempt cleared.')
        } catch (error) {
          handleActionError(error)
        } finally {
          setPendingQuestionId(null)
        }
      })()
    })
  }

  const formatVerificationStatus = (status: string | null) => {
    if (!status) return null
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getSourceConfig = (source: PYQSource | null, isVerified: boolean, verificationStatus: string | null) => {
    if (source === 'verified_pyq' && isVerified) {
      return {
        label: 'Official Verified PYQ',
        helper: 'Official/question-paper verified',
        icon: ShieldCheck,
        className: 'gap-1 border-green-600/30 bg-green-600/10 text-green-700 dark:text-green-300',
      }
    }
    if (source === 'trusted_third_party') {
      const isSystemValidated = verificationStatus === 'system_validated'
      const isReviewed = verificationStatus === 'third_party_reviewed'
      const needsReview = verificationStatus === 'needs_manual_review' || verificationStatus === 'in_review'
      const isRejected = verificationStatus === 'auto_rejected'
      return {
        label: isSystemValidated
          ? 'System Validated Third-party Practice'
          : isReviewed
            ? 'Human Reviewed Third-party Practice'
            : isRejected
              ? 'Auto Rejected'
              : needsReview
                ? 'Needs Manual Review'
                : 'Third-party Practice / In Review',
        helper: isRejected ? 'Hidden from students; needs admin correction' : 'Not official verified',
        icon: isRejected ? ShieldAlert : BookOpen,
        className: isRejected
          ? 'gap-1 border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300'
          : needsReview
            ? 'gap-1 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
            : 'gap-1 border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300',
      }
    }
    if (source === 'memory_based') {
      return {
        label: 'Memory-based / Unofficial',
        helper: 'Memory-based/unofficial; do not treat as exact PYQ',
        icon: ShieldAlert,
        className: 'gap-1 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
      }
    }
    return {
      label: 'AI Practice',
      helper: 'Practice only; not a previous-year question',
      icon: Sparkles,
      className: 'gap-1 border-muted-foreground/30 bg-muted text-muted-foreground',
    }
  }

  return (
    <div className="space-y-5 p-4 sm:space-y-6 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">PYQ Practice</h1>
          <p className="break-words text-sm text-muted-foreground sm:text-base">Practice questions with clear source-trust labels</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Only verified_pyq questions should be treated as real previous-year questions.
          </p>
        </div>
        <Button asChild variant="outline" className="w-full sm:w-fit">
          <Link href="/dashboard/pyq/admin">
            <Upload className="mr-2 h-4 w-4" />
            Manual Import
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Total Questions</p>
                <p className="text-3xl font-bold mt-1">{totalQuestions}</p>
              </div>
              <div className="rounded-lg bg-blue-500/10 p-3">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Years Covered</p>
                <p className="text-3xl font-bold mt-1">{years.length}</p>
              </div>
              <div className="rounded-lg bg-green-500/10 p-3">
                <Calendar className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Official Verified</p>
                <p className="text-3xl font-bold mt-1">{verifiedCount}</p>
              </div>
              <div className="rounded-lg bg-amber-500/10 p-3">
                <BookOpen className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Topics</p>
                <p className="text-3xl font-bold mt-1">{uniqueTopics.size}</p>
              </div>
              <div className="rounded-lg bg-purple-500/10 p-3">
                <BarChart3 className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Difficulty Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Difficulty Distribution</CardTitle>
          <CardDescription>Questions breakdown by difficulty level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
            <div className="rounded-lg bg-green-500/10 p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{questionsByDifficulty.easy}</p>
              <p className="text-sm text-muted-foreground">Easy</p>
            </div>
            <div className="rounded-lg bg-amber-500/10 p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{questionsByDifficulty.medium}</p>
              <p className="text-sm text-muted-foreground">Medium</p>
            </div>
            <div className="rounded-lg bg-red-500/10 p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{questionsByDifficulty.hard}</p>
              <p className="text-sm text-muted-foreground">Hard</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-7">
            <div className="min-w-0">
              <label className="text-sm font-medium mb-2 block">Exam</label>
              <Select value={filterExam} onValueChange={(value) => {
                setFilterExam(value)
                setFilterChapter('all')
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select exam" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Exams</SelectItem>
                  {exams.map(exam => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-0">
              <label className="text-sm font-medium mb-2 block">Year</label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-0">
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <Select value={filterSubject} onValueChange={(value) => {
                setFilterSubject(value)
                setFilterChapter('all')
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-0">
              <label className="text-sm font-medium mb-2 block">Chapter</label>
              <Select value={filterChapter} onValueChange={setFilterChapter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select chapter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Chapters</SelectItem>
                  {filteredChapters.map(chapter => (
                    <SelectItem key={chapter.id} value={chapter.id}>
                      {chapter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-0">
              <label className="text-sm font-medium mb-2 block">Difficulty</label>
              <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-0">
              <label className="text-sm font-medium mb-2 block">Attempt</label>
              <Select value={filterAttempt} onValueChange={setFilterAttempt}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Attempt status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="attempted">Attempted</SelectItem>
                  <SelectItem value="not_attempted">Not Attempted</SelectItem>
                  <SelectItem value="incorrect">Incorrect</SelectItem>
                  <SelectItem value="marked">Marked Revision</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <label className="flex min-w-0 items-center gap-2 rounded-md border p-3 text-sm sm:items-end">
              <Checkbox checked={verifiedOnly} onCheckedChange={(checked) => setVerifiedOnly(Boolean(checked))} />
              <span className="leading-none">Official verified only</span>
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Questions List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex min-w-0 items-center justify-between">
            <h2 className="min-w-0 break-words text-xl font-bold">
              Questions
              <span className="text-muted-foreground font-normal ml-2">
                ({filteredQuestions.length} results)
              </span>
            </h2>
          </div>

          {filteredQuestions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Questions Found</h3>
                <p className="text-muted-foreground">
                  {questions.length === 0
                    ? 'No official verified PYQ bank has been imported yet. Add sourced questions through manual import when available.'
                    : 'Try adjusting your filters to see more questions.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredQuestions.map((question) => {
              const isExpanded = expandedQuestion === question.id
              const subjectName = question.subject?.name || 'General'
              const examName = question.exam?.name || question.exam_id || 'Exam'
              const chapterName = question.chapter_ref?.name || question.chapter || question.topic
              const sourceConfig = getSourceConfig(question.source, question.is_verified, question.verification_status)
              const SourceIcon = sourceConfig.icon
              const verificationStatusLabel = formatVerificationStatus(question.verification_status)
              const attempt = getAttempt(question)
              const attemptStatus = getAttemptStatus(attempt)
              const activeAnswer = selectedAnswers[question.id] || attempt?.selected_answer || ''
              const isQuestionPending = isPending && pendingQuestionId === question.id
              const showAnswerDetails = isExpanded || Boolean(attempt?.selected_answer)

              return (
                <Card key={question.id} className="overflow-hidden">
                  <CardContent className="p-4 sm:p-6">
                    <div className="mb-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <Badge variant="outline">{question.year}</Badge>
                        <Badge variant="outline">{examName}</Badge>
                        <Badge variant="secondary">{subjectName}</Badge>
                        {chapterName && (
                          <Badge variant="outline" className="max-w-full whitespace-normal break-words bg-muted/50 leading-relaxed">
                            {chapterName}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={sourceConfig.className}
                        >
                          <SourceIcon className="h-3 w-3" />
                          {sourceConfig.label}
                        </Badge>
                        <Badge variant="outline" className={cn('whitespace-normal break-words leading-relaxed', attemptStatus.className)}>
                          {attemptStatus.label}
                        </Badge>
                      </div>
                      <Badge className={cn('w-fit', getDifficultyColor(question.difficulty))}>
                        {question.difficulty}
                      </Badge>
                    </div>

                    <div className="mb-4">
                      <p className="break-words text-foreground leading-relaxed">{question.question}</p>
                    </div>

                    {question.options && question.options.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {question.options.map((option, idx) => {
                          const optionLetter = String.fromCharCode(65 + idx)
                          const isCorrectOption = normalizeAnswer(question.answer) === normalizeAnswer(option)
                            || normalizeAnswer(question.answer) === normalizeAnswer(optionLetter)
                          const isSelectedAttempt = attempt?.selected_answer
                            && normalizeAnswer(attempt.selected_answer) === normalizeAnswer(option)

                          return (
                            <button
                              key={idx}
                              type="button"
                              disabled={isQuestionPending}
                              onClick={() => setSelectedAnswers((current) => ({ ...current, [question.id]: option }))}
                              className={cn(
                                'flex w-full min-w-0 items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-70',
                                normalizeAnswer(activeAnswer) === normalizeAnswer(option) && 'border-primary bg-primary/10',
                                attempt?.selected_answer && isCorrectOption && 'border-green-500/50 bg-green-500/10',
                                attempt?.is_correct === false
                                  && isSelectedAttempt
                                  && !isCorrectOption
                                  && 'border-red-500/50 bg-red-500/10'
                              )}
                            >
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                {optionLetter}
                              </span>
                              <span className="min-w-0 break-words leading-relaxed text-foreground">{option}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}

                    <div className="mb-4 space-y-2">
                      <label className="text-sm font-medium">Mistake note</label>
                      <Textarea
                        value={mistakeNotes[question.id] ?? attempt?.mistake_note ?? ''}
                        onChange={(event) => setMistakeNotes((current) => ({ ...current, [question.id]: event.target.value }))}
                        placeholder="Optional: write what confused you or what to revise."
                        className="min-h-20 resize-y break-words leading-relaxed"
                      />
                    </div>

                    <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        {question.frequency > 1 && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            Appeared {question.frequency}x
                          </span>
                        )}
                        <span>{sourceConfig.helper}</span>
                        {question.source_reference && (
                          <span className="min-w-0 break-words">
                            Source: {question.source_reference}
                          </span>
                        )}
                        {question.source_name && (
                          <span className="min-w-0 break-words">
                            Source name: {question.source_name}
                          </span>
                        )}
                        {verificationStatusLabel && (
                          <span className="min-w-0 break-words">
                            Status: {verificationStatusLabel}
                          </span>
                        )}
                        {question.source_url && (
                          <span className="min-w-0 break-words">
                            Source URL: {question.source_url}
                          </span>
                        )}
                      </div>

                      <div className="flex w-full flex-col gap-2 sm:w-fit sm:flex-row sm:flex-wrap sm:justify-end">
                        <Button
                          size="sm"
                          onClick={() => handleSubmitAttempt(question)}
                          disabled={isQuestionPending || !activeAnswer.trim()}
                          className="w-full sm:w-fit"
                        >
                          Submit Answer
                        </Button>
                        <Button
                          variant={attempt?.marked_for_revision ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleToggleRevision(question)}
                          disabled={isQuestionPending}
                          className="w-full sm:w-fit"
                        >
                          <Flag className="h-4 w-4" />
                          {attempt?.marked_for_revision ? 'Marked' : 'Mark Revision'}
                        </Button>
                        {attempt && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleClearAttempt(question)}
                            disabled={isQuestionPending}
                            className="w-full sm:w-fit"
                          >
                            <RotateCcw className="h-4 w-4" />
                            Clear
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedQuestion(isExpanded ? null : question.id)}
                          className="w-full sm:w-fit"
                        >
                          {isExpanded ? (
                            <>
                              Hide Answer
                              <ChevronUp className="h-4 w-4" />
                            </>
                          ) : (
                            <>
                              Show Answer
                              <ChevronDown className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {attempt?.selected_answer && (
                      <div className={cn(
                        'mt-4 flex items-start gap-2 rounded-lg p-3',
                        attempt.is_correct
                          ? 'bg-green-500/10 text-green-700 dark:text-green-300'
                          : 'bg-red-500/10 text-red-700 dark:text-red-300'
                      )}>
                        {attempt.is_correct ? (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                        ) : (
                          <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium">{attempt.is_correct ? 'Correct attempt' : 'Incorrect attempt'}</p>
                          <p className="break-words text-sm leading-relaxed">
                            Selected: {attempt.selected_answer}
                          </p>
                          {attempt.mistake_note && (
                            <p className="mt-1 break-words text-sm leading-relaxed">
                              Note: {attempt.mistake_note}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {showAnswerDetails && (
                      <div className="mt-4 pt-4 border-t border-border space-y-3">
                        {question.answer && (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10">
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
                            <div className="min-w-0">
                              <p className="font-medium text-green-700 dark:text-green-400">
                                Correct Answer
                              </p>
                              <p className="break-words leading-relaxed text-foreground">{question.answer}</p>
                            </div>
                          </div>
                        )}
                        {question.explanation && (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10">
                            <HelpCircle className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
                            <div className="min-w-0">
                              <p className="font-medium text-blue-700 dark:text-blue-400">
                                Explanation
                              </p>
                              <p className="break-words leading-relaxed text-foreground">{question.explanation}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* Sidebar - Important Topics */}
        <div className="lg:col-span-1">
          <Card className="overflow-hidden lg:sticky lg:top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Hot Topics
              </CardTitle>
              <CardDescription>Most frequently asked topics</CardDescription>
            </CardHeader>
            <CardContent>
              {topTopics.length > 0 ? (
                <div className="space-y-3">
                  {topTopics.map(([topic, count], idx) => (
                    <button
                      key={topic}
                      onClick={() => {
                        // Clear other filters and filter by this topic somehow
                        // For now just show the topic info
                      }}
                      className="w-full rounded-lg bg-muted/50 p-3 text-left transition-colors hover:bg-muted"
                    >
                      <div className="flex min-w-0 items-center justify-between gap-3">
                        <span className="min-w-0 break-words text-sm font-medium">{topic}</span>
                        <Badge variant="secondary" className="text-xs">
                          {count}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No topics available
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
