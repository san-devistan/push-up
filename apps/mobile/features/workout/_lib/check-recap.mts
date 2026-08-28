import assert from "node:assert/strict"

import { getActivityAfterSession, type Activity } from "./activity.ts"
import { getEstimatedCalories } from "./calories.ts"
import type { WorkoutSession } from "./storage.ts"

const before = {
  averageRepMs: 2000,
  bestDayReps: 10,
  bestSessionReps: 10,
  bestStreak: 2,
  currentStreak: 2,
  recentDays: [
    { date: "2026-08-25", reps: 10 },
    { date: "2026-08-26", reps: 0 },
  ],
  successRate: 100,
  todayAttempts: 0,
  todayReps: 0,
  totalActiveMs: 20_000,
  totalAttempts: 10,
  totalDurationMs: 25_000,
  totalPushups: 10,
  totalSessions: 1,
  weeks: [{ reps: 10, start: "2026-08-25" }],
} satisfies Activity

const attempts = Array.from({ length: 6 }, (_, index) => ({
  durationMs: 1500,
  failureReasons: index === 5 ? (["insufficient_depth"] as const) : [],
  startedAtOffsetMs: index * 2000,
  valid: index < 5,
}))
const session = {
  activeRepetitionTimeMs: 9000,
  attempts,
  endedAt: 12_000,
  id: "recap-check",
  localDate: "2026-08-26",
  soundEnabled: true,
  startedAt: 0,
  status: "completed",
  targetReps: 5,
  timezoneOffsetMinutes: -120,
  totalDurationMs: 12_000,
  validReps: 5,
} satisfies WorkoutSession

const after = getActivityAfterSession(before, before, session)

assert.equal(after?.totalPushups, 15)
assert.equal(after?.todayReps, 5)
assert.equal(after?.currentStreak, 3)
assert.equal(after?.bestStreak, 3)
assert.equal(after?.totalAttempts, 16)
assert.equal(after?.averageRepMs, 1933)
assert.equal(getEstimatedCalories(session.validReps), 1.6)
assert.equal(after?.successRate, 94)
assert.equal(after?.totalDurationMs, 37_000)
assert.equal(after?.weeks.at(-1)?.reps, 15)

console.log("Workout recap checks passed")
