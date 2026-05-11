export type OriginalPracticeQualityInput = {
  question: string
  options: string[]
  answer: string
  explanation: string | null | undefined
}

const genericQuestionPatterns = [
  /sabse pehle kya identify/i,
  /exam question solve karte waqt/i,
  /topic rule\/pattern/i,
  /\(\s*\d+\s*\)\s*$/,
]

const genericOptions = new Set([
  'topic rule/pattern',
  'random guess',
  'options ignore karna',
  'question skip karna',
])

function normalized(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

export function validateOriginalPracticeQuestion(input: OriginalPracticeQualityInput): string[] {
  const errors: string[] = []
  const question = input.question.trim()
  const answer = input.answer.trim()
  const options = input.options.map((option) => option.trim()).filter(Boolean)
  const normalizedOptions = options.map(normalized)

  if (!question) errors.push('question_empty')
  if (options.length < 4) errors.push('options_less_than_4')
  if (new Set(normalizedOptions).size !== options.length) errors.push('duplicate_options')
  if (!normalizedOptions.includes(normalized(answer))) errors.push('answer_not_in_options')
  if (!input.explanation || input.explanation.trim().length < 12) errors.push('explanation_missing')
  if (genericQuestionPatterns.some((pattern) => pattern.test(question))) errors.push('generic_question')

  const genericOptionCount = normalizedOptions.filter((option) => genericOptions.has(option)).length
  if (genericOptionCount >= 2) errors.push('generic_options')

  const firstWords = options.map((option) => normalized(option).split(' ').slice(0, 2).join(' '))
  if (options.length >= 4 && new Set(firstWords).size <= 1) errors.push('options_too_similar')

  return errors
}
