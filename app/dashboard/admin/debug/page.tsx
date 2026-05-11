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
import { generateMissingResourcesForActivePlan } from '@/lib/actions'
import { Button } from '@/components/ui/button'

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

export default async function AdminDebugPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdminEmail(user.email)) {
    notFound()
  }

  const snapshot = await getAdminDebugSnapshot({
    id: user.id,
    email: user.email,
  })
  const params = searchParams ? await searchParams : {}
  const resourceStatus = typeof params.resourceStatus === 'string' ? params.resourceStatus : null
  const generatedResources = typeof params.resources === 'string' ? params.resources : null
  const generatedQuestions = typeof params.questions === 'string' ? params.questions : null

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
        <MetricCard label="App Version" value={snapshot.health.appVersion} />
        <MetricCard label="Latest Commit" value={snapshot.health.latestCommit} />
        <MetricCard label="Groq Configured" value={snapshot.health.groqConfigured ? 'Yes' : 'No'} detail="Secret value is never displayed" />
        <MetricCard label="Visible PYQs" value={snapshot.pyqCounts.visible} detail="Excludes manual-review/rejected rows" />
      </div>

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

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Auto Resource Coverage</CardTitle>
          <CardDescription>Active-plan coverage for PrepAI notes, original practice, and curated video embeds.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {resourceStatus && (
            <Alert>
              <ClipboardList className="h-4 w-4" />
              <AlertTitle>Resource generation result</AlertTitle>
              <AlertDescription>
                {resourceStatus === 'generated'
                  ? `Generated/upserted ${generatedResources || 0} resources and ${generatedQuestions || 0} original practice questions.`
                  : resourceStatus === 'no-active-plan'
                    ? 'No active plan found for this user.'
                    : 'No missing notes/practice chapters found in the current active plan.'}
              </AlertDescription>
            </Alert>
          )}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricTile label="Overall Coverage" value={`${snapshot.resourceCoverage.overallCoveragePercent}%`} />
            <MetricTile label="Notes Coverage" value={`${snapshot.resourceCoverage.notesCoveragePercent}%`} />
            <MetricTile label="Practice Coverage" value={`${snapshot.resourceCoverage.practiceCoveragePercent}%`} />
            <MetricTile label="Video Embed Coverage" value={`${snapshot.resourceCoverage.videoCoveragePercent}%`} />
            <MetricTile label="Missing Notes Tasks" value={snapshot.resourceCoverage.tasksMissingNotes} />
            <MetricTile label="Missing Practice Tasks" value={snapshot.resourceCoverage.tasksMissingPractice} />
            <MetricTile label="Missing Video Tasks" value={snapshot.resourceCoverage.tasksMissingVideo} />
            <MetricTile label="Plan Tasks Audited" value={snapshot.resourceCoverage.totalTasks} />
          </div>
          <form action={generateMissingResourcesForActivePlan} className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input type="hidden" name="targetUserId" value={snapshot.user.id} />
            <Button type="submit" disabled={!snapshot.activePlan}>
              Generate up to 10 missing resource packs
            </Button>
            <p className="text-xs text-muted-foreground">
              Idempotent admin action. It creates PrepAI Original notes and up to 150 original MCQs per run; it does not curate videos.
            </p>
          </form>
          {snapshot.resourceCoverage.missingChapters.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No missing chapters found for active-plan notes/practice/video coverage.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chapter</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-right">Tasks</TableHead>
                    <TableHead className="text-right">No Notes</TableHead>
                    <TableHead className="text-right">No Practice</TableHead>
                    <TableHead className="text-right">No Video</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshot.resourceCoverage.missingChapters.slice(0, 10).map((chapter) => (
                    <TableRow key={`${chapter.examId}-${chapter.subjectId}-${chapter.chapterId || chapter.chapterName}`}>
                      <TableCell className="min-w-0 max-w-64 break-words font-medium">{chapter.chapterName}</TableCell>
                      <TableCell className="min-w-0 max-w-40 break-words">{chapter.subjectName}</TableCell>
                      <TableCell className="text-right">{chapter.taskCount}</TableCell>
                      <TableCell className="text-right">{chapter.missingNotesCount}</TableCell>
                      <TableCell className="text-right">{chapter.missingPracticeCount}</TableCell>
                      <TableCell className="text-right">{chapter.missingVideoCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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
            <MetricTile label="Adaptive Recommendations" value={snapshot.revisionQueueCounts.adaptiveRecommendations} />
            <MetricTile label="PYQ Revision Items" value={snapshot.revisionQueueCounts.pyqRevisionItems} />
            <MetricTile label="Original Practice Revision" value={snapshot.revisionQueueCounts.originalPracticeRevisionItems} />
            <MetricTile label="Weekly Revision Tasks" value={snapshot.revisionQueueCounts.currentWeekRevisionTasks} />
            <MetricTile label="Suggested Revision Items" value={snapshot.revisionQueueCounts.suggestedOrder} />
            <MetricTile label="Study Resources" value={snapshot.originalPracticeCounts.resourcesTotal} />
            <MetricTile label="Active Study Resources" value={snapshot.originalPracticeCounts.resourcesActive} />
            <MetricTile label="Original Practice Questions" value={snapshot.originalPracticeCounts.questionsTotal} />
            <MetricTile label="Original Practice Attempts" value={snapshot.originalPracticeCounts.attemptsTotal} />
            <MetricTile label="Incorrect Original Practice" value={snapshot.originalPracticeCounts.incorrectAttempts} />
            <MetricTile label="Marked Original Practice" value={snapshot.originalPracticeCounts.markedForRevision} />
            <MetricTile label="PYQ Questions" value={snapshot.pyqCounts.total} />
            <MetricTile label="Visible PYQs" value={snapshot.pyqCounts.visible} />
            <MetricTile label="PYQ Attempts" value={snapshot.pyqAttemptCounts.total} />
            <MetricTile label="Incorrect PYQ Attempts" value={snapshot.pyqAttemptCounts.incorrect} />
            <MetricTile label="Marked PYQ Revisions" value={snapshot.pyqAttemptCounts.markedForRevision} />
            <MetricTile label="Official Verified PYQs" value={snapshot.pyqCounts.verified} />
            <MetricTile label="Trusted Third-party PYQs" value={snapshot.pyqCounts.trustedThirdParty} />
            <MetricTile label="System Validated PYQs" value={snapshot.pyqCounts.systemValidated} />
            <MetricTile label="Needs Manual Review" value={snapshot.pyqCounts.needsManualReview} />
            <MetricTile label="Third-party In Review" value={snapshot.pyqCounts.trustedThirdPartyInReview} />
            <MetricTile label="Third-party Reviewed" value={snapshot.pyqCounts.trustedThirdPartyReviewed} />
            <MetricTile label="Auto Rejected PYQs" value={snapshot.pyqCounts.autoRejected} />
            <MetricTile label="Memory-based PYQs" value={snapshot.pyqCounts.memoryBased} />
            <MetricTile label="AI Practice PYQs" value={snapshot.pyqCounts.aiPractice} />
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
