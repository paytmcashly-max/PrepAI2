import { getAllTasksWithPlans } from '@/lib/queries'
import { TasksContent } from '@/components/dashboard/tasks-content'

export default async function TasksPage() {
  const dayGroups = await getAllTasksWithPlans()

  return <TasksContent dayGroups={dayGroups} />
}
