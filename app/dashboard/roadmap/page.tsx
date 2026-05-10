import { getRoadmapPhases, getSubjects, getDailyPlans } from '@/lib/queries'
import { RoadmapContent } from '@/components/dashboard/roadmap-content'

export default async function RoadmapPage() {
  const [phases, subjects, dailyPlans] = await Promise.all([
    getRoadmapPhases(),
    getSubjects(),
    getDailyPlans(),
  ])

  return (
    <RoadmapContent 
      phases={phases} 
      subjects={subjects} 
      totalDays={dailyPlans.length > 0 ? Math.max(...dailyPlans.map(p => p.day)) : 180}
    />
  )
}
