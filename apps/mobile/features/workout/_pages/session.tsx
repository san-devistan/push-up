import SessionScreen from "@/features/workout/_components/session"
import { useActivity } from "@/features/workout/_hooks/use-activity"
import { usePlan } from "@/features/workout/_hooks/use-plan"
import { useRecap } from "@/features/workout/_hooks/use-recap"
import type { Activity } from "@/features/workout/_lib/activity"
import { repsPerSession } from "@/features/workout/_lib/goal"
import type { WorkoutSession } from "@/features/workout/_lib/storage"
import { useRouter } from "expo-router"

function getFinishSession(
  router: ReturnType<typeof useRouter>,
  before: Activity | undefined,
  show: (session: WorkoutSession, before: Activity | undefined) => void
) {
  return (session: WorkoutSession) => {
    show(session, before)
    if (router.canGoBack()) router.back()
    else router.replace("/")
  }
}

export default function SessionPage() {
  const router = useRouter()
  const { activity } = useActivity()
  const { plan } = usePlan()
  const { show, state } = useRecap()
  const before = state.type === "revealed" ? state.activity : activity
  const finish = getFinishSession(router, before, show)

  return (
    <SessionScreen
      onComplete={finish}
      plan={plan}
      targetReps={repsPerSession(plan.targetReps, plan.reminderTimes.length)}
    />
  )
}
