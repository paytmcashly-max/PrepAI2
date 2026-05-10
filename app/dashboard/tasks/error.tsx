'use client'

import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export default function TasksError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="p-6">
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>Daily Tasks could not load</AlertTitle>
        <AlertDescription>
          <p>{error.message || 'Something went wrong while loading your active plan tasks.'}</p>
          <Button variant="outline" size="sm" onClick={reset}>
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  )
}
