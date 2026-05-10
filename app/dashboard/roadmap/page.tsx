import { getUserRoadmapData } from '@/lib/queries'
import { RoadmapContent } from '@/components/dashboard/roadmap-content'

export default async function RoadmapPage() {
  const roadmap = await getUserRoadmapData()

  return (
    <RoadmapContent 
      phases={roadmap.phases}
      subjects={roadmap.subjects}
      totalDays={roadmap.plan?.target_days || 0}
      currentDay={roadmap.currentDay}
    />
  )
}
