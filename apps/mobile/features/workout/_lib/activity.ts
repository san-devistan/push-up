import type { api } from "@workspace/backend/api"
import type { FunctionReturnType } from "convex/server"

export type Activity = FunctionReturnType<typeof api.workoutSessions.activity>
