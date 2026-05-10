import { createAdminClient } from '@/lib/supabase/admin'

type Priority = 'low' | 'medium' | 'high'
type Difficulty = 'easy' | 'medium' | 'hard'
type TaskType = 'concept' | 'practice' | 'revision' | 'mock' | 'physical' | 'pyq' | 'notes'

type SeedExam = {
  id: string
  name: string
  level?: string | null
  focus?: string[]
  selectionStages?: string[]
  selection_stages?: string[]
}

type SeedSubject = {
  id: string
  name: string
  icon?: string | null
  color?: string | null
}

type SeedChapter = {
  id?: string
  examId?: string
  exam_id?: string
  subjectId?: string
  subject_id?: string
  name: string
  priority?: Priority
  difficulty?: Difficulty
  estimatedMinutes?: number
  estimated_minutes?: number
  orderIndex?: number
  order_index?: number
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
}

type SeedRule = {
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
  source?: 'ai_generated' | 'verified_pyq' | string | null
  isVerified?: boolean
  is_verified?: boolean
}

export interface SeedData {
  exams?: SeedExam[]
  subjects?: SeedSubject[]
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
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export async function seedDatabase(data: SeedData) {
  const supabase = createAdminClient()

  try {
    for (const exam of data.exams || []) {
      const { error } = await supabase
        .from('exams')
        .upsert({
          id: exam.id,
          name: exam.name,
          level: exam.level ?? null,
          focus: exam.focus ?? [],
          selection_stages: exam.selection_stages ?? exam.selectionStages ?? [],
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
          color: subject.color ?? null,
        }, { onConflict: 'id' })

      if (error) throw error
    }

    for (const [index, chapter] of (data.chapters || []).entries()) {
      const examId = chapter.exam_id ?? chapter.examId
      const subjectId = chapter.subject_id ?? chapter.subjectId

      if (!examId || !subjectId) {
        throw new Error(`Chapter "${chapter.name}" is missing examId or subjectId.`)
      }

      const { error } = await supabase
        .from('chapters')
        .upsert({
          id: chapter.id ?? `${examId}-${subjectId}-${slugify(chapter.name)}`,
          exam_id: examId,
          subject_id: subjectId,
          name: chapter.name,
          priority: chapter.priority ?? 'medium',
          difficulty: chapter.difficulty ?? 'medium',
          estimated_minutes: chapter.estimated_minutes ?? chapter.estimatedMinutes ?? 45,
          order_index: chapter.order_index ?? chapter.orderIndex ?? index + 1,
        }, { onConflict: 'id' })

      if (error) throw error
    }

    for (const template of data.task_templates ?? data.taskTemplates ?? []) {
      const title = template.title_template ?? template.titleTemplate
      if (!title) throw new Error('Task template is missing titleTemplate.')

      const { error } = await supabase
        .from('task_templates')
        .upsert({
          ...(template.id ? { id: template.id } : {}),
          exam_id: template.exam_id ?? template.examId ?? null,
          subject_id: template.subject_id ?? template.subjectId ?? null,
          task_type: template.task_type ?? template.taskType ?? 'concept',
          title_template: title,
          description_template: template.description_template ?? template.descriptionTemplate ?? null,
          estimated_minutes: template.estimated_minutes ?? template.estimatedMinutes ?? 30,
          priority: template.priority ?? 'medium',
        })

      if (error) throw error
    }

    for (const rule of data.revision_rules ?? data.revisionRules ?? []) {
      const examId = rule.exam_id ?? rule.examId
      if (!examId) throw new Error('Revision rule is missing examId.')

      await supabase.from('revision_rules').delete().eq('exam_id', examId)

      const { error } = await supabase
        .from('revision_rules')
        .insert({
          exam_id: examId,
          frequency: rule.frequency ?? 'weekly',
          rule_config: rule.rule_config ?? rule.ruleConfig ?? {},
        })

      if (error) throw error
    }

    for (const rule of data.mock_rules ?? data.mockRules ?? []) {
      const examId = rule.exam_id ?? rule.examId
      if (!examId) throw new Error('Mock rule is missing examId.')

      await supabase.from('mock_rules').delete().eq('exam_id', examId)

      const { error } = await supabase
        .from('mock_rules')
        .insert({
          exam_id: examId,
          start_after_phase: rule.start_after_phase ?? rule.startAfterPhase ?? 'foundation',
          frequency_days: rule.frequency_days ?? rule.frequencyDays ?? 7,
          mock_type: rule.mock_type ?? rule.mockType ?? 'sectional',
        })

      if (error) throw error
    }

    for (const rule of data.physical_rules ?? data.physicalRules ?? []) {
      const examId = rule.exam_id ?? rule.examId
      if (!examId || !rule.level) throw new Error('Physical rule is missing examId or level.')

      await supabase.from('physical_rules').delete().eq('exam_id', examId).eq('level', rule.level)

      const { error } = await supabase
        .from('physical_rules')
        .insert({
          exam_id: examId,
          level: rule.level,
          rule_config: rule.rule_config ?? rule.ruleConfig ?? {},
        })

      if (error) throw error
    }

    for (const [index, pyq] of (data.pyq_questions ?? data.pyqQuestions ?? []).entries()) {
      const source = pyq.source ?? 'ai_generated'
      const explicitVerified = pyq.is_verified ?? pyq.isVerified

      if (source === 'verified_pyq' && explicitVerified !== true) {
        throw new Error(`PYQ "${pyq.id ?? index + 1}" uses source=verified_pyq but is not explicitly marked verified.`)
      }

      const isVerified = source === 'verified_pyq'

      const { error } = await supabase
        .from('pyq_questions')
        .upsert({
          id: pyq.id ?? `pyq-${index + 1}`,
          exam_id: pyq.exam_id ?? pyq.examId ?? null,
          year: pyq.year,
          subject_id: pyq.subject_id ?? pyq.subjectId ?? null,
          chapter_id: pyq.chapter_id ?? pyq.chapterId ?? null,
          difficulty: pyq.difficulty ?? 'medium',
          question: pyq.question,
          options: pyq.options ?? [],
          answer: pyq.answer ?? null,
          explanation: pyq.explanation ?? null,
          source,
          is_verified: isVerified,
        }, { onConflict: 'id' })

      if (error) throw error
    }

    for (const [index, quote] of (data.quotes || []).entries()) {
      const { error } = await supabase
        .from('motivational_quotes')
        .upsert({
          id: quote.id ?? `quote-${index + 1}`,
          quote: quote.quote,
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
