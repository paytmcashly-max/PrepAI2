import 'server-only'

import {
  getActiveStudyPlan,
  getAdaptiveRevisionRecommendations,
  getPYQProgressSummary,
  getTodayTaskGroup,
  getWeakAreas,
} from '@/lib/queries'
import { createClient } from '@/lib/supabase/server'

function trimText(value: string | null | undefined, max = 500) {
  const text = (value || '').trim()
  return text.length > max ? `${text.slice(0, max)}...` : text
}

export async function buildDailyCoachContext(userId: string) {
  const supabase = await createClient()
  const [plan, todayTasks, pyqProgress, weakAreas, adaptiveRecommendations] = await Promise.all([
    getActiveStudyPlan(userId),
    getTodayTaskGroup(userId),
    getPYQProgressSummary(userId),
    getWeakAreas(userId),
    getAdaptiveRevisionRecommendations(userId),
  ])

  let examName: string | null = null
  if (plan) {
    const { data: exam } = await supabase
      .from('exams')
      .select('name')
      .eq('id', plan.exam_id)
      .maybeSingle()
    examName = exam?.name || plan.exam_id
  }

  return {
    activeExam: plan ? { id: plan.exam_id, name: examName } : null,
    currentDay: todayTasks?.day || null,
    todayTasks: (todayTasks?.tasks || []).slice(0, 8).map((task) => ({
      title: trimText(task.title, 140),
      subject: task.subject?.name || task.subject_id,
      chapter: task.chapter?.name || null,
      taskType: task.task_type,
      priority: task.priority,
      status: task.status,
      estimatedMinutes: task.estimated_minutes,
    })),
    pyqProgress: {
      attemptedCount: pyqProgress.attemptedCount,
      correctCount: pyqProgress.correctCount,
      incorrectCount: pyqProgress.incorrectCount,
      accuracyPercentage: pyqProgress.accuracyPercentage,
      markedForRevisionCount: pyqProgress.markedForRevisionCount,
      weakestSubjects: pyqProgress.weakestSubjects.slice(0, 3),
      weakestChapters: pyqProgress.weakestChapters.slice(0, 3),
    },
    weakAreas: weakAreas.slice(0, 5).map((area) => ({
      subject: area.subject_name,
      chapter: area.chapter_name,
      reason: area.reason,
      priority: area.priority,
      suggestedAction: trimText(area.suggested_action, 180),
    })),
    adaptiveRecommendations: adaptiveRecommendations.slice(0, 5).map((recommendation) => ({
      title: trimText(recommendation.title, 160),
      reason: trimText(recommendation.reason, 220),
      priority: recommendation.priority,
      suggestedMinutes: recommendation.suggested_minutes,
      actionType: recommendation.action_type,
    })),
  }
}

export async function buildPYQCoachContext(userId: string, questionId: string) {
  const supabase = await createClient()
  const { data: question, error } = await supabase
    .from('pyq_questions')
    .select('id, exam_id, year, subject_id, chapter_id, difficulty, question, options, answer, explanation, source, is_verified, verification_status, subject:subjects(id, name), exam:exams(id, name), chapter_ref:chapters(id, name)')
    .eq('id', questionId)
    .maybeSingle()

  if (error) throw error
  if (!question) throw new Error('PYQ question was not found.')
  if (question.verification_status === 'needs_manual_review' || question.verification_status === 'auto_rejected') {
    throw new Error('This PYQ is not available for AI coaching.')
  }

  const { data: attempt, error: attemptError } = await supabase
    .from('user_pyq_attempts')
    .select('selected_answer, is_correct, marked_for_revision, mistake_note, attempted_at')
    .eq('user_id', userId)
    .eq('pyq_question_id', question.id)
    .maybeSingle()

  if (attemptError) throw attemptError

  const subject = Array.isArray(question.subject) ? question.subject[0] || null : question.subject
  const exam = Array.isArray(question.exam) ? question.exam[0] || null : question.exam
  const chapter = Array.isArray(question.chapter_ref) ? question.chapter_ref[0] || null : question.chapter_ref
  const officialVerified = question.source === 'verified_pyq' && question.is_verified === true

  return {
    questionId: question.id,
    exam: exam ? { id: exam.id, name: exam.name } : { id: question.exam_id, name: question.exam_id },
    year: question.year,
    subject: subject ? { id: subject.id, name: subject.name } : { id: question.subject_id, name: question.subject_id },
    chapter: chapter ? { id: chapter.id, name: chapter.name } : { id: question.chapter_id, name: null },
    difficulty: question.difficulty,
    question: trimText(question.question, 1000),
    options: Array.isArray(question.options) ? question.options.map((option: string) => trimText(option, 220)) : [],
    answer: trimText(question.answer, 240),
    explanation: trimText(question.explanation, 600),
    source: question.source,
    officialVerified,
    attempt: attempt ? {
      selectedAnswer: trimText(attempt.selected_answer, 240),
      isCorrect: attempt.is_correct,
      markedForRevision: attempt.marked_for_revision,
      mistakeNote: trimText(attempt.mistake_note, 400),
      attemptedAt: attempt.attempted_at,
    } : null,
  }
}
