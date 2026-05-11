import type { OriginalPracticeQuestion, StudyResource } from '@/lib/types'

type DraftInput = {
  exam: { id: string; name?: string | null }
  subject: { id: string; name?: string | null }
  chapter: { id: string; name?: string | null } | null
  taskTypes?: string[]
  difficulty?: 'easy' | 'medium' | 'hard'
  language?: string
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

function stableHash(value: string) {
  let hash = 5381
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash) + value.charCodeAt(index)
    hash >>>= 0
  }
  return hash.toString(36)
}

function subjectLabel(subjectId: string, subjectName?: string | null) {
  return subjectName || subjectId.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function isCurrentAffairs(subjectId: string, chapterName: string) {
  const normalized = `${subjectId} ${chapterName}`.toLowerCase()
  return normalized.includes('current affairs') || normalized.includes('current_affairs')
}

function practiceCategory(subjectId: string, chapterName: string): DraftQuestion['practice_category'] {
  if (isCurrentAffairs(subjectId, chapterName)) return 'study_method'
  return 'concept_practice'
}

function resourceType(subjectId: string, chapterName: string): DraftResource['resource_type'] {
  if (subjectId === 'physical') return 'physical_training'
  if (isCurrentAffairs(subjectId, chapterName)) return 'current_affairs'
  return 'concept_note'
}

function buildNotes(examName: string, subjectName: string, chapterName: string, subjectId: string) {
  if (subjectId === 'physical') {
    return [
      `# ${chapterName}`,
      '',
      '## PrepAI Original Training Note',
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

  if (isCurrentAffairs(subjectId, chapterName)) {
    return [
      `# ${chapterName}`,
      '',
      '## Study Method Practice',
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
    '## PrepAI Original Notes',
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
    'Question dekhte hi chapter ka formula, relation, vocabulary meaning, ya static concept identify karo. Guessing se pehle elimination use karo.',
  ].join('\n')
}

function buildSteps(subjectId: string) {
  if (subjectId === 'physical') {
    return ['Warmup complete karo', 'Main routine safe pace par karo', 'Stretching aur recovery note likho', 'Pain/dizziness ho to stop karo']
  }
  if (subjectId === 'gk_gs') {
    return ['Notes read karo', '10 exam points likho', 'Practice attempt karo', 'Wrong facts/concepts ko revise list me add karo']
  }
  return ['Concept note read karo', 'Examples solve karo', 'Original practice attempt karo', 'Wrong answers ki mistake note banao']
}

function makeQuestion(input: DraftInput, question: string, options: string[], answer: string, explanation: string, index: number, category: DraftQuestion['practice_category']): DraftQuestion {
  const chapterId = input.chapter?.id || input.subject.id
  const hash = stableHash(`${input.exam.id}:${input.subject.id}:${chapterId}:${question}:${answer}`)
  return {
    id: `opq-auto:${input.exam.id}:${input.subject.id}:${chapterId}:${hash}`,
    exam_id: input.exam.id,
    subject_id: input.subject.id,
    chapter_id: input.chapter?.id || null,
    question,
    options,
    answer,
    explanation,
    difficulty: input.difficulty || (index <= 6 ? 'easy' : 'medium'),
    practice_category: category,
    language: input.language || 'hindi',
    source_type: 'prepai_original',
    exam_pattern_note: 'PrepAI Original Practice - Not Official PYQ',
    is_active: true,
  }
}

function buildQuestions(input: DraftInput, category: DraftQuestion['practice_category']): DraftQuestion[] {
  const chapterName = input.chapter?.name || `${subjectLabel(input.subject.id, input.subject.name)} Basics`
  const subjectId = input.subject.id
  if (subjectId === 'physical') return []

  const rows: Array<{ question: string; options: string[]; answer: string; explanation: string }> = []

  if (category === 'study_method') {
    rows.push(
      {
        question: `${chapterName}: daily current affairs notes me National aur State points ko kaise rakhna chahiye?`,
        options: ['Alag headings me', 'Ek random list me', 'Sirf headline ke roop me', 'Source ke bina'],
        answer: 'Alag headings me',
        explanation: 'Alag headings revision ko clear banati hain. Yeh study-method practice hai, actual latest fact MCQ nahi.',
      },
      {
        question: `${chapterName}: kisi news ko exam point me convert karte waqt sabse useful format kya hai?`,
        options: ['Who-what-where-why important', 'Sirf title copy', 'Sirf social post', 'Random keyword'],
        answer: 'Who-what-where-why important',
        explanation: 'Exam point banane ke liye person/place/event/relevance likhna zaroori hai.',
      }
    )
  } else if (subjectId === 'maths') {
    rows.push(
      {
        question: `${chapterName}: 24 aur 36 ka HCF kya hai?`,
        options: ['6', '8', '12', '18'],
        answer: '12',
        explanation: '24 ke factors me 12 hai aur 36 ke factors me bhi 12 hai; common factors me sabse bada 12 hai.',
      },
      {
        question: `${chapterName}: 25% ko fraction me kaise likhenge?`,
        options: ['1/2', '1/3', '1/4', '1/5'],
        answer: '1/4',
        explanation: '25% = 25/100 = 1/4.',
      },
      {
        question: `${chapterName}: 3:5 ratio ka total parts kitna hai?`,
        options: ['2', '5', '8', '15'],
        answer: '8',
        explanation: 'Ratio ke total parts 3 + 5 = 8 hote hain.',
      }
    )
  } else if (subjectId === 'reasoning') {
    rows.push(
      {
        question: `${chapterName}: Book : Reading :: Pen : ?`,
        options: ['Writing', 'Running', 'Cooking', 'Singing'],
        answer: 'Writing',
        explanation: 'Book ka use reading ke liye hota hai; pen ka use writing ke liye hota hai.',
      },
      {
        question: `${chapterName}: 2, 4, 8, 16, ? series ka next number kya hai?`,
        options: ['18', '24', '30', '32'],
        answer: '32',
        explanation: 'Har step me number double ho raha hai: 2, 4, 8, 16, 32.',
      },
      {
        question: `${chapterName}: Apple, Mango, Potato, Banana me odd one out kya hai?`,
        options: ['Apple', 'Mango', 'Potato', 'Banana'],
        answer: 'Potato',
        explanation: 'Apple, Mango, Banana fruits hain; Potato vegetable hai.',
      }
    )
  } else if (subjectId === 'hindi') {
    rows.push(
      {
        question: `${chapterName}: 'आरंभ' ka उचित विलोम क्या है?`,
        options: ['शुरुआत', 'प्रारंभ', 'समाप्ति', 'उदय'],
        answer: 'समाप्ति',
        explanation: 'आरंभ का अर्थ शुरुआत है, इसलिए उसका विलोम समाप्ति है.',
      },
      {
        question: `${chapterName}: 'सुंदर' ka निकट अर्थ वाला शब्द कौन सा है?`,
        options: ['कुरूप', 'मनोरम', 'कठोर', 'दूर'],
        answer: 'मनोरम',
        explanation: 'सुंदर और मनोरम समान अर्थ वाले शब्द हैं.',
      },
      {
        question: `${chapterName}: 'आंखों का तारा' मुहावरे का अर्थ क्या है?`,
        options: ['बहुत प्रिय', 'बहुत दूर', 'बहुत कठिन', 'बहुत तेज'],
        answer: 'बहुत प्रिय',
        explanation: 'आंखों का तारा का अर्थ अत्यंत प्रिय व्यक्ति होता है.',
      }
    )
  } else if (subjectId === 'gk_gs' || subjectId === 'general_awareness') {
    rows.push(
      {
        question: `${chapterName}: भारतीय संविधान की प्रस्तावना किस बात को बताती है?`,
        options: ['संविधान के मूल आदर्श', 'रेलवे समय-सारणी', 'खेल नियम', 'बैंक ब्याज दर'],
        answer: 'संविधान के मूल आदर्श',
        explanation: 'प्रस्तावना संविधान के मूल आदर्शों और उद्देश्यों को व्यक्त करती है.',
      },
      {
        question: `${chapterName}: static GK पढ़ते समय सबसे बेहतर नोट किस प्रकार का होता है?`,
        options: ['Topic-wise short facts', 'Unverified latest rumors', 'Random screenshots', 'Blank notes'],
        answer: 'Topic-wise short facts',
        explanation: 'Static GK में topic-wise short facts revision को तेज और reliable बनाते हैं.',
      }
    )
  }

  return rows.slice(0, 10).map((row, index) => makeQuestion(input, row.question, row.options, row.answer, row.explanation, index + 1, category))
}

export function generatePrepAIResourceDraft(input: DraftInput): {
  resource: DraftResource
  questions: DraftQuestion[]
  skippedPracticeReason: string | null
} {
  const chapterName = input.chapter?.name || `${subjectLabel(input.subject.id, input.subject.name)} Basics`
  const subjectName = subjectLabel(input.subject.id, input.subject.name)
  const examName = input.exam.name || input.exam.id
  const category = practiceCategory(input.subject.id, chapterName)
  const type = resourceType(input.subject.id, chapterName)
  const chapterId = input.chapter?.id || input.subject.id
  const resourceId = `auto-resource:${input.exam.id}:${input.subject.id}:${chapterId}:notes`
  const language = input.language || 'hindi'

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
    language,
    trust_level: 'prepai_original',
    content_md: buildNotes(examName, subjectName, chapterName, input.subject.id),
    how_to_study: buildSteps(input.subject.id),
    priority: 120,
    is_active: true,
  }

  const questions = buildQuestions({ ...input, language }, category)
  return {
    resource,
    questions,
    skippedPracticeReason: questions.length === 0 ? 'No safe chapter-specific original MCQs generated for this subject.' : null,
  }
}

export const generatePrepAIOriginalResourceDraft = generatePrepAIResourceDraft
