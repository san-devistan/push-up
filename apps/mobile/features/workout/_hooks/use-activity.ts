import { DEMO_DATA, demoActivity } from "@/features/workout/_lib/demo"
import { getLocalDate } from "@/features/workout/_lib/storage"
import { api } from "@workspace/backend/api"
import { useConvexAuth, useQuery } from "convex/react"
import { useState } from "react"

export function useActivity() {
  const { isAuthenticated } = useConvexAuth()
  const [today] = useState(() => getLocalDate(Date.now()))
  const live = useQuery(
    api.workoutSessions.activity,
    isAuthenticated && !DEMO_DATA ? { today } : "skip"
  )

  return {
    activity: DEMO_DATA ? demoActivity(today) : live,
    isAuthenticated: isAuthenticated || DEMO_DATA,
  }
}
