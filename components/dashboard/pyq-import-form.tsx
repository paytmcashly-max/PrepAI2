'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { ArrowLeft, ShieldAlert, Upload } from 'lucide-react'
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
import type { Chapter, Exam, Subject } from '@/lib/types'

interface PYQImportFormProps {
  exams: Exam[]
  subjects: Subject[]
  chapters: Chapter[]
  isAdmin: boolean
  isConfigured: boolean
}

type Source = 'ai_generated' | 'verified_pyq'

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
    source: 'verified_pyq' as Source,
    is_verified: true,
  })

  const filteredChapters = useMemo(() => chapters.filter((chapter) => {
    if (formData.exam_id && chapter.exam_id !== formData.exam_id) return false
    if (formData.subject_id && chapter.subject_id !== formData.subject_id) return false
    return true
  }), [chapters, formData.exam_id, formData.subject_id])

  const updateSource = (source: Source) => {
    setFormData((current) => ({
      ...current,
      source,
      is_verified: source === 'verified_pyq',
    }))
  }

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
          source: formData.source,
          is_verified: formData.is_verified,
        })
        toast.success('PYQ saved')
        setFormData((current) => ({
          ...current,
          question: '',
          options: '',
          answer: '',
          explanation: '',
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
          <p className="text-muted-foreground">Add verified previous-year questions or clearly unverified AI/demo questions.</p>
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
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Restricted import</AlertTitle>
          <AlertDescription>Your account is not configured as a PYQ import admin.</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Question Details</CardTitle>
          <CardDescription>Do not mark generated/demo questions as verified PYQs.</CardDescription>
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
              <SelectTrigger><SelectValue placeholder="Optional chapter" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No chapter</SelectItem>
                {filteredChapters.map((chapter) => <SelectItem key={chapter.id} value={chapter.id}>{chapter.name}</SelectItem>)}
              </SelectContent>
            </Select>
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
              <Select value={formData.source} onValueChange={(value) => updateSource(value as Source)}>
                <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="verified_pyq">Verified PYQ</SelectItem>
                  <SelectItem value="ai_generated">AI generated / demo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Explanation</Label>
            <Textarea value={formData.explanation} onChange={(event) => setFormData((current) => ({ ...current, explanation: event.target.value }))} className="min-h-24" />
          </div>

          <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
            <Checkbox checked={formData.is_verified} disabled={formData.source === 'ai_generated'} onCheckedChange={(checked) => setFormData((current) => ({ ...current, is_verified: Boolean(checked) }))} />
            <span>Verified previous-year paper question</span>
          </label>

          <Button onClick={submit} disabled={!isAdmin || isPending || !formData.question || !formData.answer}>
            <Upload className="mr-2 h-4 w-4" />
            {isPending ? 'Saving...' : 'Save PYQ'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
