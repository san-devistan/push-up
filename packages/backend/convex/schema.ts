import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

const failureReason = v.union(
  v.literal("body_misalignment"),
  v.literal("incomplete_lockout"),
  v.literal("insufficient_depth"),
  v.literal("tracking_lost")
)

export default defineSchema({
  workoutAttempts: defineTable({
    durationMs: v.number(),
    failureReasons: v.array(failureReason),
    minBodyAngle: v.number(),
    minElbowAngle: v.number(),
    sessionId: v.id("workoutSessions"),
    startedAtOffsetMs: v.number(),
    valid: v.boolean(),
  }).index("by_session_id_and_started_at_offset_ms", [
    "sessionId",
    "startedAtOffsetMs",
  ]),
  workoutSessions: defineTable({
    activeRepetitionTimeMs: v.number(),
    clientSessionId: v.string(),
    endedAt: v.number(),
    invalidReps: v.number(),
    localDate: v.string(),
    ownerId: v.string(),
    soundEnabled: v.boolean(),
    startedAt: v.number(),
    status: v.union(v.literal("completed"), v.literal("stopped")),
    targetReps: v.number(),
    timezoneOffsetMinutes: v.number(),
    totalDurationMs: v.number(),
    validReps: v.number(),
  })
    .index("by_client_session_id", ["clientSessionId"])
    .index("by_owner_id_and_started_at", ["ownerId", "startedAt"]),
})
