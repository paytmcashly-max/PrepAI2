"use server"

import { createClient } from '@/lib/supabase/server'
import { calculateStudyDay } from '@/lib/utils/study-day'

export async function getDashboardData() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }
  
  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  // Calculate study day
  const studyDayInfo = await calculateStudyDay(profile?.start_date)
  
  // Get today's tasks
  const { data: dailyPlan } = await supabase
    .from('daily_plans')
    .select(`
      *,
      daily_tasks (
        *,
        subjects (name, icon, color)
      )
    `)
    .eq('day', studyDayInfo.currentDay)
    .single()
  
  // Get task completions for today
  const taskIds = dailyPlan?.daily_tasks?.map((t: { id: string }) => t.id) || []
  const { data: completions } = await supabase
    .from('task_completions')
    .select('*')
    .eq('user_id', user.id)
    .in('daily_task_id', taskIds)
  
  // Get all task completions for streak calculation
  const { data: allCompletions } = await supabase
    .from('task_completions')
    .select('completed_at')
    .eq('user_id', user.id)
    .eq('completed', true)
    .order('completed_at', { ascending: false })
  
  // Get subjects with progress
  const { data: subjects } = await supabase
    .from('subjects')
    .select(`
      *,
      chapters (id)
    `)
  
  // Get a random motivational quote
  const { data: quotes } = await supabase
    .from('motivational_quotes')
    .select('*')
  
  const randomQuote = quotes && quotes.length > 0 
    ? quotes[Math.floor(Math.random() * quotes.length)]
    : { quote: "Success is not final, failure is not fatal.", author: "Winston Churchill" }
  
  return {
    user,
    profile,
    studyDayInfo,
    dailyPlan,
    completions: completions || [],
    allCompletions: allCompletions || [],
    subjects: subjects || [],
    quote: randomQuote
  }
}

export async function getWeeklyProgress(userId: string) {
  const supabase = await createClient()
  
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const { data } = await supabase
    .from('task_completions')
    .select('completed_at')
    .eq('user_id', userId)
    .eq('completed', true)
    .gte('completed_at', sevenDaysAgo.toISOString())
  
  return data || []
}

export async function getStudyStreak(userId: string) {
  const supabase = await createClient()
  
  const { data: completions } = await supabase
    .from('task_completions')
    .select('completed_at')
    .eq('user_id', userId)
    .eq('completed', true)
    .order('completed_at', { ascending: false })
  
  if (!completions || completions.length === 0) return 0
  
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const completionDates = new Set(
    completions.map(c => {
      const date = new Date(c.completed_at)
      date.setHours(0, 0, 0, 0)
      return date.toISOString()
    })
  )
  
  let checkDate = today
  while (completionDates.has(checkDate.toISOString())) {
    streak++
    checkDate = new Date(checkDate)
    checkDate.setDate(checkDate.getDate() - 1)
  }
  
  return streak
}
