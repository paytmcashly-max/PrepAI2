import { notFound } from 'next/navigation'
import { AlertTriangle, ClipboardList, Database, ShieldAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin-auth'
import { getAdminDebugSnapshot } from '@/lib/queries'

export const metadata = {
  title: 'Admin Debug | PrepTrack',
}

function MetricCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardContent className="space-y-1 pt-6">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="break-words text-3xl font-bold tracking-tight">{value}</p>
        {detail && <p className="break-words text-xs text-muted-foreground">{detail}</p>}
      </CardContent>
    </Card>
  )
}

function MetricTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded-lg border bg-muted/30 p-4">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="break-words text-2xl font-bold tracking-tight">{value}</p>
    </div>
  )
}

export default async function AdminDebugPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdminEmail(user.email)) {
    notFound()
  }

  const snapshot = await getAdminDebugSnapshot({
    id: user.id,
    email: user.email,
  })

  const planLabel = snapshot.activePlan
    ? `${snapshot.activePlan.examName} (${snapshot.activePlan.examId})`
    : 'No active plan'

  return (
    <div className="space-y-6 overflow-hidden p-6">
      <div className="space-y-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="break-words text-3xl font-bold tracking-tight">Admin Debug</h1>
            <p className="break-words text-muted-foreground">
              Active-plan diagnostics for the currently signed-in user.
            </p>
          </div>
          <Badge variant="destructive" className="w-fit">Admin only</Badge>
        </div>

        <Alert className="border-amber-500/40 bg-amber-500/10">
          <ShieldAlert className="h-4 w-4 text-amber-500" />
          <AlertTitle>Admin/debug only</AlertTitle>
          <AlertDescription className="break-words">
            This page contains private user and plan diagnostics. Do not share screenshots or expose this route to normal users.
          </AlertDescription>
        </Alert>
      </div>

      {!snapshot.activePlan && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No active plan found</AlertTitle>
          <AlertDescription>
            Plan-scoped task, subject, weak-area, and revision metrics are shown as zero because this user has no active study plan.
          </AlertDescription>
        </Alert>
      )}

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Current User And Plan
          </CardTitle>
          <CardDescription>Identifiers and active-plan metadata.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p className="break-words font-mono text-sm">{snapshot.user.email || 'Unknown'}</p>
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-muted-foreground">User ID</p>
            <p className="break-words font-mono text-sm">{snapshot.user.id}</p>
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Active Plan ID</p>
            <p className="break-words font-mono text-sm">{snapshot.activePlan?.id || 'None'}</p>
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Active Exam</p>
            <p className="break-words text-sm font-medium">{planLabel}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Target Days" value={snapshot.activePlan?.targetDays || 0} />
        <MetricCard label="Current Day" value={snapshot.activePlan?.currentDay || 0} />
        <MetricCard label="Archived Plans" value={snapshot.archivedPlanCount} />
        <MetricCard label="Today Tasks" value={snapshot.taskCounts.today} detail="day_number=currentDay OR task_date=today" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Total Active Tasks" value={snapshot.taskCounts.total} />
        <MetricCard label="Completed Tasks" value={snapshot.taskCounts.completed} />
        <MetricCard label="Pending Tasks" value={snapshot.taskCounts.pending} />
        <MetricCard label="Skipped Tasks" value={snapshot.taskCounts.skipped} />
        <MetricCard label="Overdue Pending" value={snapshot.taskCounts.overduePending} />
        <MetricCard label="Mock Results" value={snapshot.mockResultCount} detail="Current user only" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Analysis Counts
            </CardTitle>
            <CardDescription>Weak-area, revision, and PYQ diagnostics.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <MetricTile label="Weak Areas" value={snapshot.weakAreasCount} />
            <MetricTile label="Revision Overdue" value={snapshot.revisionQueueCounts.overdueTasks} />
            <MetricTile label="Weak Chapters" value={snapshot.revisionQueueCounts.weakChapters} />
            <MetricTile label="Mock Weak Areas" value={snapshot.revisionQueueCounts.mockWeakAreas} />
            <MetricTile label="Weekly Revision Tasks" value={snapshot.revisionQueueCounts.currentWeekRevisionTasks} />
            <MetricTile label="Suggested Revision Items" value={snapshot.revisionQueueCounts.suggestedOrder} />
            <MetricTile label="PYQ Questions" value={snapshot.pyqCounts.total} />
            <MetricTile label="Verified PYQs" value={snapshot.pyqCounts.verified} />
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Subject Distribution</CardTitle>
            <CardDescription>Active-plan tasks grouped by subject.</CardDescription>
          </CardHeader>
          <CardContent>
            {snapshot.subjectDistribution.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                No active-plan subject tasks found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Done</TableHead>
                      <TableHead className="text-right">Pending</TableHead>
                      <TableHead className="text-right">Skipped</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {snapshot.subjectDistribution.map((subject) => (
                      <TableRow key={subject.subjectId || subject.subjectName}>
                        <TableCell className="min-w-0 max-w-48 break-words font-medium">
                          {subject.subjectName}
                        </TableCell>
                        <TableCell className="text-right">{subject.totalTasks}</TableCell>
                        <TableCell className="text-right">{subject.completedTasks}</TableCell>
                        <TableCell className="text-right">{subject.pendingTasks}</TableCell>
                        <TableCell className="text-right">{subject.skippedTasks}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
