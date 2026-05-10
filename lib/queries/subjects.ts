"use server"

import { createClient } from '@/lib/supabase/server'

export interface Subject {
  id: string
  name: string
  icon: string | null
  color: string | null
  chapters: { id: string; name: string; order_index: number }[]
}

export interface ChapterWithProgress {
  id: string
  name: string
  order_index: number
  subject_id: string
  status: 'not_started' | 'in_progress' | 'completed'
}

interface SubjectProgressCompletion {
  daily_tasks: { subject_id: string | null } | { subject_id: string | null }[] | null
}

export async function getSubjects() {
  const supabase = await createClient()
  
  const { data: subjects, error } = await supabase
    .from('subjects')
    .select(`
      *,
      chapters (id, name, order_index)
    `)
    .order('name')
  
  if (error) {
    console.error('Error fetching subjects:', error)
    return []
  }
  
  return subjects || []
}

export async function getSubjectWithChapters(subjectId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: subject, error } = await supabase
    .from('subjects')
    .select(`
      *,
      chapters (id, name, order_index)
    `)
    .eq('id', subjectId)
    .single()
  
  if (error) {
    console.error('Error fetching subject:', error)
    return null
  }
  
  // Sort chapters by order_index
  if (subject?.chapters) {
    subject.chapters.sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
  }
  
  return {
    subject,
    userId: user?.id
  }
}

export async function getSubjectProgress(userId: string) {
  const supabase = await createClient()
  
  // Get all subjects with chapters
  const { data: subjects } = await supabase
    .from('subjects')
    .select(`
      id,
      name,
      icon,
      color,
      chapters (id)
    `)
  
  // Get completed tasks grouped by subject
  const { data: completions } = await supabase
    .from('task_completions')
    .select(`
      daily_task_id,
      daily_tasks (subject_id)
    `)
    .eq('user_id', userId)
    .eq('completed', true)
  
  // Calculate progress per subject
  const subjectProgress = subjects?.map(subject => {
    const totalChapters = subject.chapters?.length || 0
    const completedTasks = (completions as SubjectProgressCompletion[] | null)?.filter(c => {
      const dailyTask = Array.isArray(c.daily_tasks) ? c.daily_tasks[0] : c.daily_tasks
      return dailyTask?.subject_id === subject.id
    }).length || 0
    
    // Estimate chapter completion based on task completion
    const estimatedCompletedChapters = Math.min(
      totalChapters,
      Math.floor(completedTasks / 3) // Assume ~3 tasks per chapter
    )
    
    return {
      ...subject,
      totalChapters,
      completedChapters: estimatedCompletedChapters,
      progressPercentage: totalChapters > 0 
        ? Math.round((estimatedCompletedChapters / totalChapters) * 100)
        : 0
    }
  }) || []
  
  return subjectProgress
}
