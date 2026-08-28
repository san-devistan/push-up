import { useActivity } from "@/features/workout/_hooks/use-activity"
import { usePlan } from "@/features/workout/_hooks/use-plan"
import { useRecap } from "@/features/workout/_hooks/use-recap"
import { syncDailyAppBlocker } from "@/modules/daily-app-blocker"
import { useEffect } from "react"

export function AppBlockerSync() {
  const { activity, today } = useActivity()
  const { plan } = usePlan()
  const { state: recap } = useRecap()
  const todayReps =
    recap.type === "revealed" ? recap.activity.todayReps : activity?.todayReps

  useEffect(() => {
    if (todayReps === undefined) return
    void syncDailyAppBlocker(todayReps >= plan.targetReps, today).catch(
      () => {}
    )
  }, [plan.targetReps, today, todayReps])

  return null
}
