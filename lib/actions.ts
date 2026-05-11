'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { randomUUID } from 'node:crypto'
import { generateStudyPlan } from '@/lib/services/generate-study-plan'
import { generatePrepAIOriginalResourceDraft } from '@/lib/services/original-resource-draft'
import { getAdminEmails } from '@/lib/admin-auth'
import { autoValidatePYQInput } from '@/lib/pyq-trust'
import { pyqAnswersMatch } from '@/lib/pyq-answer'
import { toLocalDateString } from '@/lib/date-utils'
import { getActiveStudyPlan, getAdaptiveRevisionRecommendations, getResourceCoverageForActivePlan } from '@/lib/queries'
import { isSupportedExamId } from '@/lib/exams/supported'
import { buildDailyCoachContext, buildPYQCoachContext } from '@/lib/ai/coach-context'
import { callGroqCoach, claimGroqRateLimitSlot } from '@/lib/ai/groq'
import type { CoachActionResult, PYQSource, PYQVerificationStatus } from '@/lib/types'

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
  'system_validated',
  'needs_manual_review',
  'third_party_reviewed',
  'in_review',
  'memory_based',
  'ai_practice',
  'auto_rejected',
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

async function assertConfiguredAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) throw new Error('Not authenticated')

  const adminEmails = getAdminEmails()
  if (!adminEmails.includes(user.email.toLowerCase())) {
    throw new Error('Admin access is restricted to configured admins.')
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

async function normalizePYQWriteInput(data: PYQWriteInput, existingQuestionId?: string) {
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
  if (!isSupportedExamId(examId)) {
    throw new Error('Selected exam is not supported. Choose Bihar SI, UP Police, or SSC GD.')
  }
  if (!['easy', 'medium', 'hard'].includes(difficulty)) {
    throw new Error('Difficulty must be easy, medium, or hard.')
  }
  if (!question) {
    throw new Error('Question is required.')
  }
  if (!answer && source !== 'trusted_third_party') {
    throw new Error('Answer is required.')
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

  const duplicateQuery = admin
    .from('pyq_questions')
    .select('id')
    .eq('exam_id', examId)
    .eq('year', year)
    .eq('question', question)
    .eq('source_reference', sourceReference || '')

  if (existingQuestionId) duplicateQuery.neq('id', existingQuestionId)
  const { data: duplicateRows, error: duplicateError } = await duplicateQuery.limit(1)
  if (duplicateError) throw duplicateError

  const autoValidation = autoValidatePYQInput({
    source,
    source_name: sourceName,
    source_reference: sourceReference,
    source_url: sourceUrl,
    exam_id: examId,
    year,
    subject_id: subjectId,
    chapter_id: chapterId,
    question,
    answer,
    mappingValid: Boolean(examResult.data && subjectResult.data && examSubjectResult.data && (!chapter || (chapter.exam_id === examId && chapter.subject_id === subjectId))),
    duplicateFound: Boolean(duplicateRows?.length),
  })

  if (autoValidation.auto_review_flags.includes('invalid_source_url')) {
    throw new Error('Source URL must be a valid URL when it starts with http.')
  }

  let verificationStatus = autoValidation.verification_status
  if (source === 'trusted_third_party') {
    if (requestedStatus === 'third_party_reviewed') verificationStatus = 'third_party_reviewed'
    if (requestedStatus === 'needs_manual_review') verificationStatus = 'needs_manual_review'
    if (requestedStatus === 'in_review') verificationStatus = 'in_review'
    if (requestedStatus === 'auto_rejected') verificationStatus = 'auto_rejected'
  }
  if (source === 'memory_based') {
    verificationStatus = 'memory_based'
    if (!sourceReference) {
      throw new Error('Memory-based/unofficial practice requires a source reference.')
    }
  }
  if (source === 'ai_generated') verificationStatus = 'ai_practice'
  if (source === 'verified_pyq') {
    if (verificationStatus !== 'official_verified') {
      throw new Error('Official verified PYQs require official source evidence, chapter, answer, and valid exam/subject/chapter mapping.')
    }
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
      auto_review_score: autoValidation.auto_review_score,
      auto_review_flags: autoValidation.auto_review_flags,
      auto_reviewed_at: new Date().toISOString(),
      auto_rejection_reason: verificationStatus === 'auto_rejected'
        ? autoValidation.auto_rejection_reason || 'Auto-validation rejected this row.'
        : null,
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
  if (!isSupportedExamId(data.examTarget)) {
    throw new Error('Selected exam is not supported. Choose Bihar SI, UP Police, or SSC GD.')
  }

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

export async function createAdaptiveRevisionTask(recommendationId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const id = recommendationId?.trim()
  if (!id) throw new Error('Recommendation ID is required.')
  if (!/^(chapter|subject|question):/.test(id)) {
    throw new Error('Recommendation ID is invalid. Please refresh and try again.')
  }

  const { data: activePlan, error: planError } = await supabase
    .from('user_study_plans')
    .select('id, exam_id, start_date')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (planError || !activePlan) throw new Error('Active study plan not found.')

  const recommendations = await getAdaptiveRevisionRecommendations(user.id)
  const recommendation = recommendations.find((item) => item.id === id)
  if (!recommendation) throw new Error('Recommendation is no longer available.')
  if (recommendation.action_type !== 'revision_task') {
    throw new Error('A recent revision task already exists. Review the PYQs from this recommendation instead.')
  }
  if (!recommendation.subject_id && !recommendation.chapter_id) {
    throw new Error('This recommendation cannot create a task because it is not mapped to a subject or chapter.')
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayString = toLocalDateString(today)
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(today.getDate() - 6)
  const sevenDaysAhead = new Date(today)
  sevenDaysAhead.setDate(today.getDate() + 6)

  let duplicateQuery = supabase
    .from('user_daily_tasks')
    .select('id')
    .eq('user_id', user.id)
    .eq('plan_id', activePlan.id)
    .eq('status', 'pending')
    .eq('task_type', 'revision')
    .gte('task_date', toLocalDateString(sevenDaysAgo))
    .lte('task_date', toLocalDateString(sevenDaysAhead))

  duplicateQuery = recommendation.chapter_id
    ? duplicateQuery.eq('chapter_id', recommendation.chapter_id)
    : duplicateQuery.is('chapter_id', null).eq('subject_id', recommendation.subject_id)

  const { data: duplicateRows, error: duplicateError } = await duplicateQuery.limit(1)
  if (duplicateError) throw duplicateError
  if (duplicateRows && duplicateRows.length > 0) {
    throw new Error('You already have a pending revision task for this PYQ pattern within 7 days. Review the PYQs first, then continue with that task.')
  }

  const start = new Date(`${activePlan.start_date}T00:00:00`)
  const dayNumber = Math.max(1, Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)

  const { data: task, error } = await supabase
    .from('user_daily_tasks')
    .insert({
      user_id: user.id,
      plan_id: activePlan.id,
      day_number: dayNumber,
      task_date: todayString,
      exam_id: activePlan.exam_id,
      subject_id: recommendation.subject_id,
      chapter_id: recommendation.chapter_id,
      title: `PYQ revision: ${recommendation.chapter_name || recommendation.subject_name || 'mistake pattern'}`,
      description: recommendation.reason,
      task_type: 'revision',
      estimated_minutes: recommendation.suggested_minutes,
      priority: recommendation.priority,
      how_to_study: [
        'Re-open the incorrect or marked PYQs and identify the exact mistake pattern.',
        'Revise the related concept or notes for this chapter.',
        'Retry the PYQs without seeing the answer, then write one mistake note.',
      ],
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard', 'page')
  revalidatePath('/dashboard/revision', 'page')
  revalidatePath('/dashboard/tasks', 'page')
  revalidatePath('/dashboard/pyq', 'page')
  return { success: true, task }
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
  if (!isSupportedExamId(examTarget)) {
    throw new Error('Selected exam is not supported. Choose Bihar SI, UP Police, or SSC GD.')
  }

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
  revalidatePath('/dashboard/pyq/review', 'page')
  revalidatePath('/dashboard/admin/debug', 'page')
  return inserted
}

export async function updatePYQReviewStatus(
  questionId: string,
  status: Extract<PYQVerificationStatus, 'needs_manual_review' | 'third_party_reviewed' | 'in_review' | 'memory_based' | 'auto_rejected'>
) {
  const user = await assertPYQAdmin()
  const id = questionId?.trim()

  if (!id) throw new Error('Question ID is required.')
  if (!['needs_manual_review', 'in_review', 'third_party_reviewed', 'memory_based', 'auto_rejected'].includes(status)) {
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
    auto_rejection_reason?: string | null
  }

  if (status === 'third_party_reviewed') {
    if (currentSource !== 'trusted_third_party' || currentStatus === 'auto_rejected') {
      throw new Error('Only non-rejected third-party rows can be marked human reviewed.')
    }
    updatePayload = {
      source: 'trusted_third_party',
      verification_status: 'third_party_reviewed',
      is_verified: false,
      reviewed_by: user.email || null,
      reviewed_at: new Date().toISOString(),
      auto_rejection_reason: null,
    }
  } else if (status === 'needs_manual_review' || status === 'in_review') {
    if (currentSource !== 'trusted_third_party') {
      throw new Error('Only third-party rows can be sent to manual review.')
    }
    updatePayload = {
      source: 'trusted_third_party',
      verification_status: status,
      is_verified: false,
      reviewed_by: user.email || null,
      reviewed_at: new Date().toISOString(),
      auto_rejection_reason: null,
    }
  } else if (status === 'auto_rejected') {
    if (currentSource !== 'trusted_third_party') {
      throw new Error('Only third-party rows can be auto-rejected from this workflow.')
    }
    updatePayload = {
      source: 'trusted_third_party',
      verification_status: 'auto_rejected',
      is_verified: false,
      reviewed_by: user.email || null,
      reviewed_at: new Date().toISOString(),
      auto_rejection_reason: 'Rejected during admin review.',
    }
  } else {
    if (currentSource !== 'trusted_third_party') {
      throw new Error('Only third-party rows can be reclassified as memory-based.')
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
      auto_rejection_reason: null,
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

  const { admin, values } = await normalizePYQWriteInput(data, id)

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

// ============ PYQ ATTEMPTS ============
async function assertPYQQuestionForAttempt(questionId: string) {
  const supabase = await createClient()
  const id = questionId?.trim()
  if (!id) throw new Error('Question ID is required.')

  const { data: question, error } = await supabase
    .from('pyq_questions')
    .select('id, answer, options, verification_status')
    .eq('id', id)
    .single()

  if (error || !question) {
    throw new Error('PYQ question was not found.')
  }
  if (question.verification_status === 'needs_manual_review' || question.verification_status === 'auto_rejected') {
    throw new Error('This PYQ is not available for practice yet.')
  }

  return { supabase, question }
}

function revalidatePYQAttemptSurfaces() {
  revalidatePath('/dashboard/pyq', 'page')
  revalidatePath('/dashboard/revision', 'page')
  revalidatePath('/dashboard', 'page')
  revalidatePath('/dashboard/admin/debug', 'page')
}

function revalidateOriginalPracticeSurfaces() {
  revalidatePath('/dashboard/practice/original', 'page')
  revalidatePath('/dashboard/revision', 'page')
  revalidatePath('/dashboard/tasks', 'page')
  revalidatePath('/dashboard', 'page')
  revalidatePath('/dashboard/admin/debug', 'page')
}

const coachWarning = 'AI explanation may be imperfect; source label remains authoritative.'

function trimCoachText(text: string, max = 1800) {
  const trimmed = text.trim()
  return trimmed.length > max ? `${trimmed.slice(0, max)}...` : trimmed
}

function parseDailyCoachSuggestions(text: string) {
  try {
    const parsed = JSON.parse(text)
    const suggestions = Array.isArray(parsed?.suggestions)
      ? parsed.suggestions
        .filter((suggestion: unknown): suggestion is string => typeof suggestion === 'string')
        .map((suggestion: string) => suggestion.trim())
        .filter(Boolean)
      : []
    return suggestions.slice(0, 3)
  } catch {
    return []
  }
}

function fallbackDailySuggestions(context: Awaited<ReturnType<typeof buildDailyCoachContext>>) {
  const todayTask = context.todayTasks[0]
  const adaptive = context.adaptiveRecommendations[0]
  const weak = context.weakAreas[0]
  const pyqWeakChapter = context.pyqProgress.weakestChapters[0]

  return [
    todayTask
      ? `Study today: start with ${todayTask.title}${todayTask.subject ? ` (${todayTask.subject})` : ''}.`
      : adaptive
        ? `Study today: spend ${adaptive.suggestedMinutes} minutes on ${adaptive.title}.`
        : 'Study today: complete one pending plan task before adding extra practice.',
    adaptive
      ? `Revise: ${adaptive.title} because ${adaptive.reason}.`
      : weak
        ? `Revise: ${weak.chapter || weak.subject || 'your weakest area'} because ${weak.reason}.`
        : 'Revise: retry one older mistake and write a short correction note.',
    pyqWeakChapter
      ? `Avoid this mistake: slow down on ${pyqWeakChapter.name}; it has ${pyqWeakChapter.incorrectCount} incorrect PYQ attempt${pyqWeakChapter.incorrectCount > 1 ? 's' : ''}.`
      : context.pyqProgress.incorrectCount > 0
        ? 'Avoid this mistake: review incorrect PYQs before attempting fresh questions.'
        : 'Avoid this mistake: do not reveal answers before making a serious attempt in Test Mode.',
  ]
}

function fallbackPYQExplanation(context: Awaited<ReturnType<typeof buildPYQCoachContext>>) {
  const selected = context.attempt?.selectedAnswer
  const correctness = context.attempt?.isCorrect === false
    ? `Your selected answer (${selected || 'not recorded'}) does not match the stored answer (${context.answer || 'not available'}).`
    : context.attempt?.isCorrect === true
      ? `Your answer is correct. Use this to reinforce the method, not just the final option.`
      : `No attempt is recorded yet, so this is a general explanation from the stored answer.`
  const sourceLine = context.officialVerified
    ? 'This question is marked as official verified in the app.'
    : 'This question is not official verified; use the source label as authoritative.'
  return [
    correctness,
    context.explanation ? `Concept: ${context.explanation}` : 'Concept: compare each option against the stored answer and revise the related chapter notes.',
    `Revision: retry the question without viewing the answer, then write one mistake note. ${sourceLine}`,
  ].join('\n')
}

export async function getDailyCoachFallbackSuggestions(): Promise<CoachActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const context = await buildDailyCoachContext(user.id)
  return {
    source: 'fallback',
    suggestions: fallbackDailySuggestions(context),
    warning: coachWarning,
    fallbackReason: 'Deterministic coach loaded instantly. Use Refresh with AI Coach when needed.',
  }
}

export async function getDailyCoachSuggestions(): Promise<CoachActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const context = await buildDailyCoachContext(user.id)
  const fallback = fallbackDailySuggestions(context)
  const rateLimit = claimGroqRateLimitSlot(`daily-coach:${user.id}`, 30_000)
  if (!rateLimit.allowed) {
    return {
      source: 'fallback',
      suggestions: fallback,
      warning: coachWarning,
      fallbackReason: `AI coach cooldown is active. Try again in ${Math.ceil(rateLimit.retryAfterMs / 1000)} seconds.`,
    }
  }

  const result = await callGroqCoach(
    'Return only valid JSON in this exact shape: {"suggestions":["what to study today","what to revise","what mistake to avoid"]}. Use exactly three concise suggestions.',
    context
  )

  if (!result.available) {
    return {
      source: 'fallback',
      suggestions: fallback,
      warning: coachWarning,
      fallbackReason: result.fallbackReason,
    }
  }

  const suggestions = parseDailyCoachSuggestions(result.text)
  if (suggestions.length < 3) {
    return {
      source: 'fallback',
      suggestions: fallback,
      warning: coachWarning,
      fallbackReason: 'AI coach response was not valid JSON, so deterministic suggestions were used.',
    }
  }

  return {
    source: 'groq',
    suggestions,
    warning: coachWarning,
  }
}

export async function explainPYQMistake(questionId: string): Promise<CoachActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const id = questionId?.trim()
  if (!id) throw new Error('Question ID is required.')

  const context = await buildPYQCoachContext(user.id, id)
  const fallback = fallbackPYQExplanation(context)
  const rateLimit = claimGroqRateLimitSlot(`pyq-coach:${user.id}`, 10_000)
  if (!rateLimit.allowed) {
    return {
      source: 'fallback',
      explanation: fallback,
      warning: coachWarning,
      fallbackReason: `AI coach cooldown is active. Try again in ${Math.ceil(rateLimit.retryAfterMs / 1000)} seconds.`,
    }
  }

  const result = await callGroqCoach(
    'Explain this PYQ for the student. If there is an incorrect selected answer, explain why it is wrong and how to revise. If there is no attempt, give a general learning-mode explanation. Keep it concise.',
    context
  )

  if (!result.available) {
    return {
      source: 'fallback',
      explanation: fallback,
      warning: coachWarning,
      fallbackReason: result.fallbackReason,
    }
  }

  return {
    source: 'groq',
    explanation: trimCoachText(result.text),
    warning: coachWarning,
  }
}

export async function submitPYQAttempt(questionId: string, selectedAnswer: string, mistakeNote?: string | null) {
  const { supabase, question } = await assertPYQQuestionForAttempt(questionId)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const answer = selectedAnswer?.trim()
  if (!answer) throw new Error('Please select an answer.')
  if (!question.answer?.trim()) throw new Error('This question does not have an answer yet.')

  const { data: existing, error: existingError } = await supabase
    .from('user_pyq_attempts')
    .select('id, marked_for_revision')
    .eq('user_id', user.id)
    .eq('pyq_question_id', question.id)
    .maybeSingle()

  if (existingError) throw existingError

  const now = new Date().toISOString()
  const isCorrect = pyqAnswersMatch(answer, question.answer, Array.isArray(question.options) ? question.options : [])
  const payload = {
    user_id: user.id,
    pyq_question_id: question.id,
    selected_answer: answer,
    is_correct: isCorrect,
    marked_for_revision: existing?.marked_for_revision ?? false,
    mistake_note: mistakeNote?.trim() || null,
    attempted_at: existing ? undefined : now,
    updated_at: now,
  }

  const { data: attempt, error } = await supabase
    .from('user_pyq_attempts')
    .upsert(payload, { onConflict: 'user_id,pyq_question_id' })
    .select()
    .single()

  if (error) throw error

  revalidatePYQAttemptSurfaces()
  return attempt
}

export async function togglePYQRevisionMark(questionId: string) {
  const { supabase, question } = await assertPYQQuestionForAttempt(questionId)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: existing, error: existingError } = await supabase
    .from('user_pyq_attempts')
    .select('*')
    .eq('user_id', user.id)
    .eq('pyq_question_id', question.id)
    .maybeSingle()

  if (existingError) throw existingError

  const now = new Date().toISOString()
  const nextMarked = !(existing?.marked_for_revision ?? false)

  const { data: attempt, error } = existing
    ? await supabase
        .from('user_pyq_attempts')
        .update({
          marked_for_revision: nextMarked,
          updated_at: now,
        })
        .eq('id', existing.id)
        .eq('user_id', user.id)
        .select()
        .single()
    : await supabase
        .from('user_pyq_attempts')
        .insert({
          user_id: user.id,
          pyq_question_id: question.id,
          selected_answer: null,
          is_correct: null,
          marked_for_revision: true,
          attempted_at: now,
          updated_at: now,
        })
        .select()
        .single()

  if (error) throw error

  revalidatePYQAttemptSurfaces()
  return attempt
}

export async function clearPYQAttempt(questionId: string) {
  const { supabase, question } = await assertPYQQuestionForAttempt(questionId)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('user_pyq_attempts')
    .delete()
    .eq('user_id', user.id)
    .eq('pyq_question_id', question.id)

  if (error) throw error

  revalidatePYQAttemptSurfaces()
  return { success: true }
}

// ============ PREPAI ORIGINAL PRACTICE ATTEMPTS ============
async function assertOriginalPracticeQuestionForAttempt(questionId: string) {
  const supabase = await createClient()
  const id = questionId?.trim()
  if (!id) throw new Error('Question ID is required.')

  const { data: question, error } = await supabase
    .from('original_practice_questions')
    .select('id, question, answer, options, explanation, exam_id, subject_id, chapter_id, is_active')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (error || !question) {
    throw new Error('Original practice question was not found.')
  }

  return { supabase, question }
}

export async function submitOriginalPracticeAttempt(questionId: string, selectedAnswer: string, mistakeNote?: string | null) {
  const { supabase, question } = await assertOriginalPracticeQuestionForAttempt(questionId)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const answer = selectedAnswer?.trim()
  if (!answer) throw new Error('Please select an answer.')
  if (!question.answer?.trim()) throw new Error('This practice question does not have an answer yet.')

  const { data: existing, error: existingError } = await supabase
    .from('original_practice_attempts')
    .select('id, marked_for_revision')
    .eq('user_id', user.id)
    .eq('question_id', question.id)
    .maybeSingle()

  if (existingError) throw existingError

  const now = new Date().toISOString()
  const isCorrect = pyqAnswersMatch(answer, question.answer, Array.isArray(question.options) ? question.options : [])
  const payload = {
    user_id: user.id,
    question_id: question.id,
    selected_answer: answer,
    is_correct: isCorrect,
    marked_for_revision: existing?.marked_for_revision ?? false,
    mistake_note: mistakeNote?.trim() || null,
    attempted_at: existing ? undefined : now,
    updated_at: now,
  }

  const { data: attempt, error } = await supabase
    .from('original_practice_attempts')
    .upsert(payload, { onConflict: 'user_id,question_id' })
    .select()
    .single()

  if (error) throw error

  revalidateOriginalPracticeSurfaces()
  return attempt
}

export async function toggleOriginalPracticeRevisionMark(questionId: string) {
  const { supabase, question } = await assertOriginalPracticeQuestionForAttempt(questionId)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: existing, error: existingError } = await supabase
    .from('original_practice_attempts')
    .select('*')
    .eq('user_id', user.id)
    .eq('question_id', question.id)
    .maybeSingle()

  if (existingError) throw existingError

  const now = new Date().toISOString()
  const nextMarked = !(existing?.marked_for_revision ?? false)
  const { data: attempt, error } = existing
    ? await supabase
        .from('original_practice_attempts')
        .update({
          marked_for_revision: nextMarked,
          updated_at: now,
        })
        .eq('id', existing.id)
        .eq('user_id', user.id)
        .select()
        .single()
    : await supabase
        .from('original_practice_attempts')
        .insert({
          user_id: user.id,
          question_id: question.id,
          selected_answer: null,
          is_correct: null,
          marked_for_revision: true,
          attempted_at: now,
          updated_at: now,
        })
        .select()
        .single()

  if (error) throw error

  revalidateOriginalPracticeSurfaces()
  return attempt
}

export async function clearOriginalPracticeAttempt(questionId: string) {
  const { supabase, question } = await assertOriginalPracticeQuestionForAttempt(questionId)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('original_practice_attempts')
    .delete()
    .eq('user_id', user.id)
    .eq('question_id', question.id)

  if (error) throw error

  revalidateOriginalPracticeSurfaces()
  return { success: true }
}

export async function generateMissingResourcesForActivePlan(input?: FormData | string) {
  await assertConfiguredAdmin()

  const targetUserId = typeof input === 'string'
    ? input
    : input?.get('targetUserId')?.toString()

  if (!targetUserId) throw new Error('Target user ID is required.')

  const plan = await getActiveStudyPlan(targetUserId)
  if (!plan) {
    redirect('/dashboard/admin/debug?resourceStatus=no-active-plan')
  }
  if (!isSupportedExamId(plan.exam_id)) {
    redirect('/dashboard/admin/debug?resourceStatus=unsupported-exam')
  }

  const coverage = await getResourceCoverageForActivePlan(targetUserId)
  const missingTargets = coverage.missingChapters
    .filter((chapter) => chapter.chapterId && (chapter.missingNotesCount > 0 || chapter.missingPracticeCount > 0))
    .slice(0, 10)

  if (missingTargets.length === 0) {
    redirect('/dashboard/admin/debug?resourceStatus=no-missing-resources')
  }

  const admin = createAdminClient()
  const { data: chapters, error: chapterError } = await admin
    .from('chapters')
    .select('id, name, exam:exams(id, name), subject:subjects(id, name)')
    .in('id', missingTargets.map((chapter) => chapter.chapterId as string))

  if (chapterError) throw chapterError

  const resources = []
  const questions = []

  for (const row of chapters || []) {
    const exam = Array.isArray(row.exam) ? row.exam[0] : row.exam
    const subject = Array.isArray(row.subject) ? row.subject[0] : row.subject
    if (!exam?.id || !subject?.id) continue

    const draft = generatePrepAIOriginalResourceDraft({
      exam: { id: exam.id, name: exam.name },
      subject: { id: subject.id, name: subject.name },
      chapter: { id: row.id, name: row.name },
    })

    resources.push({
      ...draft.resource,
      updated_at: new Date().toISOString(),
    })
    questions.push(...draft.questions.slice(0, 15))
  }

  if (resources.length > 0) {
    const { error } = await admin
      .from('study_resources')
      .upsert(resources, { onConflict: 'id' })
    if (error) throw error
  }

  const limitedQuestions = questions.slice(0, 150)
  if (limitedQuestions.length > 0) {
    const { error } = await admin
      .from('original_practice_questions')
      .upsert(limitedQuestions, { onConflict: 'id' })
    if (error) throw error
  }

  revalidatePath('/dashboard/admin/debug')
  revalidatePath('/dashboard/tasks')
  revalidatePath('/dashboard/practice/original')
  revalidatePath('/dashboard/resources/[resourceId]', 'page')

  redirect(`/dashboard/admin/debug?resourceStatus=generated&resources=${resources.length}&questions=${limitedQuestions.length}`)
}

export async function curateVideoForResource(resourceId: string) {
  await assertConfiguredAdmin()

  const id = resourceId?.trim()
  if (!id) throw new Error('Resource ID is required.')

  const apiKey = process.env.YOUTUBE_DATA_API_KEY
  if (!apiKey) {
    return {
      success: false,
      message: 'YOUTUBE_DATA_API_KEY is not configured. YouTube search fallback remains available.',
    }
  }

  const admin = createAdminClient()
  const { data: resource, error: resourceError } = await admin
    .from('study_resources')
    .select('id, exam_id, subject_id, chapter_id, title, description, language, priority, video_search_query, is_active')
    .eq('id', id)
    .single()

  if (resourceError || !resource) throw new Error('Study resource was not found.')
  if (!resource.is_active) throw new Error('Cannot curate a video for an inactive resource.')

  const query = (resource.video_search_query || `${resource.title} preparation Hindi`).trim()
  const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search')
  searchUrl.searchParams.set('part', 'snippet')
  searchUrl.searchParams.set('type', 'video')
  searchUrl.searchParams.set('maxResults', '1')
  searchUrl.searchParams.set('safeSearch', 'strict')
  searchUrl.searchParams.set('q', query)
  searchUrl.searchParams.set('key', apiKey)

  const response = await fetch(searchUrl, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error('YouTube video search failed.')
  }

  const payload = await response.json()
  const item = Array.isArray(payload?.items) ? payload.items[0] : null
  const videoId = item?.id?.videoId
  if (!videoId) {
    await admin
      .from('study_resources')
      .update({ video_status: 'unavailable', updated_at: new Date().toISOString() })
      .eq('id', id)

    revalidatePath('/dashboard/tasks')
    revalidatePath('/dashboard/admin/debug')
    return {
      success: false,
      message: 'No safe YouTube video result was found for this resource.',
    }
  }

  const now = new Date().toISOString()
  const videoResourceId = `res-video-${resource.id}`
  const channelName = item?.snippet?.channelTitle || null
  const videoTitle = item?.snippet?.title || resource.title

  const { error: upsertError } = await admin
    .from('study_resources')
    .upsert({
      id: videoResourceId,
      exam_id: resource.exam_id,
      subject_id: resource.subject_id,
      chapter_id: resource.chapter_id,
      title: `Video: ${videoTitle}`,
      description: `Curated YouTube video support for ${resource.title}.`,
      resource_type: 'video_embed',
      source_name: channelName || 'YouTube',
      source_url: `https://www.youtube.com/watch?v=${videoId}`,
      embed_url: `https://www.youtube.com/embed/${videoId}`,
      video_provider: 'youtube',
      video_id: videoId,
      video_search_query: query,
      video_status: 'curated',
      channel_name: channelName,
      language: resource.language || 'hindi',
      trust_level: 'general_reference',
      content_md: null,
      how_to_study: [
        'Video ko concept support ke liye dekho.',
        'Apne notes me 3 key points likho.',
        'Video ke baad PrepAI Original Practice attempt karo.',
      ],
      priority: (resource.priority || 100) + 1,
      is_active: true,
      updated_at: now,
    }, { onConflict: 'id' })

  if (upsertError) throw upsertError

  revalidatePath('/dashboard/tasks')
  revalidatePath('/dashboard/resources/[resourceId]', 'page')
  revalidatePath('/dashboard/admin/debug')

  return {
    success: true,
    message: 'Curated YouTube video resource was saved as an embed-only companion resource.',
    resourceId: videoResourceId,
  }
}

export async function explainOriginalPracticeMistake(questionId: string): Promise<CoachActionResult> {
  const { supabase, question } = await assertOriginalPracticeQuestionForAttempt(questionId)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: attempt, error: attemptError } = await supabase
    .from('original_practice_attempts')
    .select('selected_answer, is_correct, mistake_note')
    .eq('user_id', user.id)
    .eq('question_id', question.id)
    .maybeSingle()

  if (attemptError) throw attemptError

  const fallback = [
    attempt?.is_correct === false
      ? `Your selected answer (${attempt.selected_answer || 'not recorded'}) does not match the stored PrepAI Original answer (${question.answer}).`
      : attempt?.is_correct === true
        ? 'Your answer is correct. Revise the method so you can repeat it under time pressure.'
        : 'No attempt is recorded yet, so this is a general learning-mode explanation.',
    question.explanation ? `Concept: ${question.explanation}` : 'Concept: compare the options with the stored answer and revise the related chapter note.',
    'Revision: retry the question once, then write one short mistake note. This is PrepAI Original Practice, not an official PYQ.',
  ].join('\n')

  const rateLimit = claimGroqRateLimitSlot(`original-practice-coach:${user.id}`, 10_000)
  if (!rateLimit.allowed) {
    return {
      source: 'fallback',
      explanation: fallback,
      warning: coachWarning,
      fallbackReason: `AI coach cooldown is active. Try again in ${Math.ceil(rateLimit.retryAfterMs / 1000)} seconds.`,
    }
  }

  const result = await callGroqCoach(
    'Explain this PrepAI Original Practice question for the student. Do not call it an official PYQ. If there is an incorrect selected answer, explain why it is wrong and how to revise. Keep it concise.',
    {
      contentType: 'prepai_original_practice',
      question: question.question,
      options: question.options,
      storedAnswer: question.answer,
      storedExplanation: question.explanation,
      attempt,
      trustLabel: 'PrepAI Original Practice - Not Official PYQ',
    }
  )

  if (!result.available) {
    return {
      source: 'fallback',
      explanation: fallback,
      warning: coachWarning,
      fallbackReason: result.fallbackReason,
    }
  }

  return {
    source: 'groq',
    explanation: trimCoachText(result.text),
    warning: coachWarning,
  }
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
