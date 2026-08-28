import { DEMO_DATA, demoActivity } from "@/features/workout/_lib/demo"
import { getLocalDate } from "@/features/workout/_lib/storage"
import { api } from "@workspace/backend/api"
import { useConvexAuth, useQuery } from "convex/react"
import { useEffect, useState } from "react"

function millisecondsUntilTomorrow() {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setHours(24, 0, 0, 0)
  return tomorrow.getTime() - now.getTime()
}

export function useActivity() {
  const { isAuthenticated } = useConvexAuth()
  const [today, setToday] = useState(() => getLocalDate(Date.now()))
  const live = useQuery(
    api.workoutSessions.activity,
    isAuthenticated && !DEMO_DATA ? { today } : "skip"
  )

  useEffect(() => {
    const timeout = setTimeout(
      () => setToday(getLocalDate(Date.now())),
      millisecondsUntilTomorrow()
    )
    return () => clearTimeout(timeout)
  }, [today])

  return {
    activity: DEMO_DATA ? demoActivity(today) : live,
    isAuthenticated: isAuthenticated || DEMO_DATA,
    today,
  }
}
