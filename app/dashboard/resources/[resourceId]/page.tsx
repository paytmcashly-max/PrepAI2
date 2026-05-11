import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink, FileText, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MarkdownLite } from '@/components/dashboard/markdown-lite'
import { getStudyResourceById } from '@/lib/queries'

export default async function ResourceViewerPage({ params }: { params: Promise<{ resourceId: string }> }) {
  const { resourceId } = await params
  const resource = await getStudyResourceById(resourceId)
  if (!resource) notFound()

  const isVideo = resource.resource_type === 'video_embed'
  const isExternal = resource.resource_type === 'external_link'
  const isPractice = resource.resource_type === 'mcq_practice'
  const practiceHref = `/dashboard/practice/original?exam=${encodeURIComponent(resource.exam_id || '')}${resource.subject_id ? `&subject=${encodeURIComponent(resource.subject_id)}` : ''}${resource.chapter_id ? `&chapter=${encodeURIComponent(resource.chapter_id)}` : ''}`

  return (
    <div className="space-y-6 overflow-hidden p-4 sm:p-6">
      <Button asChild variant="ghost" className="w-fit">
        <Link href="/dashboard/tasks?focus=today#today-tasks">
          <ArrowLeft className="h-4 w-4" />
          Back to tasks
        </Link>
      </Button>

      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Badge variant="outline" className="whitespace-normal break-words">{resource.resource_type.replaceAll('_', ' ')}</Badge>
            <Badge className="whitespace-normal break-words">
              <ShieldCheck className="h-3.5 w-3.5" />
              {resource.trust_level === 'prepai_original' ? 'PrepAI Original' : resource.trust_level}
            </Badge>
            <Badge variant="secondary" className="whitespace-normal break-words">{resource.language}</Badge>
          </div>
          <CardTitle className="break-words text-2xl sm:text-3xl">{resource.title}</CardTitle>
          <CardDescription className="break-words leading-relaxed">
            {resource.description || `${resource.subject?.name || 'Study'} resource for ${resource.chapter?.name || 'your active topic'}.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {resource.how_to_study.length > 0 && (
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="mb-3 font-medium">How to study</p>
              <ol className="ml-5 list-decimal space-y-2">
                {resource.how_to_study.map((step, index) => (
                  <li key={`${index}-${step}`} className="break-words text-sm leading-relaxed">{step}</li>
                ))}
              </ol>
            </div>
          )}

          {isVideo ? (
            resource.embed_url ? (
              <div className="space-y-3">
                <div className="aspect-video overflow-hidden rounded-lg border bg-black">
                  <iframe
                    src={resource.embed_url}
                    title={resource.title}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <p className="text-sm text-muted-foreground">Video provided by original source: {resource.source_name}. PrepAI does not download or rehost this video.</p>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">Video not available yet.</div>
            )
          ) : isExternal ? (
            <div className="rounded-lg border p-4">
              <p className="mb-3 break-words text-sm text-muted-foreground">External source: {resource.source_name}</p>
              {resource.source_url ? (
                <Button asChild>
                  <a href={resource.source_url} target="_blank" rel="noopener noreferrer">
                    Open Source
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">No source URL is available.</p>
              )}
            </div>
          ) : isPractice ? (
            <div className="rounded-lg border p-4">
              <p className="mb-3 text-sm text-muted-foreground">Open matching PrepAI Original Practice questions.</p>
              <Button asChild>
                <Link href={practiceHref}>Practice in app</Link>
              </Button>
            </div>
          ) : (
            <article className="rounded-lg border bg-background p-4 sm:p-6">
              {resource.content_md ? (
                <MarkdownLite content={resource.content_md} />
              ) : (
                <p className="text-sm text-muted-foreground">PrepAI notes are not ready for this resource yet.</p>
              )}
            </article>
          )}

          {(resource.resource_type === 'concept_note' || resource.resource_type === 'pdf_note' || resource.resource_type === 'current_affairs' || resource.resource_type === 'physical_training') && (
            <div className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground print:hidden">
              Use your browser print option to save these PDF-style notes.
            </div>
          )}

          <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span className="break-words">Source: {resource.source_name}</span>
            {resource.subject?.name && <span className="break-words">Subject: {resource.subject.name}</span>}
            {resource.chapter?.name && <span className="break-words">Chapter: {resource.chapter.name}</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
