"use client"

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, BookOpen, CheckCircle2, Circle, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

interface Chapter {
  id: string
  name: string
  order_index: number
}

interface Subject {
  id: string
  name: string
  icon: string | null
  color: string | null
  chapters: Chapter[]
}

interface SubjectDetailContentProps {
  subject: Subject
  userId: string | undefined
}

export function SubjectDetailContent({ subject, userId }: SubjectDetailContentProps) {
  const [chapterStatuses, setChapterStatuses] = useState<Record<string, 'not_started' | 'in_progress' | 'completed'>>({})
  
  const completedCount = Object.values(chapterStatuses).filter(s => s === 'completed').length
  const inProgressCount = Object.values(chapterStatuses).filter(s => s === 'in_progress').length
  const totalChapters = subject.chapters?.length || 0
  const progressPercentage = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0
  
  const handleStatusChange = (chapterId: string, status: 'not_started' | 'in_progress' | 'completed') => {
    setChapterStatuses(prev => ({
      ...prev,
      [chapterId]: status
    }))
    
    const statusMessages = {
      not_started: 'Chapter marked as not started',
      in_progress: 'Chapter marked as in progress',
      completed: 'Chapter completed!'
    }
    
    toast.success(statusMessages[status])
  }
  
  const getStatusBadge = (status: 'not_started' | 'in_progress' | 'completed') => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>
      case 'in_progress':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">In Progress</Badge>
      default:
        return <Badge variant="outline">Not Started</Badge>
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/subjects">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{subject.name}</h1>
          <p className="text-muted-foreground">
            {totalChapters} chapters | {completedCount} completed
          </p>
        </div>
      </div>
      
      {/* Progress Card */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Subject Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Completion</span>
              <span className="font-medium">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{completedCount}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">{inProgressCount}</div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-muted-foreground">{totalChapters - completedCount - inProgressCount}</div>
                <div className="text-xs text-muted-foreground">Not Started</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Chapters List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Chapters
        </h2>
        
        {subject.chapters && subject.chapters.length > 0 ? (
          <div className="space-y-2">
            {subject.chapters
              .sort((a, b) => a.order_index - b.order_index)
              .map((chapter, index) => {
                const status = chapterStatuses[chapter.id] || 'not_started'
                
                return (
                  <motion.div
                    key={chapter.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-border/50 bg-card/50 backdrop-blur hover:bg-card/80 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium text-sm">
                              {chapter.order_index}
                            </div>
                            <div>
                              <h3 className="font-medium">{chapter.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                {getStatusBadge(status)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant={status === 'not_started' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleStatusChange(chapter.id, 'not_started')}
                            >
                              <Circle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={status === 'in_progress' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleStatusChange(chapter.id, 'in_progress')}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={status === 'completed' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleStatusChange(chapter.id, 'completed')}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
          </div>
        ) : (
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No Chapters Found</h3>
              <p className="text-sm text-muted-foreground">
                Chapters for this subject will appear here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
