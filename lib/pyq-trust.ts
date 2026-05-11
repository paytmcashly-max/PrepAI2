import type { PYQSource, PYQVerificationStatus } from '@/lib/types'

export type PYQTrustLevel = 'trusted_third_party'
export type PYQTrustedSourceBehavior = 'system_validate_if_complete'

export interface PYQTrustedSourceConfig {
  name: string
  normalizedName: string
  trust_level: PYQTrustLevel
  default_behavior: PYQTrustedSourceBehavior
}

export interface PYQAutoValidationInput {
  source: PYQSource
  source_name: string | null
  source_reference: string | null
  source_url: string | null
  exam_id: string | null
  year: number | null
  subject_id: string | null
  chapter_id: string | null
  question: string | null
  answer: string | null
  mappingValid: boolean
  duplicateFound: boolean
}

export interface PYQAutoValidationResult {
  verification_status: PYQVerificationStatus
  auto_review_score: number
  auto_review_flags: string[]
  auto_rejection_reason: string | null
}

const TRUSTED_SOURCE_NAMES = [
  'Testbook',
  'Adda247',
  'SSCAdda',
  'CareerPower',
]

export const TRUSTED_THIRD_PARTY_SOURCES: PYQTrustedSourceConfig[] = TRUSTED_SOURCE_NAMES.map((name) => ({
  name,
  normalizedName: normalizeSourceName(name),
  trust_level: 'trusted_third_party',
  default_behavior: 'system_validate_if_complete',
}))

export function normalizeSourceName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, '')
}

export function getTrustedThirdPartySource(name: string | null | undefined) {
  if (!name) return null
  const normalized = normalizeSourceName(name)
  return TRUSTED_THIRD_PARTY_SOURCES.find((source) => source.normalizedName === normalized) || null
}

function looksOfficialSource(value: string | null | undefined) {
  if (!value) return false
  const normalized = value.toLowerCase()
  return [
    'official',
    'bpssc.bihar.gov.in',
    'uppbpb.gov.in',
    'ssc.gov.in',
    'ssc.nic.in',
    'staff selection commission',
  ].some((token) => normalized.includes(token))
}

function scoreFromFlags(flags: string[]) {
  return Math.max(0, 100 - flags.length * 12)
}

export function autoValidatePYQInput(data: PYQAutoValidationInput): PYQAutoValidationResult {
  const flags: string[] = []

  if (!data.exam_id) flags.push('missing_exam_id')
  if (!data.year) flags.push('missing_year')
  if (!data.subject_id) flags.push('missing_subject_id')
  if (!data.question?.trim()) flags.push('missing_question')
  if (!data.answer?.trim()) flags.push('missing_answer')
  if (!data.mappingValid) flags.push('invalid_exam_subject_or_chapter_mapping')
  if (data.duplicateFound) flags.push('possible_duplicate')

  if (data.source_url?.trim().toLowerCase().startsWith('http')) {
    try {
      new URL(data.source_url)
    } catch {
      flags.push('invalid_source_url')
    }
  }

  if (data.source === 'verified_pyq') {
    if (!data.chapter_id) flags.push('missing_chapter_id')
    if (!data.source_reference?.trim()) flags.push('missing_source_reference')
    if (!looksOfficialSource(data.source_reference) && !looksOfficialSource(data.source_name) && !looksOfficialSource(data.source_url)) {
      flags.push('official_source_reference_not_detected')
    }

    const auto_review_score = scoreFromFlags(flags)
    return {
      verification_status: flags.length === 0 ? 'official_verified' : 'needs_manual_review',
      auto_review_score,
      auto_review_flags: flags,
      auto_rejection_reason: null,
    }
  }

  if (data.source === 'trusted_third_party') {
    if (!data.source_name?.trim()) flags.push('missing_source_name')
    if (!data.source_reference?.trim()) flags.push('missing_source_reference')
    if (data.source_name?.trim() && !getTrustedThirdPartySource(data.source_name)) {
      flags.push('source_not_in_trusted_config')
    }

    const severeFlags = flags.filter((flag) => (
      flag === 'missing_question'
      || flag === 'missing_answer'
      || flag === 'missing_exam_id'
      || flag === 'missing_subject_id'
      || flag === 'invalid_exam_subject_or_chapter_mapping'
      || flag === 'invalid_source_url'
    ))
    const auto_review_score = scoreFromFlags(flags)

    if (severeFlags.length > 0) {
      return {
        verification_status: 'auto_rejected',
        auto_review_score,
        auto_review_flags: flags,
        auto_rejection_reason: severeFlags.join(', '),
      }
    }

    return {
      verification_status: flags.length === 0 ? 'system_validated' : 'needs_manual_review',
      auto_review_score,
      auto_review_flags: flags,
      auto_rejection_reason: null,
    }
  }

  if (data.source === 'memory_based') {
    if (!data.source_reference?.trim()) flags.push('missing_source_reference')
    return {
      verification_status: flags.length === 0 ? 'memory_based' : 'needs_manual_review',
      auto_review_score: scoreFromFlags(flags),
      auto_review_flags: flags,
      auto_rejection_reason: null,
    }
  }

  return {
    verification_status: 'ai_practice',
    auto_review_score: scoreFromFlags(flags),
    auto_review_flags: flags,
    auto_rejection_reason: null,
  }
}
