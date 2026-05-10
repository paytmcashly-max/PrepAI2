import { BookOpen, Brain, CalendarDays, FileQuestion, type LucideIcon } from 'lucide-react'

export type AIFeatureId =
  | 'study-planner'
  | 'pyq-generator'
  | 'weakness-detector'
  | 'revision-assistant'

export type AIFeatureConfig = {
  id: AIFeatureId
  title: string
  description: string
  endpoint: string
  icon: LucideIcon
  promptPlaceholder: string
}

export const aiFeatureConfigs: AIFeatureConfig[] = [
  {
    id: 'study-planner',
    title: 'AI Study Planner',
    description: 'Future planner suggestions will sit on top of the deterministic study plan.',
    endpoint: '/api/ai/study-planner',
    icon: CalendarDays,
    promptPlaceholder: 'Ask for a smarter weekly focus plan',
  },
  {
    id: 'pyq-generator',
    title: 'AI PYQ Generator',
    description: 'Demo questions will be marked as AI generated, never verified PYQs.',
    endpoint: '/api/ai/pyq-generator',
    icon: FileQuestion,
    promptPlaceholder: 'Request practice questions for a topic',
  },
  {
    id: 'weakness-detector',
    title: 'AI Weakness Detector',
    description: 'Future analysis will use tasks, mocks, and notes to identify weak topics.',
    endpoint: '/api/ai/weakness-detector',
    icon: Brain,
    promptPlaceholder: 'Ask what to improve this week',
  },
  {
    id: 'revision-assistant',
    title: 'AI Revision Assistant',
    description: 'Future revision suggestions will be generated server-side only.',
    endpoint: '/api/ai/revision-assistant',
    icon: BookOpen,
    promptPlaceholder: 'Ask for a revision checklist',
  },
]
