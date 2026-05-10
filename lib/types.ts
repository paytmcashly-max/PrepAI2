// Database types for PrepTrack

export interface Exam {
  id: string
  name: string
  level: string | null
  focus: string[]
  selection_stages: string[]
  created_at: string
}

export interface Subject {
  id: string
  name: string
  icon: string | null
  color: string | null
  created_at: string
}

export interface Chapter {
  id: string
  subject_id: string
  name: string
  order_index: number
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

export interface DailyPlan {
  id: string
  day: number
  phase_id: string | null
  is_revision_day: boolean
  created_at: string
  phase?: RoadmapPhase
}

export interface DailyTask {
  id: string
  daily_plan_id: string
  subject_id: string | null
  title: string
  chapter: string | null
  task: string | null
  how_to_study: string[]
  estimated_minutes: number
  priority: 'low' | 'medium' | 'high'
  order_index: number
  created_at: string
  subject?: Subject
  daily_plan?: DailyPlan
}

export interface Profile {
  id: string
  full_name: string | null
  exam_target: string | null
  daily_study_hours: number
  start_date: string | null
  created_at: string
  updated_at: string
}

export interface TaskCompletion {
  id: string
  user_id: string
  daily_task_id: string
  completed: boolean
  completed_at: string | null
  created_at: string
}

export interface MockTest {
  id: string
  exam_id: string | null
  title: string
  description: string | null
  total_questions: number
  duration_minutes: number
  is_active: boolean
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
  chapter: string | null
  content: string | null
  tags: string[]
  created_at: string
  updated_at: string
  subject?: Subject
}

export interface PYQQuestion {
  id: string
  exam_id: string | null
  year: number
  subject_id: string | null
  chapter: string | null
  topic: string | null
  difficulty: 'easy' | 'medium' | 'hard'
  question: string
  options: string[]
  answer: string | null
  explanation: string | null
  source: string | null
  is_verified: boolean
  frequency: number
  created_at: string
  subject?: Subject
}

export interface MotivationalQuote {
  id: string
  quote: string
  author: string | null
  created_at: string
}

// Dashboard Stats Types
export interface DashboardStats {
  currentStreak: number
  tasksCompletedThisMonth: number
  topicsCovered: number
  totalTopics: number
  avgMockScore: number
  currentDay: number
  totalDays: number
}

export interface SubjectProgress {
  id: string
  name: string
  color: string
  completedTasks: number
  totalTasks: number
  percentage: number
}

export interface WeeklyTaskData {
  day: string
  completed: number
  pending: number
}

// Daily Task with completion status
export interface DailyTaskWithStatus extends DailyTask {
  isCompleted: boolean
  completedAt: string | null
}

export interface DayTaskGroup {
  id: string
  day: number
  date: string
  phaseId: string | null
  phaseName: string | null
  isRevisionDay: boolean
  tasks: DailyTaskWithStatus[]
  completedCount: number
  totalCount: number
}
