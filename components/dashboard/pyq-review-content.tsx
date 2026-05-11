'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { ArrowLeft, CheckCircle2, ExternalLink, RotateCcw, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { updatePYQReviewStatus } from '@/lib/actions'
import type { PYQQuestion, PYQVerificationStatus } from '@/lib/types'

interface PYQReviewContentProps {
  questions: PYQQuestion[]
}

type ReviewAction = Extract<PYQVerificationStatus, 'in_review' | 'third_party_reviewed' | 'memory_based'>

function formatStatus(status: string | null) {
  if (!status) return 'Unknown'
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function QuestionReviewCard({ question }: { question: PYQQuestion }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pendingAction, setPendingAction] = useState<ReviewAction | null>(null)
  const isInReview = question.verification_status === 'in_review'
  const isReviewed = question.verification_status === 'third_party_reviewed'

  const runAction = (status: ReviewAction) => {
    setPendingAction(status)
    startTransition(async () => {
      try {
        await updatePYQReviewStatus(question.id, status)
        const label = status === 'third_party_reviewed'
          ? 'Marked as third-party reviewed'
          : status === 'memory_based'
            ? 'Reclassified as memory-based'
            : 'Sent back to in review'
        toast.success(label)
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not update PYQ review status')
      } finally {
        setPendingAction(null)
      }
    })
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Badge variant="outline">{question.year}</Badge>
              <Badge variant="outline" className="max-w-full whitespace-normal break-words">
                {question.exam?.name || question.exam_id || 'Exam'}
              </Badge>
              <Badge variant="secondary" className="max-w-full whitespace-normal break-words">
                {question.subject?.name || question.subject_id || 'Subject'}
              </Badge>
              {(question.chapter_ref?.name || question.chapter) && (
                <Badge variant="outline" className="max-w-full whitespace-normal break-words bg-muted/50">
                  {question.chapter_ref?.name || question.chapter}
                </Badge>
              )}
              <Badge variant={isReviewed ? 'default' : 'outline'} className="w-fit">
                {formatStatus(question.verification_status)}
              </Badge>
            </div>
            <CardTitle className="break-words text-lg leading-relaxed">
              {question.question}
            </CardTitle>
            <CardDescription className="break-words">
              Source trust review only. This workflow cannot mark a row as official verified PYQ.
            </CardDescription>
          </div>
          <Badge variant="outline" className="w-fit capitalize">{question.difficulty}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {question.options.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {question.options.map((option, index) => (
              <div key={`${question.id}-${index}`} className="flex min-w-0 gap-3 rounded-md border p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="min-w-0 break-words leading-relaxed">{option}</span>
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <div className="min-w-0 rounded-md bg-muted/50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Answer</p>
            <p className="mt-1 break-words leading-relaxed">{question.answer || 'Not provided'}</p>
          </div>
          <div className="min-w-0 rounded-md bg-muted/50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Explanation</p>
            <p className="mt-1 break-words leading-relaxed">{question.explanation || 'Not provided'}</p>
          </div>
        </div>

        <div className="grid gap-3 text-sm md:grid-cols-2">
          <div className="min-w-0">
            <p className="font-medium text-muted-foreground">Source name</p>
            <p className="break-words">{question.source_name || 'Not provided'}</p>
          </div>
          <div className="min-w-0">
            <p className="font-medium text-muted-foreground">Current status</p>
            <p className="break-words">{formatStatus(question.verification_status)}</p>
          </div>
          <div className="min-w-0 md:col-span-2">
            <p className="font-medium text-muted-foreground">Source reference</p>
            <p className="break-words leading-relaxed">{question.source_reference || 'Not provided'}</p>
          </div>
          {question.source_url && (
            <div className="min-w-0 md:col-span-2">
              <p className="font-medium text-muted-foreground">Source URL</p>
              <a
                href={question.source_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-w-0 items-center gap-1 break-all text-primary underline-offset-4 hover:underline"
              >
                <span className="min-w-0 break-all">{question.source_url}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:flex-wrap">
          {isInReview && (
            <>
              <Button
                type="button"
                onClick={() => runAction('third_party_reviewed')}
                disabled={isPending}
                className="w-full sm:w-fit"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {pendingAction === 'third_party_reviewed' ? 'Saving...' : 'Mark reviewed'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => runAction('memory_based')}
                disabled={isPending}
                className="w-full sm:w-fit"
              >
                <ShieldAlert className="mr-2 h-4 w-4" />
                {pendingAction === 'memory_based' ? 'Saving...' : 'Mark memory-based'}
              </Button>
            </>
          )}
          {isReviewed && (
            <Button
              type="button"
              variant="outline"
              onClick={() => runAction('in_review')}
              disabled={isPending}
              className="w-full sm:w-fit"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {pendingAction === 'in_review' ? 'Saving...' : 'Send back to in review'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function PYQReviewContent({ questions }: PYQReviewContentProps) {
  const inReview = useMemo(
    () => questions.filter((question) => question.verification_status === 'in_review'),
    [questions]
  )
  const reviewed = useMemo(
    () => questions.filter((question) => question.verification_status === 'third_party_reviewed'),
    [questions]
  )

  return (
    <div className="space-y-6 overflow-hidden p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <Button variant="ghost" size="sm" asChild className="mb-2 w-fit px-0">
            <Link href="/dashboard/pyq">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to PYQ
            </Link>
          </Button>
          <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">PYQ Review Queue</h1>
          <p className="break-words text-sm text-muted-foreground sm:text-base">
            Review third-party practice rows without promoting them to official verified PYQs.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Badge variant="outline" className="justify-center px-3 py-1.5">In review: {inReview.length}</Badge>
          <Badge variant="secondary" className="justify-center px-3 py-1.5">Reviewed: {reviewed.length}</Badge>
        </div>
      </div>

      <Alert className="border-amber-500/40 bg-amber-500/10">
        <ShieldAlert className="h-4 w-4 text-amber-500" />
        <AlertTitle>Trust boundary</AlertTitle>
        <AlertDescription className="break-words">
          This page only changes third-party practice review status. It never sets `source = verified_pyq` or `is_verified = true`.
        </AlertDescription>
      </Alert>

      <section className="space-y-4">
        <div className="min-w-0">
          <h2 className="break-words text-xl font-semibold">Needs Review</h2>
          <p className="break-words text-sm text-muted-foreground">
            Rows from trusted third-party sources that are still marked `in_review`.
          </p>
        </div>
        {inReview.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <h3 className="font-semibold">No third-party rows waiting for review</h3>
              <p className="mt-1 text-sm text-muted-foreground">New imported third-party practice rows will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          inReview.map((question) => <QuestionReviewCard key={question.id} question={question} />)
        )}
      </section>

      {reviewed.length > 0 && (
        <section className="space-y-4">
          <div className="min-w-0">
            <h2 className="break-words text-xl font-semibold">Reviewed Practice</h2>
            <p className="break-words text-sm text-muted-foreground">
              Admin-reviewed third-party practice rows. These are still not official verified PYQs.
            </p>
          </div>
          {reviewed.map((question) => <QuestionReviewCard key={question.id} question={question} />)}
        </section>
      )}
    </div>
  )
}
