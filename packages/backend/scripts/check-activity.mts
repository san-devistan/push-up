import { summarizeActivity } from "#convex/workoutActivity"
import assert from "node:assert/strict"

const session = (
  localDate: string,
  validReps: number,
  invalidReps = 0,
  activeRepetitionTimeMs = validReps * 2000
) => ({ activeRepetitionTimeMs, invalidReps, localDate, validReps })

const summary = summarizeActivity(
  [
    session("2026-08-10", 5),
    session("2026-08-12", 10, 2),
    session("2026-08-13", 1),
    session("2026-08-14", 2),
    session("2026-08-15", 0),
  ],
  "2026-08-15",
  7
)

assert.equal(summary.totalPushups, 18)
assert.equal(summary.currentStreak, 3)
assert.equal(summary.bestStreak, 3)
assert.equal(summary.totalAttempts, 20)
assert.equal(summary.successRate, 90)
assert.equal(summary.totalSessions, 5)
assert.equal(summary.bestDayReps, 10)
assert.equal(summary.bestSessionReps, 10)
assert.equal(summary.todayReps, 0)
assert.equal(summary.averageRepMs, 1800)
assert.deepEqual(summary.recentDays.at(-1), { date: "2026-08-15", reps: 0 })
assert.deepEqual(summary.weeks, [{ reps: 18, start: "2026-08-09" }])

const empty = summarizeActivity([], "2026-08-15", 7)

assert.equal(empty.successRate, 0)
assert.equal(empty.averageRepMs, 0)
assert.equal(empty.bestDayReps, 0)
assert.equal(empty.currentStreak, 0)

console.log("Workout activity checks passed")
