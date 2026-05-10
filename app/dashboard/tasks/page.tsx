import { getAllTasksWithPlans, getTodayTaskGroup } from '@/lib/queries'
import { TasksContent } from '@/components/dashboard/tasks-content'
import { createClient } from '@/lib/supabase/server'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [dayGroups, todayTaskGroup] = await Promise.all([
    getAllTasksWithPlans(),
    user ? getTodayTaskGroup(user.id) : null,
  ])

  return <TasksContent dayGroups={dayGroups} todayTaskGroup={todayTaskGroup} />
}
