import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function ResourceLoading() {
  return (
    <div className="space-y-6 overflow-hidden p-4 sm:p-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-10 w-80 max-w-full" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-10/12" />
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
