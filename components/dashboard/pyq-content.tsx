'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
  ShieldCheck,
  Sparkles,
  HelpCircle,
  Filter,
  ChevronDown,
  ChevronUp,
  Upload,
} from 'lucide-react'
import type { Chapter, Exam, PYQQuestion, Subject } from '@/lib/types'
import { cn } from '@/lib/utils'

interface PYQContentProps {
  questions: PYQQuestion[]
  exams: Exam[]
  subjects: Subject[]
  chapters: Chapter[]
  years: number[]
}

export function PYQContent({ questions, exams, subjects, chapters, years }: PYQContentProps) {
  const [filterExam, setFilterExam] = useState<string>('all')
  const [filterYear, setFilterYear] = useState<string>('all')
  const [filterSubject, setFilterSubject] = useState<string>('all')
  const [filterChapter, setFilterChapter] = useState<string>('all')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)

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
    if (verifiedOnly && !q.is_verified) return false
    return true
  })

  // Calculate stats
  const totalQuestions = questions.length
  const questionsByDifficulty = {
    easy: questions.filter(q => q.difficulty === 'easy').length,
    medium: questions.filter(q => q.difficulty === 'medium').length,
    hard: questions.filter(q => q.difficulty === 'hard').length,
  }

  const verifiedCount = questions.filter((question) => question.is_verified).length
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PYQ Practice</h1>
          <p className="text-muted-foreground">Practice verified and clearly marked unverified previous-year questions</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Only verified_pyq questions should be treated as real previous-year questions.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/pyq/admin">
            <Upload className="mr-2 h-4 w-4" />
            Manual Import
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Questions</p>
                <p className="text-3xl font-bold mt-1">{totalQuestions}</p>
              </div>
              <div className="rounded-lg bg-blue-500/10 p-3">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Years Covered</p>
                <p className="text-3xl font-bold mt-1">{years.length}</p>
              </div>
              <div className="rounded-lg bg-green-500/10 p-3">
                <Calendar className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Verified</p>
                <p className="text-3xl font-bold mt-1">{verifiedCount}</p>
              </div>
              <div className="rounded-lg bg-amber-500/10 p-3">
                <BookOpen className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
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
          <div className="flex gap-4">
            <div className="flex-1 rounded-lg bg-green-500/10 p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{questionsByDifficulty.easy}</p>
              <p className="text-sm text-muted-foreground">Easy</p>
            </div>
            <div className="flex-1 rounded-lg bg-amber-500/10 p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{questionsByDifficulty.medium}</p>
              <p className="text-sm text-muted-foreground">Medium</p>
            </div>
            <div className="flex-1 rounded-lg bg-red-500/10 p-4 text-center">
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Exam</label>
              <Select value={filterExam} onValueChange={(value) => {
                setFilterExam(value)
                setFilterChapter('all')
              }}>
                <SelectTrigger>
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

            <div>
              <label className="text-sm font-medium mb-2 block">Year</label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger>
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

            <div>
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <Select value={filterSubject} onValueChange={(value) => {
                setFilterSubject(value)
                setFilterChapter('all')
              }}>
                <SelectTrigger>
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

            <div>
              <label className="text-sm font-medium mb-2 block">Chapter</label>
              <Select value={filterChapter} onValueChange={setFilterChapter}>
                <SelectTrigger>
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

            <div>
              <label className="text-sm font-medium mb-2 block">Difficulty</label>
              <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                <SelectTrigger>
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

            <label className="flex items-end gap-2 rounded-md border p-3 text-sm">
              <Checkbox checked={verifiedOnly} onCheckedChange={(checked) => setVerifiedOnly(Boolean(checked))} />
              <span className="leading-none">Verified only</span>
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Questions List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
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
                    ? 'No verified PYQ bank has been imported yet. Add real PYQs through manual import when available.'
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
              const sourceLabel = question.is_verified
                ? 'Verified PYQ'
                : question.source === 'ai_generated'
                  ? 'AI-generated / Unverified'
                  : 'Unverified'
              const SourceIcon = question.is_verified ? ShieldCheck : Sparkles

              return (
                <Card key={question.id}>
                  <CardContent className="p-6">
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
                          variant={question.is_verified ? 'default' : 'outline'}
                          className={question.is_verified ? 'gap-1' : 'gap-1 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'}
                        >
                          <SourceIcon className="h-3 w-3" />
                          {sourceLabel}
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
                        {question.options.map((option, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                          >
                            <span className="font-semibold text-primary w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm">
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="min-w-0 break-words text-foreground">{option}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        {question.frequency > 1 && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            Appeared {question.frequency}x
                          </span>
                        )}
                        {!question.is_verified && (
                          <span>Do not treat as official PYQ</span>
                        )}
                        {question.source_reference && (
                          <span className="min-w-0 break-words">
                            Source: {question.source_reference}
                          </span>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedQuestion(isExpanded ? null : question.id)}
                        className="w-fit"
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

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-border space-y-3">
                        {question.answer && (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10">
                            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-green-700 dark:text-green-400">
                                Correct Answer
                              </p>
                              <p className="break-words text-foreground">{question.answer}</p>
                            </div>
                          </div>
                        )}
                        {question.explanation && (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10">
                            <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-blue-700 dark:text-blue-400">
                                Explanation
                              </p>
                              <p className="break-words text-foreground">{question.explanation}</p>
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
          <Card className="sticky top-24">
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
                      className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{topic}</span>
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
