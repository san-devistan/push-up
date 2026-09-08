import { useActivity } from "@/features/workout/_hooks/use-activity"
import { usePlan } from "@/features/workout/_hooks/use-plan"
import { useRecap } from "@/features/workout/_hooks/use-recap"
import { listPendingSessions } from "@/features/workout/_lib/storage"
import { syncDailyAppBlocker } from "@/modules/daily-app-blocker"
import { useEffect, useState } from "react"
import { AppState } from "react-native"

/**
 * Reps recorded today that the server has not acknowledged yet. The outbox is
 * emptied on sync, so this is zero on the happy path and only carries weight
 * when the round-trip has not landed — which is exactly when the query would
 * otherwise report a stale total and keep the apps shielded after a session.
 */
function pendingRepsOn(localDate: string) {
  return listPendingSessions()
    .filter((session) => session.localDate === localDate)
    .reduce((total, session) => total + session.validReps, 0)
}

export function AppBlockerSync() {
  const { activity, today } = useActivity()
  const { plan } = usePlan()
  const { state: recap } = useRecap()
  // A foreground pass re-reads the outbox and retries a sync that failed while
  // the app was away. Neither of those is reactive on its own.
  const [foregroundCount, setForegroundCount] = useState(0)
  const serverReps = activity?.todayReps
  // The recap's activity already folds in the session it is celebrating, so it
  // is compared against the stored total rather than added to it.
  const revealedReps =
    recap.type === "revealed" ? recap.activity.todayReps : undefined

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "active") setForegroundCount((count) => count + 1)
    })
    return () => subscription.remove()
  }, [])

  useEffect(() => {
    const stored = (serverReps ?? 0) + pendingRepsOn(today)
    const reps = Math.max(revealedReps ?? 0, stored)

    // Knowing nothing is not the same as knowing the goal was missed: leave the
    // shields as they are rather than re-locking on the strength of no data.
    if (reps === 0 && serverReps === undefined) return

    void syncDailyAppBlocker(reps >= plan.targetReps, today).catch(() => {
      // Nowhere to surface this. The next foreground pass retries.
    })
  }, [foregroundCount, plan.targetReps, revealedReps, serverReps, today])

  return null
}
