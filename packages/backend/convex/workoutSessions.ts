import { ConvexError, v } from "convex/values"

import { internalMutation, mutation, query } from "./_generated/server"
import { authComponent } from "./auth"
import {
  isDateKey,
  summarizeActivity,
  type ActivitySession,
} from "./workoutActivity"

const failureReason = v.union(
  v.literal("body_misalignment"),
  v.literal("incomplete_lockout"),
  v.literal("insufficient_depth"),
  v.literal("tracking_lost")
)

const attempt = v.object({
  durationMs: v.number(),
  failureReasons: v.array(failureReason),
  minBodyAngle: v.number(),
  minElbowAngle: v.number(),
  startedAtOffsetMs: v.number(),
  valid: v.boolean(),
})

function assertFiniteRange(
  value: number,
  minimum: number,
  maximum: number,
  field: string
) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new ConvexError(`${field} is outside its allowed range`)
  }
}

function validateSession(args: {
  activeRepetitionTimeMs: number
  attempts: ReadonlyArray<{
    durationMs: number
    minBodyAngle: number
    minElbowAngle: number
    startedAtOffsetMs: number
  }>
  clientSessionId: string
  endedAt: number
  localDate: string
  startedAt: number
  targetReps: number
  timezoneOffsetMinutes: number
  totalDurationMs: number
  validReps: number
}) {
  assertFiniteRange(args.targetReps, 1, 500, "targetReps")
  assertFiniteRange(args.validReps, 0, args.targetReps, "validReps")
  assertFiniteRange(
    args.totalDurationMs,
    0,
    24 * 60 * 60 * 1000,
    "totalDurationMs"
  )
  assertFiniteRange(
    args.activeRepetitionTimeMs,
    0,
    args.totalDurationMs,
    "activeRepetitionTimeMs"
  )
  assertFiniteRange(
    args.startedAt,
    0,
    Date.now() + 24 * 60 * 60 * 1000,
    "startedAt"
  )
  assertFiniteRange(
    args.endedAt,
    args.startedAt,
    Date.now() + 24 * 60 * 60 * 1000,
    "endedAt"
  )

  if (
    args.clientSessionId.length < 1 ||
    args.clientSessionId.length > 100 ||
    !isDateKey(args.localDate) ||
    args.attempts.length > 1000
  ) {
    throw new ConvexError("Invalid workout session metadata")
  }

  assertFiniteRange(
    args.timezoneOffsetMinutes,
    -24 * 60,
    24 * 60,
    "timezoneOffsetMinutes"
  )

  for (const item of args.attempts) {
    assertFiniteRange(item.durationMs, 0, args.totalDurationMs, "durationMs")
    assertFiniteRange(
      item.startedAtOffsetMs,
      0,
      args.totalDurationMs,
      "startedAtOffsetMs"
    )
    assertFiniteRange(item.minBodyAngle, 0, 180, "minBodyAngle")
    assertFiniteRange(item.minElbowAngle, 0, 180, "minElbowAngle")
  }
}

export const sync = mutation({
  args: {
    activeRepetitionTimeMs: v.number(),
    attempts: v.array(attempt),
    clientSessionId: v.string(),
    endedAt: v.number(),
    localDate: v.string(),
    soundEnabled: v.boolean(),
    startedAt: v.number(),
    status: v.union(v.literal("completed"), v.literal("stopped")),
    targetReps: v.number(),
    timezoneOffsetMinutes: v.number(),
    totalDurationMs: v.number(),
    validReps: v.number(),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.safeGetAuthUser(ctx)

    if (!authUser) {
      throw new ConvexError("Not authenticated")
    }

    validateSession(args)

    const existing = await ctx.db
      .query("workoutSessions")
      .withIndex("by_client_session_id", (index) => {
        return index.eq("clientSessionId", args.clientSessionId)
      })
      .unique()

    if (existing) {
      if (existing.ownerId !== authUser._id) {
        throw new ConvexError("Workout session belongs to another user")
      }

      return existing._id
    }

    const sessionId = await ctx.db.insert("workoutSessions", {
      activeRepetitionTimeMs: args.activeRepetitionTimeMs,
      clientSessionId: args.clientSessionId,
      endedAt: args.endedAt,
      invalidReps: args.attempts.filter((item) => !item.valid).length,
      localDate: args.localDate,
      ownerId: authUser._id,
      soundEnabled: args.soundEnabled,
      startedAt: args.startedAt,
      status: args.status,
      targetReps: args.targetReps,
      timezoneOffsetMinutes: args.timezoneOffsetMinutes,
      totalDurationMs: args.totalDurationMs,
      validReps: args.validReps,
    })

    await Promise.all(
      args.attempts.map((item) => {
        return ctx.db.insert("workoutAttempts", { ...item, sessionId })
      })
    )

    return sessionId
  },
})

export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    const authUser = await authComponent.safeGetAuthUser(ctx)

    if (!authUser) {
      throw new ConvexError("Not authenticated")
    }

    let attempts = 0
    let sessions = 0

    for await (const session of ctx.db
      .query("workoutSessions")
      .withIndex("by_owner_id_and_started_at", (index) =>
        index.eq("ownerId", authUser._id)
      )) {
      for await (const row of ctx.db
        .query("workoutAttempts")
        .withIndex("by_session_id_and_started_at_offset_ms", (index) =>
          index.eq("sessionId", session._id)
        )) {
        await ctx.db.delete(row._id)
        attempts += 1
      }

      await ctx.db.delete(session._id)
      sessions += 1
    }

    return { attempts, sessions }
  },
})

export const activity = query({
  args: {
    today: v.string(),
  },
  handler: async (ctx, args) => {
    if (!isDateKey(args.today)) {
      throw new ConvexError("today must use YYYY-MM-DD")
    }

    const authUser = await authComponent.safeGetAuthUser(ctx)

    if (!authUser) {
      throw new ConvexError("Not authenticated")
    }

    const sessions: ActivitySession[] = []

    for await (const session of ctx.db
      .query("workoutSessions")
      .withIndex("by_owner_id_and_started_at", (index) =>
        index.eq("ownerId", authUser._id)
      )) {
      sessions.push(session)
    }

    return summarizeActivity(sessions, args.today)
  },
})

export const transferOwner = internalMutation({
  args: {
    fromOwnerId: v.string(),
    toOwnerId: v.string(),
  },
  handler: async (ctx, args) => {
    for await (const session of ctx.db
      .query("workoutSessions")
      .withIndex("by_owner_id_and_started_at", (index) =>
        index.eq("ownerId", args.fromOwnerId)
      )) {
      await ctx.db.patch(session._id, { ownerId: args.toOwnerId })
    }

    return null
  },
})
