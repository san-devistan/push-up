import assert from "node:assert/strict"

import { formatMilestoneRemaining, getLevel } from "./gamification.ts"

const days = (reps: number, count = 30) =>
  Array.from({ length: count }, () => ({ reps }))

const empty = getLevel({ bestStreak: 0, recentDays: [], totalReps: 0 })
assert.equal(empty.level, 1)
assert.equal(empty.nextLevel, 2)
assert.equal(empty.milestones.at(0)?.target, 6)
assert.equal(empty.milestones.at(1)?.target, 1)

const repsAlone = getLevel({ bestStreak: 0, recentDays: [], totalReps: 50 })
assert.equal(repsAlone.level, 1)

const level10 = getLevel({
  bestStreak: 2,
  recentDays: days(2),
  totalReps: 50,
})
assert.equal(level10.level, 10)
assert.equal(level10.nextLevel, 11)

const level79 = getLevel({
  bestStreak: 120,
  recentDays: days(49),
  totalReps: 20_000,
})
assert.equal(level79.level, 79)
const paceMilestone = level79.milestones.at(-1)
assert.equal(paceMilestone?.id, "recentDailyAverage")
assert.ok(paceMilestone)
assert.equal(formatMilestoneRemaining(paceMilestone), "1/day average")

const level80 = getLevel({
  bestStreak: 120,
  recentDays: days(50),
  totalReps: 20_000,
})
assert.equal(level80.level, 80)

const level100 = getLevel({
  bestStreak: 365,
  recentDays: days(100),
  totalReps: 60_000,
})
assert.equal(level100.level, 100)
assert.equal(level100.nextLevel, 100)
assert.equal(level100.percent, 100)
assert.deepEqual(level100.milestones, [])

const negative = getLevel({
  bestStreak: -10,
  recentDays: days(-10),
  totalReps: -10,
})
assert.equal(negative.level, 1)

console.log("Gamification checks passed")
