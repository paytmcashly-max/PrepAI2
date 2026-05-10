'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateStudyPlan } from '@/lib/services/generate-study-plan'

type Level = 'weak' | 'average' | 'good'

export async function completeOnboarding(data: {
  fullName: string
  examTarget: string
  targetDays: number
  dailyStudyHours: number
  startDate: string
  mathsLevel: Level
  physicalLevel: Level
  englishBackground: boolean
  currentEducation?: string | null
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const targetDays = Math.max(7, Number(data.targetDays))
  const dailyStudyHours = Math.max(1, Number(data.dailyStudyHours))

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      full_name: data.fullName,
      exam_target: data.examTarget,
      target_days: targetDays,
      daily_study_hours: dailyStudyHours,
      start_date: data.startDate,
      maths_level: data.mathsLevel,
      physical_level: data.physicalLevel,
      english_background: data.englishBackground,
      current_education: data.currentEducation || null,
      onboarding_completed: false,
      updated_at: new Date().toISOString(),
    })

  if (profileError) throw profileError

  const result = await generateStudyPlan(supabase, {
    userId: user.id,
    examId: data.examTarget,
    targetDays,
    dailyStudyHours,
    startDate: data.startDate,
    mathsLevel: data.mathsLevel,
    physicalLevel: data.physicalLevel,
  })

  const { error: completionError } = await supabase
    .from('profiles')
    .update({
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (completionError) throw completionError

  revalidatePath('/dashboard', 'layout')
  return { success: true, ...result }
}

// ============ TASK COMPLETIONS ============
export async function toggleTaskCompletion(taskId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: task, error: taskFetchError } = await supabase
    .from('user_daily_tasks')
    .select('status')
    .eq('id', taskId)
    .eq('user_id', user.id)
    .single()

  if (!taskFetchError && task) {
    const isCompleting = task.status !== 'completed'
    const { error } = await supabase
      .from('user_daily_tasks')
      .update({
        status: isCompleting ? 'completed' : 'pending',
        completed_at: isCompleting ? new Date().toISOString() : null,
      })
      .eq('id', taskId)
      .eq('user_id', user.id)

    if (error) throw error
    revalidatePath('/dashboard', 'layout')
    return { success: true }
  }

  // Backward-compatible fallback for old global daily_tasks rows.
  const { data: existing } = await supabase
    .from('task_completions')
    .select('*')
    .eq('user_id', user.id)
    .eq('daily_task_id', taskId)
    .single()

  const { error } = existing
    ? await supabase
        .from('task_completions')
        .update({
          completed: !existing.completed,
          completed_at: !existing.completed ? new Date().toISOString() : null,
        })
        .eq('id', existing.id)
    : await supabase
        .from('task_completions')
        .insert({
          user_id: user.id,
          daily_task_id: taskId,
          completed: true,
          completed_at: new Date().toISOString(),
        })

  if (error) throw error

  revalidatePath('/dashboard', 'layout')
  return { success: true }
}

// ============ PROFILE ============
export async function updateProfile(data: {
  full_name?: string
  exam_target?: string
  daily_study_hours?: number
  start_date?: string
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      ...data,
      updated_at: new Date().toISOString(),
    })

  if (error) throw error
  
  revalidatePath('/dashboard', 'layout')
  return { success: true }
}

// ============ NOTES ============
export async function createNote(data: {
  title: string
  subject_id?: string | null
  chapter_id?: string | null
  chapter?: string | null
  content?: string | null
  tags?: string[]
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: note, error } = await supabase
    .from('notes')
    .insert({
      user_id: user.id,
      title: data.title,
      subject_id: data.subject_id || null,
      chapter_id: data.chapter_id || null,
      chapter: data.chapter || null,
      content: data.content || null,
      tags: data.tags || [],
    })
    .select()
    .single()

  if (error) throw error
  
  revalidatePath('/dashboard/notes', 'page')
  return note
}

export async function updateNote(noteId: string, data: {
  title?: string
  subject_id?: string | null
  chapter_id?: string | null
  chapter?: string | null
  content?: string | null
  tags?: string[]
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('notes')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', noteId)
    .eq('user_id', user.id)

  if (error) throw error
  
  revalidatePath('/dashboard/notes', 'page')
  return { success: true }
}

export async function deleteNote(noteId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', user.id)

  if (error) throw error
  
  revalidatePath('/dashboard/notes', 'page')
  return { success: true }
}

// ============ MOCK RESULTS ============
export async function createMockResult(data: {
  exam_id: string
  test_date: string
  total_marks: number
  marks_obtained: number
  weak_areas: string[]
  mistakes?: string | null
  notes?: string | null
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const totalMarks = Number(data.total_marks)
  const marksObtained = Number(data.marks_obtained)

  if (!data.exam_id || !data.test_date || !Number.isFinite(totalMarks) || totalMarks <= 0) {
    throw new Error('Please provide exam, date, and valid total marks.')
  }

  if (!Number.isFinite(marksObtained) || marksObtained < 0 || marksObtained > totalMarks) {
    throw new Error('Marks obtained must be between 0 and total marks.')
  }

  const { data: exam } = await supabase
    .from('exams')
    .select('name')
    .eq('id', data.exam_id)
    .single()

  const score = Math.round((marksObtained / totalMarks) * 100)
  const { data: result, error } = await supabase
    .from('mock_tests')
    .insert({
      id: `mock-result-${user.id}-${Date.now()}`,
      user_id: user.id,
      exam_id: data.exam_id,
      title: `${exam?.name || 'Mock Test'} - ${data.test_date}`,
      description: `Manual mock test result: ${score}%`,
      test_date: data.test_date,
      total_marks: totalMarks,
      marks_obtained: marksObtained,
      weak_areas: data.weak_areas,
      mistakes: data.mistakes || null,
      notes: data.notes || null,
      total_questions: 0,
      duration_minutes: 0,
      is_active: false,
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath('/dashboard/mock-tests', 'page')
  revalidatePath('/dashboard', 'page')
  return result
}

// ============ MOCK TEST ATTEMPTS ============
export async function startMockTest(mockTestId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get mock test details
  const { data: mockTest, error: testError } = await supabase
    .from('mock_tests')
    .select('total_questions')
    .eq('id', mockTestId)
    .single()

  if (testError) throw testError

  const { data: attempt, error } = await supabase
    .from('mock_test_attempts')
    .insert({
      user_id: user.id,
      mock_test_id: mockTestId,
      total_marks: mockTest.total_questions * 2, // 2 marks per question
      status: 'in_progress',
    })
    .select()
    .single()

  if (error) throw error
  
  return attempt
}

export async function submitMockTestAnswer(
  attemptId: string, 
  questionId: string, 
  answer: string
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get current answers
  const { data: attempt, error: fetchError } = await supabase
    .from('mock_test_attempts')
    .select('answers')
    .eq('id', attemptId)
    .eq('user_id', user.id)
    .single()

  if (fetchError) throw fetchError

  const answers = attempt.answers || {}
  answers[questionId] = answer

  const { error } = await supabase
    .from('mock_test_attempts')
    .update({ answers })
    .eq('id', attemptId)
    .eq('user_id', user.id)

  if (error) throw error
  
  return { success: true }
}

export async function completeMockTest(
  attemptId: string,
  results: {
    correct_answers: number
    wrong_answers: number
    unanswered: number
    marks_obtained: number
    time_taken_seconds: number
    weak_areas: string[]
  }
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('mock_test_attempts')
    .update({
      ...results,
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', attemptId)
    .eq('user_id', user.id)

  if (error) throw error
  
  revalidatePath('/dashboard/mock-tests', 'page')
  return { success: true }
}

export async function addMockTestNotes(attemptId: string, data: {
  mistakes?: string
  notes?: string
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('mock_test_attempts')
    .update(data)
    .eq('id', attemptId)
    .eq('user_id', user.id)

  if (error) throw error
  
  return { success: true }
}
