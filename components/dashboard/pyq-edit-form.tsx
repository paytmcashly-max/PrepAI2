'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { ArrowLeft, Save, ShieldAlert, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { deletePYQQuestion, updatePYQQuestion } from '@/lib/actions'
import type { Chapter, Exam, PYQQuestion, PYQSource, PYQVerificationStatus, Subject } from '@/lib/types'

interface PYQEditFormProps {
  question: PYQQuestion
  exams: Exam[]
  subjects: Subject[]
  chapters: Chapter[]
}

type PYQDifficulty = PYQQuestion['difficulty']

const SOURCE_OPTIONS: Array<{ value: PYQSource; label: string; warning: string }> = [
  {
    value: 'verified_pyq',
    label: 'Official verified PYQ',
    warning: 'Only official/question-paper sources can be marked verified.',
  },
  {
    value: 'trusted_third_party',
    label: 'Third-party practice / in review',
    warning: 'Practice source only. This remains excluded from verified-only filters.',
  },
  {
    value: 'memory_based',
    label: 'Memory-based / unofficial',
    warning: 'Unofficial practice. Do not treat as exact PYQ.',
  },
  {
    value: 'ai_generated',
    label: 'AI-generated practice',
    warning: 'Practice only; not a previous-year question.',
  },
]

function statusesForSource(source: PYQSource): PYQVerificationStatus[] {
  if (source === 'verified_pyq') return ['official_verified']
  if (source === 'trusted_third_party') return ['in_review', 'third_party_reviewed']
  if (source === 'memory_based') return ['memory_based']
  return ['ai_practice']
}

function defaultStatusForSource(source: PYQSource): PYQVerificationStatus {
  return statusesForSource(source)[0]
}

function formatStatus(status: string) {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function PYQEditForm({ question, exams, subjects, chapters }: PYQEditFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()
  const [formData, setFormData] = useState({
    exam_id: question.exam_id || exams[0]?.id || '',
    year: String(question.year),
    subject_id: question.subject_id || subjects[0]?.id || '',
    chapter_id: question.chapter_id || '',
    difficulty: question.difficulty,
    question: question.question,
    options: (question.options || []).join('\n'),
    answer: question.answer || '',
    explanation: question.explanation || '',
    source_reference: question.source_reference || '',
    source_name: question.source_name || '',
    source_url: question.source_url || '',
    source: (question.source || 'ai_generated') as PYQSource,
    verification_status: (question.verification_status || 'ai_practice') as PYQVerificationStatus,
    review_note: question.review_note || '',
  })

  const filteredChapters = useMemo(() => chapters.filter((chapter) => {
    if (formData.exam_id && chapter.exam_id !== formData.exam_id) return false
    if (formData.subject_id && chapter.subject_id !== formData.subject_id) return false
    return true
  }), [chapters, formData.exam_id, formData.subject_id])

  const statusOptions = statusesForSource(formData.source)
  const selectedSourceOption = SOURCE_OPTIONS.find((option) => option.value === formData.source)
  const isVerifiedSource = formData.source === 'verified_pyq'
  const requiresSourceReference = formData.source !== 'ai_generated'
  const requiresSourceName = formData.source === 'trusted_third_party'
  const canSave = Boolean(
    !isPending
    && formData.exam_id
    && formData.subject_id
    && Number(formData.year) >= 1900
    && formData.question.trim()
    && formData.answer.trim()
    && (!isVerifiedSource || formData.chapter_id)
    && (!requiresSourceReference || formData.source_reference.trim())
    && (!requiresSourceName || formData.source_name.trim())
  )

  const updateSource = (source: PYQSource) => {
    setFormData((current) => ({
      ...current,
      source,
      verification_status: defaultStatusForSource(source),
    }))
  }

  const submit = () => {
    startTransition(async () => {
      try {
        await updatePYQQuestion(question.id, {
          exam_id: formData.exam_id,
          year: Number(formData.year),
          subject_id: formData.subject_id,
          chapter_id: formData.chapter_id || null,
          difficulty: formData.difficulty,
          question: formData.question,
          options: formData.options.split('\n').map((option) => option.trim()).filter(Boolean),
          answer: formData.answer,
          explanation: formData.explanation || null,
          source_reference: formData.source_reference || null,
          source_name: formData.source_name || null,
          source_url: formData.source_url || null,
          source: formData.source,
          verification_status: formData.verification_status,
          review_note: formData.review_note || null,
          is_verified: formData.source === 'verified_pyq',
        })
        toast.success('PYQ updated')
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not update PYQ')
      }
    })
  }

  const deleteQuestion = () => {
    startDeleteTransition(async () => {
      try {
        await deletePYQQuestion(question.id)
        toast.success('PYQ deleted')
        router.push('/dashboard/pyq/review')
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not delete PYQ')
      }
    })
  }

  return (
    <div className="space-y-6 overflow-hidden p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <Button variant="ghost" size="sm" asChild className="w-fit px-0">
            <Link href="/dashboard/pyq/review">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to review queue
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">Edit PYQ Practice Row</h1>
            <p className="break-words text-sm text-muted-foreground sm:text-base">
              Correct source metadata, content, and review notes without bypassing trust rules.
            </p>
          </div>
        </div>
        <Badge variant={question.is_verified ? 'default' : 'outline'} className="w-fit">
          {question.is_verified ? 'Verified row' : 'Unverified practice'}
        </Badge>
      </div>

      <Alert className="border-amber-500/40 bg-amber-500/10">
        <ShieldAlert className="h-4 w-4 text-amber-500" />
        <AlertTitle>Correction safety</AlertTitle>
        <AlertDescription className="break-words">
          This form enforces source-specific rules server-side. Third-party and memory-based rows are always saved with `is_verified = false`.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Question Details</CardTitle>
          <CardDescription className="break-words">Update exam mapping, source trust, and content.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="exam">Exam</Label>
              <Select value={formData.exam_id} onValueChange={(value) => setFormData((current) => ({ ...current, exam_id: value, chapter_id: '' }))}>
                <SelectTrigger id="exam"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {exams.map((exam) => <SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select value={formData.subject_id} onValueChange={(value) => setFormData((current) => ({ ...current, subject_id: value, chapter_id: '' }))}>
                <SelectTrigger id="subject"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="chapter">Chapter</Label>
              <Select value={formData.chapter_id || 'none'} onValueChange={(value) => setFormData((current) => ({ ...current, chapter_id: value === 'none' ? '' : value }))}>
                <SelectTrigger id="chapter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No chapter</SelectItem>
                  {filteredChapters.map((chapter) => <SelectItem key={chapter.id} value={chapter.id}>{chapter.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input id="year" type="number" min="1900" max="2100" value={formData.year} onChange={(event) => setFormData((current) => ({ ...current, year: event.target.value }))} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select value={formData.difficulty} onValueChange={(value) => setFormData((current) => ({ ...current, difficulty: value as PYQDifficulty }))}>
                <SelectTrigger id="difficulty"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Select value={formData.source} onValueChange={(value) => updateSource(value as PYQSource)}>
                <SelectTrigger id="source"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="verification_status">Verification Status</Label>
              <Select value={formData.verification_status} onValueChange={(value) => setFormData((current) => ({ ...current, verification_status: value as PYQVerificationStatus }))}>
                <SelectTrigger id="verification_status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => <SelectItem key={status} value={status}>{formatStatus(status)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedSourceOption && (
            <Alert>
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>{selectedSourceOption.label}</AlertTitle>
              <AlertDescription>{selectedSourceOption.warning}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="question">Question</Label>
            <Textarea id="question" rows={5} value={formData.question} onChange={(event) => setFormData((current) => ({ ...current, question: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="options">Options, one per line</Label>
            <Textarea id="options" rows={5} value={formData.options} onChange={(event) => setFormData((current) => ({ ...current, options: event.target.value }))} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="answer">Answer</Label>
              <Textarea id="answer" rows={4} value={formData.answer} onChange={(event) => setFormData((current) => ({ ...current, answer: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="explanation">Explanation</Label>
              <Textarea id="explanation" rows={4} value={formData.explanation} onChange={(event) => setFormData((current) => ({ ...current, explanation: event.target.value }))} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="source_name">Source Name</Label>
              <Input id="source_name" value={formData.source_name} onChange={(event) => setFormData((current) => ({ ...current, source_name: event.target.value }))} placeholder="Testbook, official board, etc." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source_url">Source URL</Label>
              <Input id="source_url" value={formData.source_url} onChange={(event) => setFormData((current) => ({ ...current, source_url: event.target.value }))} placeholder="https://..." />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="source_reference">Source Reference</Label>
            <Textarea id="source_reference" rows={3} value={formData.source_reference} onChange={(event) => setFormData((current) => ({ ...current, source_reference: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="review_note">Review Note</Label>
            <Textarea id="review_note" rows={3} value={formData.review_note} onChange={(event) => setFormData((current) => ({ ...current, review_note: event.target.value }))} placeholder="What changed, why, and what still needs verification." />
          </div>

          <div className="flex flex-col gap-2 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" onClick={submit} disabled={!canSave} className="w-full sm:w-fit">
              <Save className="mr-2 h-4 w-4" />
              {isPending ? 'Saving...' : 'Save corrections'}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" disabled={isDeleting} className="w-full sm:w-fit">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete bad row
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this PYQ row?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This is only for bad imports or duplicates. The row will be removed from PYQ pages and admin debug counts.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteQuestion} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {isDeleting ? 'Deleting...' : 'Delete row'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
