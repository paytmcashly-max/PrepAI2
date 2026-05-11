'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { ArrowLeft, CheckCircle2, ShieldAlert, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createPYQQuestion } from '@/lib/actions'
import type { Chapter, Exam, PYQSource, Subject } from '@/lib/types'

interface PYQImportFormProps {
  exams: Exam[]
  subjects: Subject[]
  chapters: Chapter[]
  isAdmin: boolean
  isConfigured: boolean
}

const SOURCE_OPTIONS: Array<{
  value: PYQSource
  label: string
  warning: string
}> = [
  {
    value: 'verified_pyq',
    label: 'Official verified PYQ',
    warning: 'Only official/question-paper sources can be marked verified.',
  },
  {
    value: 'trusted_third_party',
    label: 'Trusted third-party practice',
    warning: 'Useful for practice, but not official verified PYQ.',
  },
  {
    value: 'memory_based',
    label: 'Memory-based / unofficial',
    warning: 'Memory-based/unofficial; do not treat as exact PYQ.',
  },
  {
    value: 'ai_generated',
    label: 'AI-generated practice',
    warning: 'Practice only; not a previous-year question.',
  },
]

export function PYQImportForm({ exams, subjects, chapters, isAdmin, isConfigured }: PYQImportFormProps) {
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    exam_id: exams[0]?.id || '',
    year: String(new Date().getFullYear()),
    subject_id: subjects[0]?.id || '',
    chapter_id: '',
    difficulty: 'medium',
    question: '',
    options: '',
    answer: '',
    explanation: '',
    source_reference: '',
    source_name: '',
    source_url: '',
    source: 'verified_pyq' as PYQSource,
    is_verified: true,
  })

  const filteredChapters = useMemo(() => chapters.filter((chapter) => {
    if (formData.exam_id && chapter.exam_id !== formData.exam_id) return false
    if (formData.subject_id && chapter.subject_id !== formData.subject_id) return false
    return true
  }), [chapters, formData.exam_id, formData.subject_id])

  const updateSource = (source: PYQSource) => {
    setFormData((current) => ({
      ...current,
      source,
      is_verified: source === 'verified_pyq',
    }))
  }

  const isVerifiedSource = formData.source === 'verified_pyq'
  const requiresSourceReference = formData.source !== 'ai_generated'
  const requiresSourceName = formData.source === 'trusted_third_party'
  const selectedSourceOption = SOURCE_OPTIONS.find((option) => option.value === formData.source)
  const canSubmit = Boolean(
    isAdmin
    && !isPending
    && formData.exam_id
    && formData.subject_id
    && formData.question.trim()
    && formData.answer.trim()
    && (!isVerifiedSource || formData.chapter_id)
    && (!requiresSourceReference || formData.source_reference.trim())
    && (!requiresSourceName || formData.source_name.trim())
  )

  const submit = () => {
    startTransition(async () => {
      try {
        await createPYQQuestion({
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
          is_verified: formData.source === 'verified_pyq',
        })
        toast.success('PYQ saved')
        setFormData((current) => ({
          ...current,
          question: '',
          options: '',
          answer: '',
          explanation: '',
          source_reference: '',
          source_name: '',
          source_url: '',
        }))
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not save PYQ')
      }
    })
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/pyq">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manual PYQ Import</h1>
          <p className="text-muted-foreground">Add official verified PYQs or clearly marked practice questions by source trust level.</p>
        </div>
      </div>

      {!isConfigured && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Admin allowlist is not configured</AlertTitle>
          <AlertDescription>Set PYQ_ADMIN_EMAILS or ADMIN_EMAILS before importing PYQs.</AlertDescription>
        </Alert>
      )}

      {isConfigured && !isAdmin && (
        <Card>
          <CardContent className="py-10">
            <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-center">
              <div className="rounded-full bg-destructive/10 p-3 text-destructive">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Restricted access</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your account is not configured as a PYQ import admin. You can still review PYQs from the main practice page.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="/dashboard/pyq">Back to PYQ Practice</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isAdmin && isConfigured && (
        <>
        <Alert className="border-amber-500/40 bg-amber-500/10">
          <ShieldAlert className="h-4 w-4 text-amber-500" />
          <AlertTitle>PYQ source trust rule</AlertTitle>
          <AlertDescription>
            Only questions verified from official/question-paper source should be marked verified. Third-party, memory-based, and AI practice rows must stay unverified.
          </AlertDescription>
        </Alert>

        <Card>
        <CardHeader>
          <CardTitle>Import Checklist</CardTitle>
          <CardDescription>Use this before saving a manual PYQ record.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2">
          {[
            'Official verified PYQs are copied from an official or exact question-paper source.',
            'Third-party candidate PDFs are practice/in-review unless officially matched.',
            'Memory-based sources are unofficial and must stay unverified.',
            'AI/demo questions are practice only and are never previous-year questions.',
            'Exam, year, subject, and chapter match the paper.',
            'Answer and explanation have been reviewed manually.',
            'Source reference names the paper, shift, set, URL, or document location.',
          ].map((item) => (
            <div key={item} className="flex min-w-0 items-start gap-2 rounded-lg border p-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              <span className="min-w-0 break-words leading-relaxed">{item}</span>
            </div>
          ))}
        </CardContent>
        </Card>

        <Card>
        <CardHeader>
          <CardTitle>Question Details</CardTitle>
          <CardDescription>Source trust controls how the question is displayed and whether it can ever be treated as official.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="grid gap-2">
              <Label>Exam</Label>
              <Select value={formData.exam_id} onValueChange={(value) => setFormData((current) => ({ ...current, exam_id: value, chapter_id: '' }))}>
                <SelectTrigger><SelectValue placeholder="Exam" /></SelectTrigger>
                <SelectContent>
                  {exams.map((exam) => <SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Year</Label>
              <Input type="number" min={1900} max={2100} value={formData.year} onChange={(event) => setFormData((current) => ({ ...current, year: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Subject</Label>
              <Select value={formData.subject_id} onValueChange={(value) => setFormData((current) => ({ ...current, subject_id: value, chapter_id: '' }))}>
                <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Difficulty</Label>
              <Select value={formData.difficulty} onValueChange={(value) => setFormData((current) => ({ ...current, difficulty: value }))}>
                <SelectTrigger><SelectValue placeholder="Difficulty" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Chapter</Label>
            <Select value={formData.chapter_id || 'none'} onValueChange={(value) => setFormData((current) => ({ ...current, chapter_id: value === 'none' ? '' : value }))}>
              <SelectTrigger><SelectValue placeholder={isVerifiedSource ? 'Required chapter' : 'Optional chapter'} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none" disabled={isVerifiedSource}>
                  {isVerifiedSource ? 'Select a chapter' : 'No chapter'}
                </SelectItem>
                {filteredChapters.map((chapter) => <SelectItem key={chapter.id} value={chapter.id}>{chapter.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {isVerifiedSource && (
              <p className="text-xs text-muted-foreground">Verified PYQs must be linked to the exact chapter.</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Question</Label>
            <Textarea value={formData.question} onChange={(event) => setFormData((current) => ({ ...current, question: event.target.value }))} className="min-h-28" />
          </div>

          <div className="grid gap-2">
            <Label>Options</Label>
            <Textarea value={formData.options} onChange={(event) => setFormData((current) => ({ ...current, options: event.target.value }))} placeholder="One option per line" className="min-h-28" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Answer</Label>
              <Input value={formData.answer} onChange={(event) => setFormData((current) => ({ ...current, answer: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Source</Label>
              <Select value={formData.source} onValueChange={(value) => updateSource(value as PYQSource)}>
                <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedSourceOption && (
            <Alert className={isVerifiedSource ? 'border-green-500/40 bg-green-500/10' : 'border-amber-500/40 bg-amber-500/10'}>
              <ShieldAlert className={isVerifiedSource ? 'h-4 w-4 text-green-600' : 'h-4 w-4 text-amber-500'} />
              <AlertTitle>{selectedSourceOption.label}</AlertTitle>
              <AlertDescription>{selectedSourceOption.warning}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Label>Explanation</Label>
            <Textarea value={formData.explanation} onChange={(event) => setFormData((current) => ({ ...current, explanation: event.target.value }))} className="min-h-24" />
          </div>

          <div className="grid gap-2">
            <Label>Source reference</Label>
            <Input
              value={formData.source_reference}
              onChange={(event) => setFormData((current) => ({ ...current, source_reference: event.target.value }))}
              placeholder="Official paper name, shift, set, URL, or document location"
            />
            <p className="text-xs text-muted-foreground">
              Required for official verified, trusted third-party, and memory-based sources. Optional for AI practice.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Source name</Label>
              <Input
                value={formData.source_name}
                onChange={(event) => setFormData((current) => ({ ...current, source_name: event.target.value }))}
                placeholder="Official SSC, UPPRPB, Testbook, etc."
              />
              <p className="text-xs text-muted-foreground">Required for trusted third-party practice.</p>
            </div>
            <div className="grid gap-2">
              <Label>Source URL</Label>
              <Input
                value={formData.source_url}
                onChange={(event) => setFormData((current) => ({ ...current, source_url: event.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>

          <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
            <Checkbox checked={formData.source === 'verified_pyq'} disabled />
            <span>{formData.source === 'verified_pyq' ? 'Will be saved as official verified PYQ' : 'Will be saved as unverified practice'}</span>
          </label>

          <Button onClick={submit} disabled={!canSubmit}>
            <Upload className="mr-2 h-4 w-4" />
            {isPending ? 'Saving...' : 'Save PYQ'}
          </Button>
        </CardContent>
        </Card>
        </>
      )}
    </div>
  )
}
