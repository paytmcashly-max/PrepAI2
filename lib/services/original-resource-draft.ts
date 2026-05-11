import type { OriginalPracticeQuestion, StudyResource } from '@/lib/types'

type DraftInput = {
  exam: { id: string; name?: string | null }
  subject: { id: string; name?: string | null }
  chapter: { id: string; name?: string | null } | null
  taskType?: string | null
}

type DraftResource = Pick<
  StudyResource,
  | 'id'
  | 'exam_id'
  | 'subject_id'
  | 'chapter_id'
  | 'title'
  | 'description'
  | 'resource_type'
  | 'source_name'
  | 'source_url'
  | 'embed_url'
  | 'video_provider'
  | 'video_id'
  | 'video_search_query'
  | 'video_status'
  | 'channel_name'
  | 'language'
  | 'trust_level'
  | 'content_md'
  | 'how_to_study'
  | 'priority'
  | 'is_active'
>

type DraftQuestion = Pick<
  OriginalPracticeQuestion,
  | 'id'
  | 'exam_id'
  | 'subject_id'
  | 'chapter_id'
  | 'question'
  | 'options'
  | 'answer'
  | 'explanation'
  | 'difficulty'
  | 'practice_category'
  | 'language'
  | 'source_type'
  | 'exam_pattern_note'
  | 'is_active'
>

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'topic'
}

function subjectLabel(subjectId: string, subjectName?: string | null) {
  return subjectName || subjectId.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function practiceCategory(subjectId: string, chapterName: string): DraftQuestion['practice_category'] {
  if (chapterName.toLowerCase().includes('current affairs')) return 'study_method'
  if (subjectId === 'gk_gs' && chapterName.toLowerCase().includes('current')) return 'study_method'
  return 'concept_practice'
}

function resourceType(subjectId: string, chapterName: string): DraftResource['resource_type'] {
  if (subjectId === 'physical') return 'physical_training'
  if (chapterName.toLowerCase().includes('current affairs')) return 'current_affairs'
  return 'concept_note'
}

function buildNotes(examName: string, subjectName: string, chapterName: string, subjectId: string) {
  if (subjectId === 'physical') {
    return [
      `# ${chapterName}`,
      '',
      `## PrepAI Original Training Note`,
      '',
      `${examName} preparation me physical task ka goal safe habit banana hai, injury risk lena nahi.`,
      '',
      '- 5 minute light warmup se start karo.',
      '- Pace aisa rakho jisme breathing control me rahe.',
      '- Har session ke baad stretching aur hydration note karo.',
      '- Agar pain, dizziness, ya unusual breathlessness ho to stop karo.',
      '',
      '## Daily Tracking',
      '',
      'Aaj ka distance/time, energy level, aur recovery note likho. Weekly progress slow and steady rakho.',
    ].join('\n')
  }

  if (practiceCategory(subjectId, chapterName) === 'study_method') {
    return [
      `# ${chapterName}`,
      '',
      `## Study Method Practice`,
      '',
      'Yeh latest facts ka replacement nahi hai. Iska kaam tumhe current affairs padhne ka system sikhana hai.',
      '',
      '- National aur state news ko alag headings me likho.',
      '- Har news se exam point banao: person, place, scheme, date, reason.',
      '- Roz 10 short facts likho aur Sunday ko revise karo.',
      '- Source-based monthly fact practice add hone par factual MCQs alag label ke saath dikhenge.',
      '',
      '## Mistake Pattern',
      '',
      'Headline yaad karna enough nahi hota. Exam point, static link, aur state relevance likhna zaroori hai.',
    ].join('\n')
  }

  return [
    `# ${chapterName}`,
    '',
    `## PrepAI Original Notes`,
    '',
    `${subjectName} ke ${chapterName} chapter ko pehle concept, phir examples, phir timed MCQ practice ke order me padho.`,
    '',
    '- Definition aur basic rule ko apni language me likho.',
    '- 3 solved examples dekho aur pattern identify karo.',
    '- Easy questions se confidence banao.',
    '- Wrong answers ko mistake note me convert karo.',
    '',
    '## Exam Approach',
    '',
    'Question dekhte hi topic, shortcut/rule, aur trap identify karo. Guessing se pehle elimination use karo.',
  ].join('\n')
}

function buildSteps(subjectId: string) {
  if (subjectId === 'physical') {
    return ['Warmup complete karo', 'Main routine safe pace par karo', 'Stretching aur recovery note likho', 'Pain/dizziness ho to stop karo']
  }
  if (subjectId === 'gk_gs') {
    return ['Notes read karo', '10 exam points likho', 'MCQs attempt karo', 'Wrong facts/concepts ko revise list me add karo']
  }
  return ['Concept note read karo', 'Examples solve karo', '10 original MCQs attempt karo', 'Wrong answers ki mistake note banao']
}

function buildQuestions(input: DraftInput, category: DraftQuestion['practice_category']): DraftQuestion[] {
  const chapterName = input.chapter?.name || `${subjectLabel(input.subject.id, input.subject.name)} Basics`
  const baseId = `opq-auto-${slug(input.exam.id)}-${slug(input.chapter?.id || input.subject.id)}`
  const subjectName = subjectLabel(input.subject.id, input.subject.name)

  return Array.from({ length: 10 }).map((_, index) => {
    const n = index + 1
    const isMethod = category === 'study_method'
    const isPhysical = input.subject.id === 'physical'
    const question = isMethod
      ? `${chapterName}: current affairs note banate waqt sabse pehle kya separate karna chahiye? (${n})`
      : isPhysical
        ? `${chapterName}: safe practice ke liye session ki shuruaat kis cheez se karni chahiye? (${n})`
        : `${chapterName}: is topic ko exam me solve karte waqt sabse pehle kya identify karna chahiye? (${n})`
    const answer = isMethod
      ? 'National aur state points ko alag karna'
      : isPhysical
        ? 'Light warmup'
        : 'Topic rule/pattern'

    return {
      id: `${baseId}-${String(n).padStart(2, '0')}`,
      exam_id: input.exam.id,
      subject_id: input.subject.id,
      chapter_id: input.chapter?.id || null,
      question,
      options: isMethod
        ? ['National aur state points ko alag karna', 'Sirf headline yaad karna', 'Source ko ignore karna', 'Random facts mix karna']
        : isPhysical
          ? ['Light warmup', 'Direct sprint', 'Pain ignore karna', 'Cooldown skip karna']
          : ['Topic rule/pattern', 'Random guess', 'Options ignore karna', 'Question skip karna'],
      answer,
      explanation: isMethod
        ? 'Current affairs ko National/State buckets me rakhne se revision aur exam relevance clear hota hai. Yeh study-method practice hai, actual latest fact MCQ nahi.'
        : isPhysical
          ? 'Warmup body ko session ke liye ready karta hai. Safety first; PrepAI medical advice provide nahi karta.'
          : `${subjectName} me ${chapterName} questions ke liye pehle rule/pattern identify karna accuracy badhata hai.`,
      difficulty: n <= 6 ? 'easy' : 'medium',
      practice_category: category,
      language: 'hindi',
      source_type: 'prepai_original',
      exam_pattern_note: 'PrepAI Original Practice - Not Official PYQ',
      is_active: true,
    }
  })
}

export function generatePrepAIOriginalResourceDraft(input: DraftInput): {
  resource: DraftResource
  questions: DraftQuestion[]
} {
  const chapterName = input.chapter?.name || `${subjectLabel(input.subject.id, input.subject.name)} Basics`
  const subjectName = subjectLabel(input.subject.id, input.subject.name)
  const examName = input.exam.name || input.exam.id
  const category = practiceCategory(input.subject.id, chapterName)
  const type = resourceType(input.subject.id, chapterName)
  const resourceId = `res-auto-${slug(input.exam.id)}-${slug(input.chapter?.id || input.subject.id)}`

  const resource: DraftResource = {
    id: resourceId,
    exam_id: input.exam.id,
    subject_id: input.subject.id,
    chapter_id: input.chapter?.id || null,
    title: `${chapterName} - PrepAI Original Notes`,
    description: `${examName} ${subjectName} ke liye PrepAI original notes, how-to-study steps, and original practice.`,
    resource_type: type,
    source_name: 'PrepAI Original',
    source_url: null,
    embed_url: null,
    video_provider: 'youtube',
    video_id: null,
    video_search_query: `${examName} ${subjectName} ${chapterName} preparation Hindi`,
    video_status: 'not_curated',
    channel_name: null,
    language: 'hindi',
    trust_level: 'prepai_original',
    content_md: buildNotes(examName, subjectName, chapterName, input.subject.id),
    how_to_study: buildSteps(input.subject.id),
    priority: 120,
    is_active: true,
  }

  return {
    resource,
    questions: buildQuestions(input, category),
  }
}
