import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function TasksLoading() {
  return (
    <div className="space-y-6 overflow-hidden p-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-72 max-w-full" />
      </div>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex justify-between">
            <Skeleton className="h-12 w-40" />
            <Skeleton className="h-12 w-24" />
          </div>
          <Skeleton className="h-2 w-full" />
        </CardContent>
      </Card>
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-20 w-full" />
      ))}
    </div>
  )
}
