"use server"

import { createClient } from '@/lib/supabase/server'

export interface MockTest {
  id: string
  exam_id: string | null
  title: string
  description: string | null
  total_questions: number
  duration_minutes: number
  is_active: boolean
}

export interface MockTestAttempt {
  id: string
  user_id: string
  mock_test_id: string
  test_date: string
  total_marks: number | null
  marks_obtained: number | null
  correct_answers: number
  wrong_answers: number
  unanswered: number
  weak_areas: string[]
  mistakes: string | null
  notes: string | null
  status: string
  created_at: string
}

export async function getMockTests() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: mockTests, error } = await supabase
    .from('mock_tests')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching mock tests:', error)
    return { mockTests: [], attempts: [], userId: null }
  }
  
  // Get user's attempts if logged in
  let attempts: MockTestAttempt[] = []
  if (user) {
    const { data: attemptsData } = await supabase
      .from('mock_test_attempts')
      .select('*')
      .eq('user_id', user.id)
      .order('test_date', { ascending: false })
    
    attempts = attemptsData || []
  }
  
  return {
    mockTests: mockTests || [],
    attempts,
    userId: user?.id
  }
}

export async function getUserMockTestAttempts(userId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('mock_test_attempts')
    .select(`
      *,
      mock_tests (title, total_questions, duration_minutes)
    `)
    .eq('user_id', userId)
    .order('test_date', { ascending: false })
  
  if (error) {
    console.error('Error fetching mock test attempts:', error)
    return []
  }
  
  return data || []
}

export async function createMockTestAttempt(attempt: {
  userId: string
  mockTestId?: string
  examId: string
  testDate: string
  totalMarks: number
  marksObtained: number
  correctAnswers: number
  wrongAnswers: number
  unanswered: number
  weakAreas: string[]
  mistakes?: string
  notes?: string
}) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('mock_test_attempts')
    .insert({
      user_id: attempt.userId,
      mock_test_id: attempt.mockTestId,
      test_date: attempt.testDate,
      total_marks: attempt.totalMarks,
      marks_obtained: attempt.marksObtained,
      correct_answers: attempt.correctAnswers,
      wrong_answers: attempt.wrongAnswers,
      unanswered: attempt.unanswered,
      weak_areas: attempt.weakAreas,
      mistakes: attempt.mistakes,
      notes: attempt.notes,
      status: 'completed'
    })
    .select()
    .single()
  
  return { data, error }
}

export async function getMockTestAnalytics(userId: string) {
  const supabase = await createClient()
  
  const { data: attempts } = await supabase
    .from('mock_test_attempts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('test_date', { ascending: true })
  
  if (!attempts || attempts.length === 0) {
    return {
      totalTests: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      scoreHistory: [],
      weakAreas: {}
    }
  }
  
  const scores = attempts.map(a => 
    a.total_marks > 0 ? (a.marks_obtained / a.total_marks) * 100 : 0
  )
  
  // Count weak areas
  const weakAreasCount: Record<string, number> = {}
  attempts.forEach(a => {
    (a.weak_areas || []).forEach((area: string) => {
      weakAreasCount[area] = (weakAreasCount[area] || 0) + 1
    })
  })
  
  return {
    totalTests: attempts.length,
    averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    highestScore: Math.round(Math.max(...scores)),
    lowestScore: Math.round(Math.min(...scores)),
    scoreHistory: attempts.map(a => ({
      date: a.test_date,
      score: a.total_marks > 0 ? Math.round((a.marks_obtained / a.total_marks) * 100) : 0,
      marks: a.marks_obtained,
      total: a.total_marks
    })),
    weakAreas: weakAreasCount
  }
}
