export const SUPPORTED_EXAM_IDS = ['bihar_si', 'up_police', 'ssc_gd'] as const

export type SupportedExamId = (typeof SUPPORTED_EXAM_IDS)[number]

const supportedExamIdSet = new Set<string>(SUPPORTED_EXAM_IDS)

export function isSupportedExamId(examId: string | null | undefined): examId is SupportedExamId {
  return Boolean(examId && supportedExamIdSet.has(examId))
}

export function supportedExamFilterValue() {
  return `(${SUPPORTED_EXAM_IDS.join(',')})`
}
