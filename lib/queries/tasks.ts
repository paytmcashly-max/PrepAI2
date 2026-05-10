"use server"

import { createClient } from '@/lib/supabase/server'
import { calculateStudyDay } from '@/lib/utils/study-day'

export interface DailyTask {
  id: string
  title: string
  chapter: string | null
  task: string | null
  how_to_study: string[]
  estimated_minutes: number
  priority: string
  order_index: number
  subject_id: string | null
  subjects: {
    name: string
    icon: string
    color: string
  } | null
}

export interface DailyPlanWithTasks {
  id: string
  day: number
  phase_id: string | null
  is_revision_day: boolean
  daily_tasks: DailyTask[]
  roadmap_phases: {
    name: string
    goal: string | null
  } | null
}

export async function getTodaysTasks() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('start_date')
    .eq('id', user.id)
    .single()
  
  const studyDayInfo = await calculateStudyDay(profile?.start_date)
  
  const { data: dailyPlan } = await supabase
    .from('daily_plans')
    .select(`
      *,
      daily_tasks (
        *,
        subjects (name, icon, color)
      ),
      roadmap_phases (name, goal)
    `)
    .eq('day', studyDayInfo.currentDay)
    .single()
  
  // Get user's completions for these tasks
  const taskIds = dailyPlan?.daily_tasks?.map((t: { id: string }) => t.id) || []
  const { data: completions } = await supabase
    .from('task_completions')
    .select('*')
    .eq('user_id', user.id)
    .in('daily_task_id', taskIds)
  
  return {
    dailyPlan,
    completions: completions || [],
    studyDayInfo,
    userId: user.id
  }
}

export async function getTasksForDay(day: number) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data: dailyPlan } = await supabase
    .from('daily_plans')
    .select(`
      *,
      daily_tasks (
        *,
        subjects (name, icon, color)
      ),
      roadmap_phases (name, goal)
    `)
    .eq('day', day)
    .single()
  
  const taskIds = dailyPlan?.daily_tasks?.map((t: { id: string }) => t.id) || []
  const { data: completions } = await supabase
    .from('task_completions')
    .select('*')
    .eq('user_id', user.id)
    .in('daily_task_id', taskIds)
  
  return {
    dailyPlan,
    completions: completions || [],
    userId: user.id
  }
}

export async function toggleTaskCompletion(taskId: string, userId: string, completed: boolean) {
  const supabase = await createClient()
  
  if (completed) {
    const { error } = await supabase
      .from('task_completions')
      .upsert({
        user_id: userId,
        daily_task_id: taskId,
        completed: true,
        completed_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,daily_task_id'
      })
    
    return { error }
  } else {
    const { error } = await supabase
      .from('task_completions')
      .delete()
      .eq('user_id', userId)
      .eq('daily_task_id', taskId)
    
    return { error }
  }
}
