import type { WorkoutAttempt } from "@/features/workout/_lib/counter"
import * as Crypto from "expo-crypto"
import { Storage } from "expo-sqlite/kv-store"

export type WorkoutStatus = "completed" | "stopped"

export type TrainingTime = { hour: number; minute: number }

export type TrainingPlan = {
  reminderEnabled: boolean
  reminderTimes: TrainingTime[]
  soundEnabled: boolean
  targetReps: number
}

export type WorkoutSession = {
  activeRepetitionTimeMs: number
  attempts: WorkoutAttempt[]
  endedAt: number
  id: string
  localDate: string
  soundEnabled: boolean
  startedAt: number
  status: WorkoutStatus
  targetReps: number
  timezoneOffsetMinutes: number
  totalDurationMs: number
  validReps: number
}

const DEFAULT_PLAN = {
  reminderEnabled: true,
  reminderTimes: [{ hour: 18, minute: 30 }],
  soundEnabled: true,
  targetReps: 10,
} satisfies TrainingPlan

const KEYS = {
  outbox: "pushup.outbox",
  plan: "pushup.plan",
} as const

function readJson(key: string): unknown {
  try {
    const value = Storage.getItemSync(key)
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isClockPart(value: unknown, maximum: number): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= maximum
  )
}

function isTrainingTime(value: unknown): value is TrainingTime {
  return (
    isRecord(value) &&
    isClockPart(value.hour, 23) &&
    isClockPart(value.minute, 59)
  )
}

function hasPlanBasics(
  value: Record<string, unknown>
): value is Record<string, unknown> &
  Pick<TrainingPlan, "reminderEnabled" | "soundEnabled" | "targetReps"> {
  return (
    typeof value.reminderEnabled === "boolean" &&
    typeof value.soundEnabled === "boolean" &&
    typeof value.targetReps === "number"
  )
}

function isPlan(value: unknown): value is TrainingPlan {
  return (
    isRecord(value) &&
    hasPlanBasics(value) &&
    Array.isArray(value.reminderTimes) &&
    value.reminderTimes.length > 0 &&
    value.reminderTimes.every(isTrainingTime)
  )
}

function migratePlan(value: unknown): TrainingPlan | null {
  if (
    !isRecord(value) ||
    !hasPlanBasics(value) ||
    !isClockPart(value.reminderHour, 23) ||
    !isClockPart(value.reminderMinute, 59)
  ) {
    return null
  }

  return {
    reminderEnabled: value.reminderEnabled,
    reminderTimes: [{ hour: value.reminderHour, minute: value.reminderMinute }],
    soundEnabled: value.soundEnabled,
    targetReps: value.targetReps,
  }
}

function isFailureReason(value: unknown) {
  return (
    value === "body_misalignment" ||
    value === "incomplete_lockout" ||
    value === "insufficient_depth"
  )
}

function isAttempt(value: unknown): value is WorkoutAttempt {
  return (
    isRecord(value) &&
    typeof value.durationMs === "number" &&
    Array.isArray(value.failureReasons) &&
    value.failureReasons.every(isFailureReason) &&
    typeof value.minBodyAngle === "number" &&
    typeof value.minElbowAngle === "number" &&
    typeof value.startedAtOffsetMs === "number" &&
    typeof value.valid === "boolean"
  )
}

type StoredSession = WorkoutSession

function hasSessionNumbers(
  value: Record<string, unknown>
): value is Record<string, unknown> &
  Pick<
    StoredSession,
    | "activeRepetitionTimeMs"
    | "endedAt"
    | "startedAt"
    | "targetReps"
    | "totalDurationMs"
    | "validReps"
  > {
  return (
    typeof value.activeRepetitionTimeMs === "number" &&
    typeof value.endedAt === "number" &&
    typeof value.startedAt === "number" &&
    typeof value.targetReps === "number" &&
    typeof value.totalDurationMs === "number" &&
    typeof value.validReps === "number"
  )
}

function hasSessionMetadata(
  value: Record<string, unknown>
): value is Record<string, unknown> &
  Pick<
    StoredSession,
    "id" | "localDate" | "soundEnabled" | "status" | "timezoneOffsetMinutes"
  > {
  return (
    typeof value.id === "string" &&
    typeof value.localDate === "string" &&
    typeof value.soundEnabled === "boolean" &&
    (value.status === "completed" || value.status === "stopped") &&
    typeof value.timezoneOffsetMinutes === "number"
  )
}

function hasSessionAttempts(
  value: Record<string, unknown>
): value is Record<string, unknown> & Pick<StoredSession, "attempts"> {
  return Array.isArray(value.attempts) && value.attempts.every(isAttempt)
}

function isStoredSession(value: unknown): value is StoredSession {
  return (
    isRecord(value) &&
    hasSessionNumbers(value) &&
    hasSessionMetadata(value) &&
    hasSessionAttempts(value)
  )
}

export function getLocalDate(timestamp: number) {
  const date = new Date(timestamp)
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function parseSession(value: unknown): WorkoutSession | null {
  if (!isStoredSession(value)) {
    return null
  }

  return {
    activeRepetitionTimeMs: value.activeRepetitionTimeMs,
    attempts: value.attempts,
    endedAt: value.endedAt,
    id: value.id,
    localDate: value.localDate,
    soundEnabled: value.soundEnabled,
    startedAt: value.startedAt,
    status: value.status,
    targetReps: value.targetReps,
    timezoneOffsetMinutes: value.timezoneOffsetMinutes,
    totalDurationMs: value.totalDurationMs,
    validReps: value.validReps,
  }
}

function writeJson(key: string, value: unknown) {
  Storage.setItemSync(key, JSON.stringify(value))
}

export function createSessionId() {
  return Crypto.randomUUID()
}

export function loadPlan(): TrainingPlan {
  const value = readJson(KEYS.plan)

  if (isPlan(value)) {
    return value
  }

  return migratePlan(value) ?? DEFAULT_PLAN
}

export function normalizeTrainingTimes(
  times: readonly TrainingTime[]
): TrainingTime[] {
  const seen = new Set<string>()
  const unique = times
    .toSorted(
      (first, second) =>
        first.hour - second.hour || first.minute - second.minute
    )
    .filter((time) => {
      const key = `${time.hour}:${time.minute}`

      if (seen.has(key)) {
        return false
      }

      seen.add(key)
      return true
    })

  return unique.length > 0 ? unique : DEFAULT_PLAN.reminderTimes
}

export function savePlan(plan: TrainingPlan) {
  writeJson(KEYS.plan, plan)
}

function parseSessions(value: unknown) {
  return Array.isArray(value)
    ? value.map(parseSession).filter((session) => session !== null)
    : []
}

export function saveSession(session: WorkoutSession) {
  const sessions = [
    session,
    ...listPendingSessions().filter((item) => item.id !== session.id),
  ]

  writeJson(KEYS.outbox, sessions)
}

export function listPendingSessions() {
  return parseSessions(readJson(KEYS.outbox))
}

export function markSessionSynced(sessionId: string) {
  const sessions = listPendingSessions().filter(
    (session) => session.id !== sessionId
  )

  writeJson(KEYS.outbox, sessions)
}
