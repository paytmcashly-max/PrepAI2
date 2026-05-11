'use client'

import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export default function ResourceError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="p-4 sm:p-6">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Resource could not load</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{error.message || 'Something went wrong while loading this study resource.'}</p>
          <Button variant="outline" size="sm" onClick={reset}>Try again</Button>
        </AlertDescription>
      </Alert>
    </div>
  )
}
