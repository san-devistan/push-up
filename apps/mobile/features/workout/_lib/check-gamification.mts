import assert from "node:assert/strict"

import { formatCompact } from "./format.ts"
import {
  formatMilestoneRemaining,
  getLevel,
  getLevelRequirements,
} from "./gamification.ts"

const days = (reps: number, count = 30) =>
  Array.from({ length: count }, () => ({ reps }))

const empty = getLevel({ bestStreak: 0, recentDays: [], totalReps: 0 })
assert.equal(empty.level, 0)
assert.equal(empty.nextLevel, 1)
assert.deepEqual(
  empty.milestones.map(({ id, label, target }) => ({ id, label, target })),
  [
    { id: "totalReps", label: "10 total", target: 10 },
    { id: "streak", label: "1d streak", target: 1 },
    { id: "recentDailyAverage", label: "3/day", target: 3 },
  ]
)

const requirements = getLevelRequirements()
assert.equal(requirements.length, 100)
assert.equal(requirements.at(-1)?.level, 100)
let previousTotal = 0
for (const requirement of requirements) {
  assert.ok(requirement.totalReps > previousTotal)
  previousTotal = requirement.totalReps
}
assert.deepEqual(
  [
    1, 9, 10, 19, 20, 29, 30, 39, 40, 49, 50, 59, 60, 69, 70, 79, 80, 89, 90,
    99, 100,
  ].map((level) => requirements.at(level - 1)),
  [
    { level: 1, recentDailyAverage: 3, streak: 1, totalReps: 10 },
    { level: 9, recentDailyAverage: 3, streak: 9, totalReps: 90 },
    { level: 10, recentDailyAverage: 5, streak: 10, totalReps: 100 },
    { level: 19, recentDailyAverage: 5, streak: 19, totalReps: 190 },
    { level: 20, recentDailyAverage: 7, streak: 20, totalReps: 200 },
    { level: 29, recentDailyAverage: 7, streak: 30, totalReps: 290 },
    { level: 30, recentDailyAverage: 10, streak: 30, totalReps: 300 },
    { level: 39, recentDailyAverage: 10, streak: 45, totalReps: 480 },
    { level: 40, recentDailyAverage: 15, streak: 45, totalReps: 500 },
    { level: 49, recentDailyAverage: 15, streak: 60, totalReps: 950 },
    { level: 50, recentDailyAverage: 20, streak: 60, totalReps: 1000 },
    { level: 59, recentDailyAverage: 20, streak: 75, totalReps: 1450 },
    { level: 60, recentDailyAverage: 25, streak: 75, totalReps: 2000 },
    { level: 69, recentDailyAverage: 25, streak: 90, totalReps: 2900 },
    { level: 70, recentDailyAverage: 30, streak: 90, totalReps: 3000 },
    { level: 79, recentDailyAverage: 30, streak: 120, totalReps: 4800 },
    { level: 80, recentDailyAverage: 40, streak: 120, totalReps: 5000 },
    { level: 89, recentDailyAverage: 40, streak: 150, totalReps: 7250 },
    { level: 90, recentDailyAverage: 50, streak: 150, totalReps: 7500 },
    { level: 99, recentDailyAverage: 50, streak: 180, totalReps: 9750 },
    { level: 100, recentDailyAverage: 100, streak: 365, totalReps: 50_000 },
  ]
)
assert.equal(formatCompact(1500), "1.5k")
assert.equal(formatCompact(6250), "6.25k")
assert.equal(formatCompact(7250), "7.25k")
assert.equal(formatCompact(9750), "9.75k")
assert.equal(formatCompact(10_000), "10k")

const repsAlone = getLevel({ bestStreak: 0, recentDays: [], totalReps: 50 })
assert.equal(repsAlone.level, 0)

const level1 = getLevel({
  bestStreak: 1,
  recentDays: days(3),
  totalReps: 10,
})
assert.equal(level1.level, 1)

const level10 = getLevel({
  bestStreak: 10,
  recentDays: days(5),
  totalReps: 100,
})
assert.equal(level10.level, 10)
assert.equal(level10.nextLevel, 11)

const level79 = getLevel({
  bestStreak: 120,
  recentDays: days(39),
  totalReps: 5000,
})
assert.equal(level79.level, 79)
const paceMilestone = level79.milestones.at(-1)
assert.equal(paceMilestone?.id, "recentDailyAverage")
assert.ok(paceMilestone)
assert.equal(formatMilestoneRemaining(paceMilestone), "1/day average")

const level80 = getLevel({
  bestStreak: 120,
  recentDays: days(40),
  totalReps: 5000,
})
assert.equal(level80.level, 80)

const level100 = getLevel({
  bestStreak: 365,
  recentDays: days(100),
  totalReps: 50_000,
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
assert.equal(negative.level, 0)

console.log("Gamification checks passed")
