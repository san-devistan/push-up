import assert from "node:assert/strict"

import {
  formatActivityDate,
  getActivityDaysAgo,
  getCurrentWeekActivity,
  getWeeklyComparison,
} from "./activity-window.ts"

const thursday = new Date(2026, 7, 20, 12).getTime()
const week = getCurrentWeekActivity(thursday, [
  { date: "2026-08-20", reps: 12 },
])
assert.equal(week.length, 7)
assert.equal(week[0]?.date, "2026-08-17")
assert.equal(week.at(-1)?.date, "2026-08-23")
assert.equal(week[3]?.reps, 12)
assert.equal(getActivityDaysAgo("2026-08-20", thursday), 0)
assert.equal(getActivityDaysAgo("2026-08-19", thursday), 1)
assert.equal(getActivityDaysAgo("2026-08-13", thursday), 7)
assert.equal(formatActivityDate("2026-08-12", "en-US"), "12 Aug.")

const comparison = getWeeklyComparison(
  Array.from({ length: 14 }, (_, index) => ({
    date: `2026-08-${String(index + 1).padStart(2, "0")}`,
    reps: index + 1,
  }))
)
assert.equal(comparison.current, 77)
assert.equal(comparison.percent, 175)
assert.deepEqual(comparison.data[0], { current: 8, day: 1, previous: 1 })
assert.deepEqual(comparison.data.at(-1), { current: 14, day: 7, previous: 7 })
assert.equal(getWeeklyComparison([]).percent, null)

console.log("Activity window checks passed")
