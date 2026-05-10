import {
  BookOpen,
  BookText,
  Brain,
  Calculator,
  Dumbbell,
  Globe2,
  Languages,
  Monitor,
  Newspaper,
  type LucideIcon,
} from 'lucide-react'

const iconRegistry: Record<string, LucideIcon> = {
  BookOpen,
  BookText,
  Brain,
  Calculator,
  Dumbbell,
  Globe2,
  Languages,
  Monitor,
  Newspaper,
}

interface SubjectIconProps {
  icon: string | null | undefined
  className?: string
}

export function SubjectIcon({ icon, className }: SubjectIconProps) {
  const Icon = icon ? iconRegistry[icon] : undefined
  const ResolvedIcon = Icon || BookOpen

  return <ResolvedIcon className={className} />
}
