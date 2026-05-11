import { createAdminClient } from '@/lib/supabase/admin'
import { isSupportedExamId } from '@/lib/exams/supported'
import masterSeed from '@/supabase/master-seed.json'

type Priority = 'low' | 'medium' | 'high'
type Difficulty = 'easy' | 'medium' | 'hard'
type TaskType = 'concept' | 'practice' | 'revision' | 'mock' | 'physical' | 'pyq' | 'notes'

type SeedExam = {
  id: string
  name: string
  level?: string | null
  category?: string | null
  primary_language?: string | null
  focus?: string[]
  recommended_for?: string[]
  selectionStages?: string[]
  selection_stages?: string[]
  source_notes?: string | null
}

type SeedSubject = {
  id: string
  name: string
  icon?: string | null
  color?: string | null
  order_index?: number
}

type SeedExamSubject = {
  exam_id: string
  subject_id: string
  weight?: number
  is_core?: boolean
}

type SeedChapter = {
  id?: string
  examId?: string
  exam_id?: string
  subjectId?: string
  subject_id?: string
  chapter_key?: string | null
  name: string
  priority?: Priority
  difficulty?: Difficulty
  estimatedMinutes?: number
  estimated_minutes?: number
  orderIndex?: number
  order_index?: number
  tags?: string[]
  aliases?: string[]
}

type SeedTaskTemplate = {
  id?: string
  examId?: string | null
  exam_id?: string | null
  subjectId?: string | null
  subject_id?: string | null
  taskType?: TaskType
  task_type?: TaskType
  titleTemplate?: string
  title_template?: string
  descriptionTemplate?: string | null
  description_template?: string | null
  estimatedMinutes?: number
  estimated_minutes?: number
  priority?: Priority
  how_to_study?: string[]
}

type SeedRule = {
  id?: string
  examId?: string
  exam_id?: string
  frequency?: string
  startAfterPhase?: string
  start_after_phase?: string
  frequencyDays?: number
  frequency_days?: number
  mockType?: string
  mock_type?: string
  level?: 'weak' | 'average' | 'good'
  ruleConfig?: Record<string, unknown>
  rule_config?: Record<string, unknown>
}

type SeedPYQ = {
  id?: string
  examId?: string | null
  exam_id?: string | null
  year: number
  subjectId?: string | null
  subject_id?: string | null
  chapterId?: string | null
  chapter_id?: string | null
  difficulty?: Difficulty
  question: string
  options?: unknown
  answer?: string | null
  explanation?: string | null
  source?: 'ai_generated' | 'verified_pyq' | 'trusted_third_party' | 'memory_based' | string | null
  source_reference?: string | null
  sourceName?: string | null
  source_name?: string | null
  sourceUrl?: string | null
  source_url?: string | null
  verificationStatus?: string | null
  verification_status?: string | null
  isVerified?: boolean
  is_verified?: boolean
}

export interface SeedData {
  version?: string
  planner_rules?: Record<string, unknown>
  exams?: SeedExam[]
  subjects?: SeedSubject[]
  exam_subjects?: SeedExamSubject[]
  chapters?: SeedChapter[]
  taskTemplates?: SeedTaskTemplate[]
  task_templates?: SeedTaskTemplate[]
  revisionRules?: SeedRule[]
  revision_rules?: SeedRule[]
  mockRules?: SeedRule[]
  mock_rules?: SeedRule[]
  physicalRules?: SeedRule[]
  physical_rules?: SeedRule[]
  pyqQuestions?: SeedPYQ[]
  pyq_questions?: SeedPYQ[]
  quotes?: { id?: string; quote: string; author?: string | null }[]
  quote_bank?: { id?: string; text: string; category?: string | null; author?: string | null }[]
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const colorTokens: Record<string, string> = {
  blue: '#2563EB',
  emerald: '#059669',
  orange: '#EA580C',
  purple: '#7C3AED',
  red: '#DC2626',
  sky: '#0284C7',
}

function normalizeColor(color: string | null | undefined) {
  if (!color) return null
  return colorTokens[color] ?? color
}

function validateNoFixedUserSeeds(data: SeedData) {
  const forbiddenKeys = [
    'dailyRoadmap',
    'dailyPlans',
    'daily_plans',
    'dailyTasks',
    'daily_tasks',
    'userDailyTasks',
    'user_daily_tasks',
    'taskCompletions',
    'task_completions',
    'userStudyPlans',
    'user_study_plans',
    'profiles',
  ]

  for (const key of forbiddenKeys) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      throw new Error(`Static/user-specific seed key "${key}" is not allowed in master seed data.`)
    }
  }
}

export function getMasterSeedData(): SeedData {
  return masterSeed as SeedData
}

export async function seedDatabase(data: SeedData) {
  const supabase = createAdminClient()
  validateNoFixedUserSeeds(data)
  const isSupportedOrGlobal = (examId: string | null | undefined) => !examId || isSupportedExamId(examId)

  try {
    if (data.planner_rules) {
      const { error } = await supabase
        .from('planner_rules')
        .upsert({
          id: 'default',
          rule_config: data.planner_rules,
          source_version: data.version ?? null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })

      if (error) throw error
    }

    for (const exam of data.exams || []) {
      if (!isSupportedExamId(exam.id)) continue

      const { error } = await supabase
        .from('exams')
        .upsert({
          id: exam.id,
          name: exam.name,
          level: exam.level ?? null,
          category: exam.category ?? null,
          primary_language: exam.primary_language ?? null,
          focus: exam.focus ?? [],
          recommended_for: exam.recommended_for ?? [],
          selection_stages: exam.selection_stages ?? exam.selectionStages ?? [],
          source_notes: exam.source_notes ?? null,
        }, { onConflict: 'id' })

      if (error) throw error
    }

    for (const subject of data.subjects || []) {
      const { error } = await supabase
        .from('subjects')
        .upsert({
          id: subject.id,
          name: subject.name,
          icon: subject.icon ?? null,
          color: normalizeColor(subject.color),
          order_index: subject.order_index ?? 0,
        }, { onConflict: 'id' })

      if (error) throw error
    }

    for (const examSubject of data.exam_subjects || []) {
      if (!isSupportedExamId(examSubject.exam_id)) continue

      const { error } = await supabase
        .from('exam_subjects')
        .upsert({
          exam_id: examSubject.exam_id,
          subject_id: examSubject.subject_id,
          weight: examSubject.weight ?? 0,
          is_core: examSubject.is_core ?? true,
        }, { onConflict: 'exam_id,subject_id' })

      if (error) throw error
    }

    for (const [index, chapter] of (data.chapters || []).entries()) {
      const examId = chapter.exam_id ?? chapter.examId
      const subjectId = chapter.subject_id ?? chapter.subjectId

      if (!examId || !subjectId) {
        throw new Error(`Chapter "${chapter.name}" is missing examId or subjectId.`)
      }
      if (!isSupportedExamId(examId)) continue

      const { error } = await supabase
        .from('chapters')
        .upsert({
          id: chapter.id ?? `${examId}-${subjectId}-${slugify(chapter.name)}`,
          exam_id: examId,
          subject_id: subjectId,
          chapter_key: chapter.chapter_key ?? null,
          name: chapter.name,
          priority: chapter.priority ?? 'medium',
          difficulty: chapter.difficulty ?? 'medium',
          estimated_minutes: chapter.estimated_minutes ?? chapter.estimatedMinutes ?? 45,
          order_index: chapter.order_index ?? chapter.orderIndex ?? index + 1,
          tags: chapter.tags ?? [],
          aliases: chapter.aliases ?? [],
        }, { onConflict: 'id' })

      if (error) throw error
    }

    for (const template of data.task_templates ?? data.taskTemplates ?? []) {
      const title = template.title_template ?? template.titleTemplate
      if (!title) throw new Error('Task template is missing titleTemplate.')
      const examId = template.exam_id ?? template.examId ?? null
      if (!isSupportedOrGlobal(examId)) continue

      const { error } = await supabase
        .from('task_templates')
        .upsert({
          ...(template.id ? { id: template.id } : {}),
          exam_id: examId,
          subject_id: template.subject_id ?? template.subjectId ?? null,
          task_type: template.task_type ?? template.taskType ?? 'concept',
          title_template: title,
          description_template: template.description_template ?? template.descriptionTemplate ?? null,
          estimated_minutes: template.estimated_minutes ?? template.estimatedMinutes ?? 30,
          priority: template.priority ?? 'medium',
          how_to_study: template.how_to_study ?? [],
        })

      if (error) throw error
    }

    const revisionRules = data.revision_rules ?? data.revisionRules ?? []
    for (const examId of new Set(revisionRules.map((rule) => rule.exam_id ?? rule.examId).filter(isSupportedExamId))) {
      await supabase.from('revision_rules').delete().eq('exam_id', examId)
    }

    for (const rule of revisionRules) {
      const examId = rule.exam_id ?? rule.examId
      if (!examId) throw new Error('Revision rule is missing examId.')
      if (!isSupportedExamId(examId)) continue

      const { error } = await supabase
        .from('revision_rules')
        .upsert({
          ...(rule.id ? { id: rule.id } : {}),
          exam_id: examId,
          frequency: rule.frequency ?? 'weekly',
          rule_config: rule.rule_config ?? rule.ruleConfig ?? {},
        })

      if (error) throw error
    }

    const mockRules = data.mock_rules ?? data.mockRules ?? []
    for (const examId of new Set(mockRules.map((rule) => rule.exam_id ?? rule.examId).filter(isSupportedExamId))) {
      await supabase.from('mock_rules').delete().eq('exam_id', examId)
    }

    for (const rule of mockRules) {
      const examId = rule.exam_id ?? rule.examId
      if (!examId) throw new Error('Mock rule is missing examId.')
      if (!isSupportedExamId(examId)) continue

      const { error } = await supabase
        .from('mock_rules')
        .upsert({
          ...(rule.id ? { id: rule.id } : {}),
          exam_id: examId,
          start_after_phase: rule.start_after_phase ?? rule.startAfterPhase ?? 'foundation',
          frequency_days: rule.frequency_days ?? rule.frequencyDays ?? 7,
          mock_type: rule.mock_type ?? rule.mockType ?? 'sectional',
          rule_config: rule.rule_config ?? rule.ruleConfig ?? {},
        })

      if (error) throw error
    }

    const physicalRules = data.physical_rules ?? data.physicalRules ?? []
    for (const rule of physicalRules) {
      const examId = rule.exam_id ?? rule.examId
      if (!examId || !rule.level) throw new Error('Physical rule is missing examId or level.')
      if (!isSupportedExamId(examId)) continue

      await supabase.from('physical_rules').delete().eq('exam_id', examId).eq('level', rule.level)

      const { error } = await supabase
        .from('physical_rules')
        .upsert({
          ...(rule.id ? { id: rule.id } : {}),
          exam_id: examId,
          level: rule.level,
          rule_config: rule.rule_config ?? rule.ruleConfig ?? {},
        })

      if (error) throw error
    }

    for (const [index, pyq] of (data.pyq_questions ?? data.pyqQuestions ?? []).entries()) {
      const source = pyq.source ?? 'ai_generated'
      const explicitVerified = pyq.is_verified ?? pyq.isVerified
      const examId = pyq.exam_id ?? pyq.examId ?? null
      if (!isSupportedOrGlobal(examId)) continue

      if (source === 'verified_pyq' && explicitVerified !== true) {
        throw new Error(`PYQ "${pyq.id ?? index + 1}" uses source=verified_pyq but is not explicitly marked verified.`)
      }
      if ((source === 'trusted_third_party' || source === 'memory_based') && explicitVerified === true) {
        throw new Error(`PYQ "${pyq.id ?? index + 1}" cannot be verified unless source=verified_pyq.`)
      }

      const isVerified = source === 'verified_pyq'
      const verificationStatus =
        pyq.verification_status
        ?? pyq.verificationStatus
        ?? (source === 'verified_pyq'
          ? 'official_verified'
          : source === 'trusted_third_party'
            ? 'in_review'
            : source === 'memory_based'
              ? 'memory_based'
              : 'ai_practice')

      const { error } = await supabase
        .from('pyq_questions')
        .upsert({
          id: pyq.id ?? `pyq-${index + 1}`,
          exam_id: examId,
          year: pyq.year,
          subject_id: pyq.subject_id ?? pyq.subjectId ?? null,
          chapter_id: pyq.chapter_id ?? pyq.chapterId ?? null,
          difficulty: pyq.difficulty ?? 'medium',
          question: pyq.question,
          options: pyq.options ?? [],
          answer: pyq.answer ?? null,
          explanation: pyq.explanation ?? null,
          source_reference: pyq.source_reference ?? null,
          source_name: pyq.source_name ?? pyq.sourceName ?? null,
          source_url: pyq.source_url ?? pyq.sourceUrl ?? null,
          source,
          is_verified: isVerified,
          verification_status: verificationStatus,
        }, { onConflict: 'id' })

      if (error) throw error
    }

    for (const [index, quote] of (data.quote_bank || []).entries()) {
      const { error } = await supabase
        .from('quote_bank')
        .upsert({
          id: quote.id ?? `quote-${index + 1}`,
          text: quote.text,
          category: quote.category ?? null,
          author: quote.author ?? null,
        }, { onConflict: 'id' })

      if (error) throw error
    }

    for (const [index, quote] of (data.quotes || []).entries()) {
      const { error } = await supabase
        .from('quote_bank')
        .upsert({
          id: quote.id ?? `quote-${index + 1}`,
          text: quote.quote,
          author: quote.author ?? null,
        }, { onConflict: 'id' })

      if (error) throw error
    }

    return true
  } catch (error) {
    console.error('[seed] Fatal error during master seeding:', error)
    return false
  }
}
