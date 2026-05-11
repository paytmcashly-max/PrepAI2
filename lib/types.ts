// Database types for PrepTrack

export interface Exam {
  id: string
  name: string
  level: string | null
  category: string | null
  primary_language: string | null
  focus: string[]
  recommended_for: string[]
  selection_stages: string[]
  source_notes: string | null
  created_at: string
}

export interface Subject {
  id: string
  name: string
  icon: string | null
  color: string | null
  order_index: number
  created_at: string
}

export interface Chapter {
  id: string
  exam_id: string | null
  subject_id: string
  chapter_key: string | null
  name: string
  priority: 'low' | 'medium' | 'high'
  difficulty: 'easy' | 'medium' | 'hard'
  estimated_minutes: number
  order_index: number
  tags: string[]
  aliases: string[]
  created_at: string
}

export interface RoadmapPhase {
  id: string
  name: string
  start_day: number
  end_day: number
  goal: string | null
  created_at: string
}

export interface Profile {
  id: string
  full_name: string | null
  exam_target: string | null
  target_days: number
  daily_study_hours: number
  start_date: string | null
  maths_level: 'weak' | 'average' | 'good'
  physical_level: 'weak' | 'average' | 'good'
  english_background: boolean
  study_language: 'hindi' | 'english'
  current_education: string | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface UserStudyPlan {
  id: string
  user_id: string
  exam_id: string
  target_days: number
  daily_study_hours: number
  start_date: string
  status: 'active' | 'paused' | 'completed' | 'archived' | 'generating' | 'failed'
  created_at: string
}

export interface UserDailyTask {
  id: string
  user_id: string
  plan_id: string
  day_number: number
  task_date: string
  exam_id: string
  subject_id: string | null
  chapter_id: string | null
  title: string
  description: string | null
  task_type: 'concept' | 'practice' | 'revision' | 'mock' | 'physical' | 'pyq' | 'notes'
  estimated_minutes: number
  priority: 'low' | 'medium' | 'high'
  how_to_study: string[]
  status: 'pending' | 'completed' | 'skipped'
  completed_at: string | null
  created_at: string
  subject?: Subject | null
  chapter?: Chapter | null
  studyResources?: StudyResource[]
  originalPracticeSummary?: TaskStudyResourceSummary
}

export type StudyResourceType =
  | 'concept_note'
  | 'pdf_note'
  | 'video_embed'
  | 'external_link'
  | 'mcq_practice'
  | 'current_affairs'
  | 'physical_training'

export type StudyResourceTrustLevel =
  | 'prepai_original'
  | 'official'
  | 'trusted_third_party'
  | 'general_reference'

export interface StudyResource {
  id: string
  exam_id: string | null
  subject_id: string | null
  chapter_id: string | null
  title: string
  description: string | null
  resource_type: StudyResourceType
  source_name: string
  source_url: string | null
  embed_url: string | null
  video_provider: string | null
  video_id: string | null
  language: string
  trust_level: StudyResourceTrustLevel
  content_md: string | null
  how_to_study: string[]
  priority: number
  is_active: boolean
  created_at: string
  updated_at: string
  subject?: Subject | null
  chapter?: Chapter | null
  exam?: Exam | null
}

export interface OriginalPracticeQuestion {
  id: string
  exam_id: string
  subject_id: string
  chapter_id: string | null
  question: string
  options: string[]
  answer: string
  explanation: string | null
  difficulty: 'easy' | 'medium' | 'hard'
  language: string
  source_type: 'prepai_original'
  exam_pattern_note: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  subject?: Subject | null
  chapter?: Chapter | null
  exam?: Exam | null
  attempt?: OriginalPracticeAttempt | null
}

export interface OriginalPracticeAttempt {
  id: string
  user_id: string
  question_id: string
  selected_answer: string | null
  is_correct: boolean | null
  marked_for_revision: boolean
  mistake_note: string | null
  attempted_at: string
  updated_at: string
  question?: OriginalPracticeQuestion | null
}

export interface TaskStudyResourceSummary {
  availableQuestionCount: number
  attemptedCount: number
  incorrectCount: number
  markedForRevisionCount: number
}

export interface OriginalPracticeProgressSummary {
  totalQuestions: number
  attemptedCount: number
  correctCount: number
  incorrectCount: number
  accuracyPercentage: number
  markedForRevisionCount: number
}

export interface MockTest {
  id: string
  user_id?: string | null
  exam_id: string | null
  title: string
  description: string | null
  total_questions: number
  duration_minutes?: number | null
  is_active: boolean
  test_date?: string | null
  total_marks?: number | null
  marks_obtained?: number | null
  weak_areas?: string[]
  mistakes?: string | null
  notes?: string | null
  created_at: string
}

export interface MockTestQuestion {
  id: string
  mock_test_id: string
  subject_id: string | null
  question: string
  options: string[]
  correct_answer: string
  explanation: string | null
  difficulty: 'easy' | 'medium' | 'hard'
  order_index: number
  created_at: string
  subject?: Subject
}

export interface MockTestAttempt {
  id: string
  user_id: string
  mock_test_id: string
  test_date: string
  total_marks: number | null
  marks_obtained: number | null
  correct_answers: number
  wrong_answers: number
  unanswered: number
  time_taken_seconds: number | null
  answers: Record<string, string>
  weak_areas: string[]
  mistakes: string | null
  notes: string | null
  status: 'in_progress' | 'completed' | 'abandoned'
  started_at: string
  completed_at: string | null
  created_at: string
  mock_test?: MockTest
}

export interface Note {
  id: string
  user_id: string
  title: string
  subject_id: string | null
  chapter_id: string | null
  chapter: string | null
  content: string | null
  tags: string[]
  created_at: string
  updated_at: string
  subject?: Subject
  chapter_ref?: Chapter | null
}

export type PYQSource =
  | 'verified_pyq'
  | 'trusted_third_party'
  | 'memory_based'
  | 'ai_generated'

export type PYQVerificationStatus =
  | 'official_verified'
  | 'system_validated'
  | 'needs_manual_review'
  | 'third_party_reviewed'
  | 'in_review'
  | 'memory_based'
  | 'ai_practice'
  | 'auto_rejected'

export interface PYQQuestion {
  id: string
  exam_id: string | null
  year: number
  subject_id: string | null
  chapter_id: string | null
  chapter: string | null
  topic: string | null
  difficulty: 'easy' | 'medium' | 'hard'
  question: string
  options: string[]
  answer: string | null
  explanation: string | null
  source: PYQSource | null
  source_reference: string | null
  source_name: string | null
  source_url: string | null
  verification_status: PYQVerificationStatus | null
  reviewed_by: string | null
  reviewed_at: string | null
  review_note: string | null
  updated_by: string | null
  updated_at: string | null
  auto_review_score: number | null
  auto_review_flags: string[] | null
  auto_reviewed_at: string | null
  auto_rejection_reason: string | null
  is_verified: boolean
  frequency: number
  created_at: string
  subject?: Subject
  exam?: Exam | null
  chapter_ref?: Chapter | null
  attempt?: UserPYQAttempt | null
}

export interface UserPYQAttempt {
  id: string
  user_id: string
  pyq_question_id: string
  selected_answer: string | null
  is_correct: boolean | null
  marked_for_revision: boolean
  mistake_note: string | null
  attempted_at: string
  updated_at: string
  question?: PYQQuestion | null
}

export interface PYQProgressBucket {
  id: string | null
  name: string
  incorrectCount: number
  attemptedCount: number
}

export interface PYQRecentAttempt {
  id: string
  questionId: string
  question: string
  selectedAnswer: string | null
  isCorrect: boolean | null
  markedForRevision: boolean
  attemptedAt: string
  subjectName: string | null
  chapterName: string | null
}

export interface PYQProgressSummary {
  totalVisiblePYQs: number
  attemptedCount: number
  correctCount: number
  incorrectCount: number
  accuracyPercentage: number
  markedForRevisionCount: number
  weakestSubjects: PYQProgressBucket[]
  weakestChapters: PYQProgressBucket[]
  recentAttempts: PYQRecentAttempt[]
}

export interface AdaptiveRevisionRecommendation {
  id: string
  chapter_id: string | null
  subject_id: string | null
  chapter_name: string | null
  subject_name: string | null
  title: string
  reason: string
  priority: 'low' | 'medium' | 'high'
  suggested_minutes: number
  action_type: 'pyq_review' | 'revision_task'
  actionTarget: string
  incorrectCount: number
  markedCount: number
  pendingTaskCount: number
}

export type CoachActionResult = {
  source: 'groq' | 'fallback'
  suggestions?: string[]
  explanation?: string
  warning: string
  fallbackReason?: string
}

export interface MotivationalQuote {
  id: string
  quote: string
  author: string | null
  category?: string | null
  created_at: string
}

// Dashboard Stats Types
export interface DashboardStats {
  activePlanId: string | null
  currentStreak: number
  tasksCompletedThisMonth: number
  topicsCovered: number
  totalTopics: number
  avgMockScore: number
  currentDay: number
  totalDays: number
  todayTaskCount: number
  todayCompletedCount: number
  overallTaskCount: number
  overallCompletedCount: number
  planState?: 'starts-soon' | 'active' | 'completed' | 'missing'
}

export interface SubjectProgress {
  id: string
  name: string
  icon: string | null
  color: string
  completedTasks: number
  totalTasks: number
  percentage: number
  currentChapter?: string | null
  weakChapters?: string[]
}

export interface RoadmapSubject extends Subject {
  totalTasks: number
  averageMinutes: number
}

export interface SubjectChapterProgress extends Chapter {
  completedTasks: number
  totalTasks: number
  percentage: number
  status: 'not_started' | 'in_progress' | 'completed'
}

export interface ActivePlanSubjectDetail {
  plan: UserStudyPlan | null
  subject: Subject | null
  chapters: SubjectChapterProgress[]
  completedTasks: number
  totalTasks: number
  percentage: number
}

export interface WeakArea {
  subject_id: string | null
  subject_name: string | null
  chapter_id: string | null
  chapter_name: string | null
  reason: string
  priority: 'low' | 'medium' | 'high'
  suggested_action: string
  actionTarget?: string | null
}

export interface RevisionWeakChapter {
  subject_id: string | null
  subject_name: string | null
  chapter_id: string | null
  chapter_name: string
  pendingTasks: number
  totalTasks: number
  completedTasks: number
  priority: 'low' | 'medium' | 'high'
}

export interface RevisionQueueItem {
  id: string
  title: string
  reason: string
  priority: 'low' | 'medium' | 'high'
  actionTarget: string
}

export interface RevisionQueueData {
  plan: UserStudyPlan | null
  currentDay: number
  overdueTasks: UserDailyTask[]
  weakChapters: RevisionWeakChapter[]
  mockWeakAreas: Array<{
    area: string
    count: number
  }>
  adaptiveRecommendations: AdaptiveRevisionRecommendation[]
  pyqRevisionItems: Array<{
    id: string
    questionId: string
    question: string
    subject_id: string | null
    subject_name: string | null
    chapter_id: string | null
    chapter_name: string | null
    reason: string
    priority: 'low' | 'medium' | 'high'
    marked_for_revision: boolean
    is_correct: boolean | null
    attempted_at: string
    actionTarget: string
  }>
  originalPracticeRevisionItems: Array<{
    id: string
    questionId: string
    question: string
    subject_id: string | null
    subject_name: string | null
    chapter_id: string | null
    chapter_name: string | null
    mistake_note: string | null
    reason: string
    priority: 'low' | 'medium' | 'high'
    marked_for_revision: boolean
    is_correct: boolean | null
    attempted_at: string
    actionTarget: string
  }>
  currentWeekRevisionTasks: UserDailyTask[]
  suggestedOrder: RevisionQueueItem[]
}

export interface BacklogTaskGroup {
  id: string
  subject_id: string | null
  subject_name: string
  date: string
  tasks: UserDailyTask[]
  totalCount: number
  totalMinutes: number
}

export interface BacklogData {
  plan: UserStudyPlan | null
  overdueTasks: UserDailyTask[]
  groups: BacklogTaskGroup[]
  totalCount: number
}

export interface AdminDebugSubjectDistribution {
  subjectId: string | null
  subjectName: string
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  skippedTasks: number
}

export interface AdminDebugSnapshot {
  health: {
    appVersion: string
    latestCommit: string
    groqConfigured: boolean
  }
  user: {
    id: string
    email: string | null
  }
  activePlan: {
    id: string
    examId: string
    examName: string
    targetDays: number
    currentDay: number
  } | null
  archivedPlanCount: number
  taskCounts: {
    total: number
    today: number
    completed: number
    pending: number
    skipped: number
    overduePending: number
  }
  subjectDistribution: AdminDebugSubjectDistribution[]
  weakAreasCount: number
  revisionQueueCounts: {
    overdueTasks: number
    weakChapters: number
    mockWeakAreas: number
    adaptiveRecommendations: number
    pyqRevisionItems: number
    originalPracticeRevisionItems: number
    currentWeekRevisionTasks: number
    suggestedOrder: number
  }
  pyqCounts: {
    total: number
    visible: number
    verified: number
    trustedThirdParty: number
    systemValidated: number
    needsManualReview: number
    trustedThirdPartyInReview: number
    trustedThirdPartyReviewed: number
    autoRejected: number
    memoryBased: number
    aiPractice: number
  }
  pyqAttemptCounts: {
    total: number
    incorrect: number
    markedForRevision: number
  }
  originalPracticeCounts: {
    resourcesTotal: number
    resourcesActive: number
    questionsTotal: number
    attemptsTotal: number
    incorrectAttempts: number
    markedForRevision: number
  }
  mockResultCount: number
}

export interface PlanSettingsData {
  plan: UserStudyPlan | null
  profile: Profile | null
  exams: Exam[]
}

export interface WeeklyTaskData {
  day: string
  completed: number
  pending: number
}

export interface DayTaskGroup {
  id: string
  day: number
  date: string
  phaseId: string | null
  phaseName: string | null
  isRevisionDay: boolean
  tasks: UserDailyTask[]
  completedCount: number
  totalCount: number
}
