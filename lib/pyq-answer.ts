export type NormalizedPYQAnswer = {
  raw: string
  text: string
  optionLetter: string | null
  numericValue: number | null
  numericUnit: 'percent' | 'number' | null
}

function toNumericValue(value: string) {
  const percentText = value.replace(/\s+/g, ' ').trim()
  const percentMatch = percentText.match(/^(-?\d+(?:\.\d+)?)\s*(%|percent)$/i)
  if (percentMatch) {
    return {
      numericValue: Number(percentMatch[1]),
      numericUnit: 'percent' as const,
    }
  }

  const numberMatch = percentText.match(/^-?\d+(?:\.\d+)?$/)
  if (numberMatch) {
    return {
      numericValue: Number(percentText),
      numericUnit: 'number' as const,
    }
  }

  return {
    numericValue: null,
    numericUnit: null,
  }
}

export function normalizePYQAnswer(value: string | null | undefined): NormalizedPYQAnswer {
  const raw = (value || '').trim()
  const text = raw
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[।]/g, '.')
    .trim()

  const optionMatch = text.match(/^(?:option\s*[:\-]?\s*)?[\(\[]?([a-d])[\)\].:]?$/i)
  const numeric = toNumericValue(text)

  return {
    raw,
    text,
    optionLetter: optionMatch?.[1]?.toUpperCase() || null,
    numericValue: numeric.numericValue,
    numericUnit: numeric.numericUnit,
  }
}

function optionLetterForText(value: string, options: string[]) {
  const normalizedValue = normalizePYQAnswer(value).text
  const index = options.findIndex((option) => normalizePYQAnswer(option).text === normalizedValue)
  return index >= 0 ? String.fromCharCode(65 + index) : null
}

function optionTextForLetter(letter: string | null, options: string[]) {
  if (!letter) return null
  const index = letter.charCodeAt(0) - 65
  return index >= 0 && index < options.length ? options[index] : null
}

export function pyqAnswersMatch(
  selectedAnswer: string | null | undefined,
  correctAnswer: string | null | undefined,
  options: string[] = []
) {
  const selected = normalizePYQAnswer(selectedAnswer)
  const correct = normalizePYQAnswer(correctAnswer)

  if (!selected.text || !correct.text) return false
  if (selected.text === correct.text) return true

  if (
    selected.numericValue !== null
    && correct.numericValue !== null
    && selected.numericUnit === correct.numericUnit
    && selected.numericValue === correct.numericValue
  ) {
    return true
  }

  const selectedLetter = selected.optionLetter || optionLetterForText(selected.raw, options)
  const correctLetter = correct.optionLetter || optionLetterForText(correct.raw, options)
  if (selectedLetter && correctLetter && selectedLetter === correctLetter) return true

  const selectedOptionText = optionTextForLetter(selectedLetter, options)
  const correctOptionText = optionTextForLetter(correctLetter, options)
  if (selectedOptionText && normalizePYQAnswer(selectedOptionText).text === correct.text) return true
  if (correctOptionText && normalizePYQAnswer(correctOptionText).text === selected.text) return true

  return false
}
