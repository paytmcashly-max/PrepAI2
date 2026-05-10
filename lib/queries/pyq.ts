"use server"

import { createClient } from '@/lib/supabase/server'

export interface PYQQuestion {
  id: string
  exam_id: string | null
  year: number
  subject_id: string | null
  chapter: string | null
  topic: string | null
  difficulty: string
  question: string
  options: string[]
  answer: string | null
  explanation: string | null
  source: string | null
  is_verified: boolean
  frequency: number
  subjects?: {
    name: string
    color: string
  } | null
  exams?: {
    name: string
  } | null
}

export interface PYQFilters {
  examId?: string
  year?: number
  subjectId?: string
  chapter?: string
  difficulty?: string
}

export async function getPYQQuestions(filters?: PYQFilters) {
  const supabase = await createClient()
  
  let query = supabase
    .from('pyq_questions')
    .select(`
      *,
      subjects (name, color),
      exams (name)
    `)
    .order('year', { ascending: false })
  
  if (filters?.examId) {
    query = query.eq('exam_id', filters.examId)
  }
  if (filters?.year) {
    query = query.eq('year', filters.year)
  }
  if (filters?.subjectId) {
    query = query.eq('subject_id', filters.subjectId)
  }
  if (filters?.chapter) {
    query = query.eq('chapter', filters.chapter)
  }
  if (filters?.difficulty) {
    query = query.eq('difficulty', filters.difficulty)
  }
  
  const { data: questions, error } = await query
  
  if (error) {
    console.error('Error fetching PYQ questions:', error)
    return { questions: [], exams: [], subjects: [], years: [] }
  }
  
  // Get filter options
  const { data: exams } = await supabase
    .from('exams')
    .select('id, name')
    .order('name')
  
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name')
    .order('name')
  
  // Get unique years from questions
  const { data: yearData } = await supabase
    .from('pyq_questions')
    .select('year')
    .order('year', { ascending: false })
  
  const years = [...new Set(yearData?.map(y => y.year) || [])]
  
  return {
    questions: questions || [],
    exams: exams || [],
    subjects: subjects || [],
    years
  }
}

export async function getPYQByExam(examId: string) {
  const supabase = await createClient()
  
  const { data: questions, error } = await supabase
    .from('pyq_questions')
    .select(`
      *,
      subjects (name, color)
    `)
    .eq('exam_id', examId)
    .order('year', { ascending: false })
  
  if (error) {
    console.error('Error fetching PYQ by exam:', error)
    return []
  }
  
  return questions || []
}

export async function getPYQBySubject(subjectId: string) {
  const supabase = await createClient()
  
  const { data: questions, error } = await supabase
    .from('pyq_questions')
    .select(`
      *,
      exams (name)
    `)
    .eq('subject_id', subjectId)
    .order('year', { ascending: false })
  
  if (error) {
    console.error('Error fetching PYQ by subject:', error)
    return []
  }
  
  return questions || []
}

export async function getPYQStats() {
  const supabase = await createClient()
  
  const { data: questions } = await supabase
    .from('pyq_questions')
    .select('exam_id, subject_id, year, difficulty')
  
  if (!questions) return null
  
  const examCounts: Record<string, number> = {}
  const subjectCounts: Record<string, number> = {}
  const yearCounts: Record<number, number> = {}
  const difficultyCounts: Record<string, number> = {}
  
  questions.forEach(q => {
    if (q.exam_id) examCounts[q.exam_id] = (examCounts[q.exam_id] || 0) + 1
    if (q.subject_id) subjectCounts[q.subject_id] = (subjectCounts[q.subject_id] || 0) + 1
    yearCounts[q.year] = (yearCounts[q.year] || 0) + 1
    difficultyCounts[q.difficulty] = (difficultyCounts[q.difficulty] || 0) + 1
  })
  
  return {
    total: questions.length,
    byExam: examCounts,
    bySubject: subjectCounts,
    byYear: yearCounts,
    byDifficulty: difficultyCounts
  }
}
