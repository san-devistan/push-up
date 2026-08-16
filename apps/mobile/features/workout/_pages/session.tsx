import SessionScreen from "@/features/workout/_components/session"
import SummaryScreen from "@/features/workout/_components/summary"
import { usePlan } from "@/features/workout/_hooks/use-plan"
import { repsPerSession } from "@/features/workout/_lib/goal"
import type { WorkoutSession } from "@/features/workout/_lib/storage"
import { useRouter } from "expo-router"
import { useState } from "react"

function getCloseSummary(router: ReturnType<typeof useRouter>) {
  return () => router.back()
}

export default function SessionPage() {
  const router = useRouter()
  const { plan } = usePlan()
  const [finished, setFinished] = useState<WorkoutSession | null>(null)
  const closeSummary = getCloseSummary(router)

  if (finished) {
    return <SummaryScreen onDone={closeSummary} session={finished} />
  }

  return (
    <SessionScreen
      onComplete={setFinished}
      plan={plan}
      targetReps={repsPerSession(plan.targetReps, plan.reminderTimes.length)}
    />
  )
}
