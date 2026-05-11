'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'node:crypto'
import { generateStudyPlan } from '@/lib/services/generate-study-plan'
import { getAdminEmails } from '@/lib/admin-auth'
import type { PYQSource, PYQVerificationStatus } from '@/lib/types'

type Level = 'weak' | 'average' | 'good'
type StudyLanguage = 'hindi' | 'english'
const allowedLevels = new Set<Level>(['weak', 'average', 'good'])
const allowedStudyLanguages = new Set<StudyLanguage>(['hindi', 'english'])
const allowedPYQSources = new Set<PYQSource>([
  'verified_pyq',
  'trusted_third_party',
  'memory_based',
  'ai_generated',
])
const allowedPYQVerificationStatuses = new Set<PYQVerificationStatus>([
  'official_verified',
  'third_party_reviewed',
  'in_review',
  'memory_based',
  'ai_practice',
])

function assertLevel(value: string, label: string): Level {
  if (allowedLevels.has(value as Level)) return value as Level
  throw new Error(`${label} must be weak, average, or good.`)
}

function normalizePositiveInt(value: number, min: number, label: string) {
  const normalized = Number(value)
  if (!Number.isFinite(normalized) || normalized < min) {
    throw new Error(`${label} must be at least ${min}.`)
  }
  return Math.floor(normalized)
}

function assertDate(value: string) {
  if (!value || Number.isNaN(new Date(`${value}T00:00:00`).getTime())) {
    throw new Error('Please choose a valid start date.')
  }
  return value
}

function assertStudyLanguage(value: string): StudyLanguage {
  if (allowedStudyLanguages.has(value as StudyLanguage)) return value as StudyLanguage
  throw new Error('Study language must be Hindi or English.')
}

function normalizeTaskIds(taskIds: string[]) {
  const normalized = [...new Set((taskIds || []).map((id) => id?.trim()).filter(Boolean))]
  if (normalized.length === 0) throw new Error('Select at least one overdue task.')
  return normalized
}

function assertISODate(value: string) {
  const date = assertDate(value)
  return date
}

async function assertPYQAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) throw new Error('Not authenticated')

  const adminEmails = getAdminEmails()
  if (!adminEmails.includes(user.email.toLowerCase())) {
    throw new Error('PYQ import is restricted to configured admins.')
  }

  return user
}

type PYQWriteInput = {
  exam_id: string
  year: number
  subject_id: string
  chapter_id?: string | null
  difficulty: string
  question: string
  options: string[]
  answer: string
  explanation?: string | null
  source_reference?: string | null
  source_name?: string | null
  source_url?: string | null
  verification_status?: string | null
  source: string
  is_verified?: boolean
  review_note?: string | null
}

async function normalizePYQWriteInput(data: PYQWriteInput) {
  const examId = data.exam_id?.trim()
  const subjectId = data.subject_id?.trim()
  const chapterId = data.chapter_id?.trim() || null
  const year = Number(data.year)
  const difficulty = data.difficulty?.trim()
  const source = allowedPYQSources.has(data.source as PYQSource) ? data.source as PYQSource : null
  const requestedStatus = allowedPYQVerificationStatuses.has(data.verification_status as PYQVerificationStatus)
    ? data.verification_status as PYQVerificationStatus
    : null
  const question = data.question?.trim()
  const answer = data.answer?.trim()
  const explanation = data.explanation?.trim() || null
  const sourceReference = data.source_reference?.trim() || null
  const sourceName = data.source_name?.trim() || null
  const sourceUrl = data.source_url?.trim() || null
  const reviewNote = data.review_note?.trim() || null
  const options = (data.options || []).map((option) => option.trim()).filter(Boolean)

  if (!examId || !subjectId || !Number.isInteger(year) || year < 1900 || year > 2100) {
    throw new Error('Please provide exam, subject, and a valid year.')
  }
  if (!['easy', 'medium', 'hard'].includes(difficulty)) {
    throw new Error('Difficulty must be easy, medium, or hard.')
  }
  if (!question || !answer) {
    throw new Error('Question and answer are required.')
  }
  if (!source) {
    throw new Error('Source must be official verified, trusted third-party, memory-based, or AI-generated.')
  }

  const isVerified = source === 'verified_pyq'
  if (data.is_verified && source !== 'verified_pyq') {
    throw new Error('Only official verified PYQs can be marked verified.')
  }
  if (sourceUrl?.startsWith('http')) {
    try {
      new URL(sourceUrl)
    } catch {
      throw new Error('Source URL must be a valid URL when it starts with http.')
    }
  }

  let verificationStatus: PYQVerificationStatus
  switch (source) {
    case 'verified_pyq':
      verificationStatus = 'official_verified'
      if (!chapterId) {
        throw new Error('Official verified PYQs must be linked to a chapter.')
      }
      if (!sourceReference) {
        throw new Error('Official verified PYQs require an official/question-paper source reference.')
      }
      break
    case 'trusted_third_party':
      verificationStatus = requestedStatus === 'third_party_reviewed' ? 'third_party_reviewed' : 'in_review'
      if (!sourceReference) {
        throw new Error('Trusted third-party practice requires a source reference.')
      }
      if (!sourceName) {
        throw new Error('Trusted third-party practice requires a source name.')
      }
      break
    case 'memory_based':
      verificationStatus = 'memory_based'
      if (!sourceReference) {
        throw new Error('Memory-based/unofficial practice requires a source reference.')
      }
      break
    case 'ai_generated':
      verificationStatus = 'ai_practice'
      break
  }

  const admin = createAdminClient()
  const [
    examResult,
    subjectResult,
    examSubjectResult,
    chapterResult,
  ] = await Promise.all([
    admin.from('exams').select('id').eq('id', examId).single(),
    admin.from('subjects').select('id').eq('id', subjectId).single(),
    admin.from('exam_subjects').select('exam_id, subject_id').eq('exam_id', examId).eq('subject_id', subjectId).single(),
    chapterId
      ? admin.from('chapters').select('id, name, exam_id, subject_id').eq('id', chapterId).single()
      : Promise.resolve({ data: null, error: null }),
  ])

  if (examResult.error || !examResult.data) throw new Error('Selected exam does not exist.')
  if (subjectResult.error || !subjectResult.data) throw new Error('Selected subject does not exist.')
  if (examSubjectResult.error || !examSubjectResult.data) {
    throw new Error('Selected subject does not belong to the selected exam.')
  }

  const chapter = chapterResult.data
  if (chapterResult.error) throw new Error('Selected chapter does not exist.')
  if (chapter && (chapter.exam_id !== examId || chapter.subject_id !== subjectId)) {
    throw new Error('Selected chapter does not belong to the selected exam and subject.')
  }

  return {
    admin,
    values: {
      exam_id: examId,
      year,
      subject_id: subjectId,
      chapter_id: chapterId,
      chapter: chapter?.name || null,
      topic: chapter?.name || null,
      difficulty,
      question,
      options,
      answer,
      explanation,
      source_reference: sourceReference,
      source_name: sourceName,
      source_url: sourceUrl,
      source,
      is_verified: isVerified,
      verification_status: verificationStatus,
      review_note: reviewNote,
    },
  }
}

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
      study_language: data.englishBackground ? 'english' : 'hindi',
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

  const { data: activePlan, error: planError } = await supabase
    .from('user_study_plans')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (planError || !activePlan) throw new Error('Active study plan not found')

  const { data: task, error: taskFetchError } = await supabase
    .from('user_daily_tasks')
    .select('status')
    .eq('id', taskId)
    .eq('user_id', user.id)
    .eq('plan_id', activePlan.id)
    .single()

  if (taskFetchError || !task) throw new Error('Task not found')

  const isCompleting = task.status !== 'completed'
  const { error } = await supabase
    .from('user_daily_tasks')
    .update({
      status: isCompleting ? 'completed' : 'pending',
      completed_at: isCompleting ? new Date().toISOString() : null,
    })
    .eq('id', taskId)
    .eq('user_id', user.id)
    .eq('plan_id', activePlan.id)

  if (error) throw error

  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard', 'page')
  revalidatePath('/dashboard/tasks', 'page')
  return { success: true }
}

async function assertPendingTasksInActivePlan(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  taskIds: string[]
) {
  const ids = normalizeTaskIds(taskIds)

  const { data: activePlan, error: planError } = await supabase
    .from('user_study_plans')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (planError || !activePlan) throw new Error('Active study plan not found.')

  const { data: tasks, error: taskError } = await supabase
    .from('user_daily_tasks')
    .select('id')
    .eq('user_id', userId)
    .eq('plan_id', activePlan.id)
    .eq('status', 'pending')
    .in('id', ids)

  if (taskError) throw taskError
  if ((tasks || []).length !== ids.length) {
    throw new Error('Some selected tasks are no longer available in your active plan.')
  }

  return { activePlanId: activePlan.id as string, ids }
}

export async function rescheduleTasks(taskIds: string[], newDate: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const targetDate = assertISODate(newDate)
  const { activePlanId, ids } = await assertPendingTasksInActivePlan(supabase, user.id, taskIds)

  const { error } = await supabase
    .from('user_daily_tasks')
    .update({
      task_date: targetDate,
      completed_at: null,
    })
    .eq('user_id', user.id)
    .eq('plan_id', activePlanId)
    .eq('status', 'pending')
    .in('id', ids)

  if (error) throw error

  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard', 'page')
  revalidatePath('/dashboard/backlog', 'page')
  revalidatePath('/dashboard/revision', 'page')
  revalidatePath('/dashboard/tasks', 'page')
  return { success: true, count: ids.length }
}

export async function skipTasks(taskIds: string[]) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { activePlanId, ids } = await assertPendingTasksInActivePlan(supabase, user.id, taskIds)

  const { error } = await supabase
    .from('user_daily_tasks')
    .update({
      status: 'skipped',
      completed_at: null,
    })
    .eq('user_id', user.id)
    .eq('plan_id', activePlanId)
    .eq('status', 'pending')
    .in('id', ids)

  if (error) throw error

  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard', 'page')
  revalidatePath('/dashboard/backlog', 'page')
  revalidatePath('/dashboard/revision', 'page')
  revalidatePath('/dashboard/tasks', 'page')
  return { success: true, count: ids.length }
}

// ============ PLAN SETTINGS ============
export async function regeneratePlanFromSettings(data: {
  examTarget: string
  targetDays: number
  dailyStudyHours: number
  startDate: string
  mathsLevel: string
  physicalLevel: string
  englishBackground: boolean
  studyLanguage: string
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const examTarget = data.examTarget?.trim()
  if (!examTarget) throw new Error('Please choose an exam.')

  const targetDays = normalizePositiveInt(data.targetDays, 7, 'Target days')
  const dailyStudyHours = normalizePositiveInt(data.dailyStudyHours, 1, 'Daily study hours')
  const startDate = assertDate(data.startDate)
  const mathsLevel = assertLevel(data.mathsLevel, 'Maths level')
  const physicalLevel = assertLevel(data.physicalLevel, 'Physical level')
  const studyLanguage = assertStudyLanguage(data.studyLanguage)

  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('id')
    .eq('id', examTarget)
    .single()

  if (examError || !exam) throw new Error('Selected exam is not available.')

  let generatedPlanId: string | null = null
  let activated = false
  let profileUpdated = false

  const { data: previousProfile, error: previousProfileError } = await supabase
    .from('profiles')
    .select('exam_target, target_days, daily_study_hours, start_date, maths_level, physical_level, english_background, study_language, onboarding_completed')
    .eq('id', user.id)
    .single()

  if (previousProfileError && previousProfileError.code !== 'PGRST116') throw previousProfileError

  try {
    const result = await generateStudyPlan(supabase, {
      userId: user.id,
      examId: examTarget,
      targetDays,
      dailyStudyHours,
      startDate,
      mathsLevel,
      physicalLevel,
      initialStatus: 'generating',
    })

    generatedPlanId = result.planId

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        exam_target: examTarget,
        target_days: targetDays,
        daily_study_hours: dailyStudyHours,
        start_date: startDate,
        maths_level: mathsLevel,
        physical_level: physicalLevel,
        english_background: Boolean(data.englishBackground),
        study_language: studyLanguage,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (profileError) throw profileError
    profileUpdated = true

    const { error: activationError } = await supabase.rpc('activate_generated_study_plan', {
      p_plan_id: generatedPlanId,
    })

    if (activationError) throw activationError
    activated = true

    revalidatePath('/dashboard', 'layout')
    revalidatePath('/dashboard', 'page')
    revalidatePath('/dashboard/tasks', 'page')
    revalidatePath('/dashboard/roadmap', 'page')
    revalidatePath('/dashboard/subjects', 'page')
    revalidatePath('/dashboard/settings/plan', 'page')
    return { success: true, ...result }
  } catch (error) {
    if (generatedPlanId && !activated) {
      const { error: deleteError } = await supabase
        .from('user_study_plans')
        .delete()
        .eq('id', generatedPlanId)
        .eq('user_id', user.id)
        .eq('status', 'generating')

      if (deleteError) {
        await supabase
          .from('user_study_plans')
          .update({ status: 'failed' })
          .eq('id', generatedPlanId)
          .eq('user_id', user.id)
          .eq('status', 'generating')
      }
    }

    if (profileUpdated && !activated && previousProfile) {
      await supabase
        .from('profiles')
        .update({
          ...previousProfile,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
    }

    throw error
  }
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

// ============ PYQ ADMIN IMPORT ============
export async function createPYQQuestion(data: {
  exam_id: string
  year: number
  subject_id: string
  chapter_id?: string | null
  difficulty: string
  question: string
  options: string[]
  answer: string
  explanation?: string | null
  source_reference?: string | null
  source_name?: string | null
  source_url?: string | null
  verification_status?: string | null
  source: string
  is_verified: boolean
}) {
  const user = await assertPYQAdmin()
  const { admin, values } = await normalizePYQWriteInput(data)

  const { data: inserted, error } = await admin
    .from('pyq_questions')
    .insert({
      id: `manual-pyq-${randomUUID()}`,
      ...values,
      reviewed_by: user.email || null,
      reviewed_at: new Date().toISOString(),
      updated_by: user.email || null,
      updated_at: new Date().toISOString(),
      frequency: 1,
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath('/dashboard/pyq', 'page')
  revalidatePath('/dashboard/pyq/admin', 'page')
  return inserted
}

export async function updatePYQReviewStatus(
  questionId: string,
  status: Extract<PYQVerificationStatus, 'in_review' | 'third_party_reviewed' | 'memory_based'>
) {
  const user = await assertPYQAdmin()
  const id = questionId?.trim()

  if (!id) throw new Error('Question ID is required.')
  if (!['in_review', 'third_party_reviewed', 'memory_based'].includes(status)) {
    throw new Error('Unsupported PYQ review status.')
  }

  const admin = createAdminClient()
  const { data: existing, error: existingError } = await admin
    .from('pyq_questions')
    .select('id, source, verification_status, is_verified, source_reference')
    .eq('id', id)
    .single()

  if (existingError || !existing) {
    throw new Error('PYQ question was not found.')
  }
  if (existing.is_verified || existing.source === 'verified_pyq') {
    throw new Error('Official verified PYQs cannot be changed from this review workflow.')
  }

  const currentStatus = existing.verification_status as PYQVerificationStatus | null
  const currentSource = existing.source as PYQSource | null
  let updatePayload: {
    source: PYQSource
    verification_status: PYQVerificationStatus
    is_verified: false
    reviewed_by: string | null
    reviewed_at: string
  }

  if (status === 'third_party_reviewed') {
    if (currentSource !== 'trusted_third_party' || currentStatus !== 'in_review') {
      throw new Error('Only third-party rows currently in review can be marked reviewed.')
    }
    updatePayload = {
      source: 'trusted_third_party',
      verification_status: 'third_party_reviewed',
      is_verified: false,
      reviewed_by: user.email || null,
      reviewed_at: new Date().toISOString(),
    }
  } else if (status === 'in_review') {
    if (currentSource !== 'trusted_third_party' || currentStatus !== 'third_party_reviewed') {
      throw new Error('Only reviewed third-party rows can be sent back to in review.')
    }
    updatePayload = {
      source: 'trusted_third_party',
      verification_status: 'in_review',
      is_verified: false,
      reviewed_by: user.email || null,
      reviewed_at: new Date().toISOString(),
    }
  } else {
    if (currentSource !== 'trusted_third_party' || currentStatus !== 'in_review') {
      throw new Error('Only third-party rows currently in review can be reclassified as memory-based.')
    }
    if (!existing.source_reference?.trim()) {
      throw new Error('Memory-based rows require a source reference.')
    }
    updatePayload = {
      source: 'memory_based',
      verification_status: 'memory_based',
      is_verified: false,
      reviewed_by: user.email || null,
      reviewed_at: new Date().toISOString(),
    }
  }

  const { data: updated, error } = await admin
    .from('pyq_questions')
    .update(updatePayload)
    .eq('id', id)
    .neq('source', 'verified_pyq')
    .eq('is_verified', false)
    .select()
    .single()

  if (error) throw error

  revalidatePath('/dashboard/pyq', 'page')
  revalidatePath('/dashboard/pyq/review', 'page')
  revalidatePath('/dashboard/admin/debug', 'page')
  return updated
}

export async function updatePYQQuestion(questionId: string, data: PYQWriteInput) {
  const user = await assertPYQAdmin()
  const id = questionId?.trim()
  if (!id) throw new Error('Question ID is required.')

  const { admin, values } = await normalizePYQWriteInput(data)

  const { data: existing, error: existingError } = await admin
    .from('pyq_questions')
    .select('id')
    .eq('id', id)
    .single()

  if (existingError || !existing) {
    throw new Error('PYQ question was not found.')
  }

  const now = new Date().toISOString()
  const { data: updated, error } = await admin
    .from('pyq_questions')
    .update({
      ...values,
      reviewed_by: user.email || null,
      reviewed_at: now,
      updated_by: user.email || null,
      updated_at: now,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  revalidatePath('/dashboard/pyq', 'page')
  revalidatePath('/dashboard/pyq/review', 'page')
  revalidatePath('/dashboard/pyq/admin', 'page')
  revalidatePath(`/dashboard/pyq/admin/${id}/edit`, 'page')
  revalidatePath('/dashboard/admin/debug', 'page')
  return updated
}

export async function deletePYQQuestion(questionId: string) {
  await assertPYQAdmin()
  const id = questionId?.trim()
  if (!id) throw new Error('Question ID is required.')

  const admin = createAdminClient()
  const { data: existing, error: existingError } = await admin
    .from('pyq_questions')
    .select('id, source, is_verified')
    .eq('id', id)
    .single()

  if (existingError || !existing) {
    throw new Error('PYQ question was not found.')
  }

  const { error } = await admin
    .from('pyq_questions')
    .delete()
    .eq('id', id)

  if (error) throw error

  revalidatePath('/dashboard/pyq', 'page')
  revalidatePath('/dashboard/pyq/review', 'page')
  revalidatePath('/dashboard/pyq/admin', 'page')
  revalidatePath('/dashboard/admin/debug', 'page')
  return { success: true }
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
