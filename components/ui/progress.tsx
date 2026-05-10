'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'

import { cn } from '@/lib/utils'

function clampProgress(value: number | null | undefined) {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value || 0))
}

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const progressValue = clampProgress(value)

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        'bg-primary/20 relative h-2 w-full overflow-hidden rounded-full',
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-primary h-full transition-[width]"
        style={{ width: `${progressValue}%` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
