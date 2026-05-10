'use client'

import { useMemo, useState, useTransition } from 'react'
import { format } from 'date-fns'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ClipboardList,
  Plus,
  Target,
  TrendingUp,
  AlertTriangle,
  FileText,
  Ban,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createMockResult } from '@/lib/actions'
import { todayLocalDateString } from '@/lib/date-utils'
import type { Exam, MockTest } from '@/lib/types'

interface MockTestsContentProps {
  mockTests: MockTest[]
  mockResults: MockTest[]
  exams: Exam[]
}

type MockResultForm = {
  exam_id: string
  test_date: string
  total_marks: string
  marks_obtained: string
  weak_areas: string
  mistakes: string
  notes: string
}

function scoreFor(result: MockTest) {
  if (!result.total_marks || result.total_marks <= 0 || result.marks_obtained === null || result.marks_obtained === undefined) {
    return 0
  }

  return Math.round((result.marks_obtained / result.total_marks) * 100)
}

export function MockTestsContent({ mockTests, mockResults: initialResults, exams }: MockTestsContentProps) {
  const [mockResults, setMockResults] = useState(initialResults)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<MockResultForm>({
    exam_id: exams[0]?.id || '',
    test_date: todayLocalDateString(),
    total_marks: '',
    marks_obtained: '',
    weak_areas: '',
    mistakes: '',
    notes: '',
  })

  const completedResults = mockResults.filter((result) => result.total_marks && result.marks_obtained !== null)
  const avgScore = completedResults.length
    ? Math.round(completedResults.reduce((sum, result) => sum + scoreFor(result), 0) / completedResults.length)
    : 0
  const bestScore = completedResults.length ? Math.max(...completedResults.map(scoreFor)) : 0

  const scoreData = [...completedResults]
    .sort((a, b) => String(a.test_date || a.created_at).localeCompare(String(b.test_date || b.created_at)))
    .slice(-10)
    .map((result, index) => ({
      test: `Test ${index + 1}`,
      score: scoreFor(result),
      date: result.test_date ? format(new Date(result.test_date), 'MMM d') : 'N/A',
    }))

  const weakAreaData = useMemo(() => {
    const counts = new Map<string, number>()
    for (const result of mockResults) {
      for (const area of result.weak_areas || []) {
        counts.set(area, (counts.get(area) || 0) + 1)
      }
    }

    return [...counts.entries()]
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [mockResults])

  const resetForm = () => {
    setFormData({
      exam_id: exams[0]?.id || '',
      test_date: todayLocalDateString(),
      total_marks: '',
      marks_obtained: '',
      weak_areas: '',
      mistakes: '',
      notes: '',
    })
    setError(null)
  }

  const handleCreateResult = () => {
    setError(null)
    startTransition(async () => {
      try {
        const result = await createMockResult({
          exam_id: formData.exam_id,
          test_date: formData.test_date,
          total_marks: Number(formData.total_marks),
          marks_obtained: Number(formData.marks_obtained),
          weak_areas: formData.weak_areas.split(',').map((area) => area.trim()).filter(Boolean),
          mistakes: formData.mistakes.trim() || null,
          notes: formData.notes.trim() || null,
        })
        setMockResults((current) => [result, ...current])
        setIsCreateOpen(false)
        resetForm()
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Could not save mock result.')
      }
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mock Tests</h1>
          <p className="text-muted-foreground">Log mock scores, track weak areas, and monitor improvement.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Mock Result
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add mock result</DialogTitle>
              <DialogDescription>Save a completed test score and the areas that need revision.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Exam</Label>
                  <Select value={formData.exam_id} onValueChange={(value) => setFormData((current) => ({ ...current, exam_id: value }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select exam" />
                    </SelectTrigger>
                    <SelectContent>
                      {exams.map((exam) => (
                        <SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="test_date">Test date</Label>
                  <Input
                    id="test_date"
                    type="date"
                    value={formData.test_date}
                    onChange={(event) => setFormData((current) => ({ ...current, test_date: event.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="total_marks">Total marks</Label>
                  <Input
                    id="total_marks"
                    type="number"
                    min="1"
                    value={formData.total_marks}
                    onChange={(event) => setFormData((current) => ({ ...current, total_marks: event.target.value }))}
                    placeholder="Example: 100"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="marks_obtained">Marks obtained</Label>
                  <Input
                    id="marks_obtained"
                    type="number"
                    min="0"
                    value={formData.marks_obtained}
                    onChange={(event) => setFormData((current) => ({ ...current, marks_obtained: event.target.value }))}
                    placeholder="Example: 72"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="weak_areas">Weak areas</Label>
                <Input
                  id="weak_areas"
                  value={formData.weak_areas}
                  onChange={(event) => setFormData((current) => ({ ...current, weak_areas: event.target.value }))}
                  placeholder="Percentage, Polity, Hindi Grammar"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mistakes">Mistakes</Label>
                <Textarea
                  id="mistakes"
                  value={formData.mistakes}
                  onChange={(event) => setFormData((current) => ({ ...current, mistakes: event.target.value }))}
                  placeholder="What went wrong in this mock?"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(event) => setFormData((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="What should you revise next?"
                />
              </div>
              {error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleCreateResult} disabled={isPending || !formData.exam_id || !formData.total_marks || !formData.marks_obtained}>
                {isPending ? 'Saving...' : 'Save Result'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tests Logged</p>
                <p className="mt-1 text-3xl font-bold">{completedResults.length}</p>
              </div>
              <Target className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                <p className="mt-1 text-3xl font-bold">{avgScore}%</p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Best Score</p>
                <p className="mt-1 text-3xl font-bold">{bestScore}%</p>
              </div>
              <ClipboardList className="h-6 w-6 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Weak Areas</p>
                <p className="mt-1 text-3xl font-bold">{weakAreaData.length}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Score Trend</CardTitle>
            <CardDescription>Your last logged mock results.</CardDescription>
          </CardHeader>
          <CardContent>
            {scoreData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={scoreData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[260px] flex-col items-center justify-center rounded-lg border border-dashed text-center">
                <FileText className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="font-medium">No score trend yet</p>
                <p className="text-sm text-muted-foreground">Add a mock result to start tracking.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weak Area Frequency</CardTitle>
            <CardDescription>Topics that appear repeatedly in your mistakes.</CardDescription>
          </CardHeader>
          <CardContent>
            {weakAreaData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={weakAreaData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="area" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[260px] flex-col items-center justify-center rounded-lg border border-dashed text-center">
                <AlertTriangle className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="font-medium">No weak areas logged</p>
                <p className="text-sm text-muted-foreground">Add weak topics when saving a mock result.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Mock History</CardTitle>
          <CardDescription>Manual score log for your exam practice.</CardDescription>
        </CardHeader>
        <CardContent>
          {mockResults.length > 0 ? (
            <div className="space-y-3">
              {mockResults.slice(0, 8).map((result) => (
                <div key={result.id} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{result.title}</h3>
                        <Badge variant="secondary">{scoreFor(result)}%</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {result.test_date ? format(new Date(result.test_date), 'MMM d, yyyy') : 'No date'} - {result.marks_obtained}/{result.total_marks} marks
                      </p>
                      {(result.weak_areas || []).length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(result.weak_areas || []).map((area) => (
                            <Badge key={area} variant="outline">{area}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="max-w-xl text-sm text-muted-foreground">
                      {result.mistakes && <p><span className="font-medium text-foreground">Mistakes:</span> {result.mistakes}</p>}
                      {result.notes && <p className="mt-1"><span className="font-medium text-foreground">Notes:</span> {result.notes}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed py-12 text-center">
              <ClipboardList className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="font-semibold">No mock results yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Use Add Mock Result after your next practice test.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Practice Test Sets</CardTitle>
          <CardDescription>Question-set attempts stay disabled until verified test content is added.</CardDescription>
        </CardHeader>
        <CardContent>
          {mockTests.length > 0 ? (
            <div className="space-y-3">
              {mockTests.map((test) => (
                <div key={test.id} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="font-semibold">{test.title}</h3>
                    {test.description && <p className="text-sm text-muted-foreground">{test.description}</p>}
                    <p className="mt-1 text-sm text-muted-foreground">{test.total_questions} questions - {test.duration_minutes || 0} min</p>
                  </div>
                  <Button variant="outline" disabled>
                    <Ban className="mr-2 h-4 w-4" />
                    Question set pending
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed py-10 text-center">
              <Ban className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <h3 className="font-semibold">No verified mock sets yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Track scores manually until verified question sets are added.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
