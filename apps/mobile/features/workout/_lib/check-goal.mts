import assert from "node:assert/strict"

import {
  goalAtIndex,
  GOAL_STEPS,
  LAST_GOAL_INDEX,
  MAX_TARGET_REPS,
  MIN_TARGET_REPS,
  nearestGoalIndex,
  repsPerSession,
} from "./goal.ts"

assert.equal(GOAL_STEPS[0], MIN_TARGET_REPS)
assert.equal(GOAL_STEPS.at(-1), MAX_TARGET_REPS)
assert.equal(LAST_GOAL_INDEX, GOAL_STEPS.length - 1)

for (const [index, step] of GOAL_STEPS.entries()) {
  if (index > 0) {
    assert.ok(step > (GOAL_STEPS[index - 1] ?? 0), `step ${step} out of order`)
  }
}

assert.deepEqual(GOAL_STEPS.slice(0, 10), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
assert.deepEqual(GOAL_STEPS.slice(10, 13), [15, 20, 25])
assert.equal(GOAL_STEPS.includes(100), true)
assert.deepEqual(GOAL_STEPS.slice(28, 31), [125, 150, 175])

assert.equal(GOAL_STEPS[nearestGoalIndex(1)], 1)
assert.equal(GOAL_STEPS[nearestGoalIndex(10)], 10)
assert.equal(GOAL_STEPS[nearestGoalIndex(12)], 10)
assert.equal(GOAL_STEPS[nearestGoalIndex(13)], 15)
assert.equal(GOAL_STEPS[nearestGoalIndex(487)], 475)
assert.equal(GOAL_STEPS[nearestGoalIndex(9999)], 500)
assert.equal(GOAL_STEPS[nearestGoalIndex(-5)], 1)

assert.equal(goalAtIndex(-1), 1)
assert.equal(goalAtIndex(LAST_GOAL_INDEX + 5), 500)

assert.equal(repsPerSession(30, 1), 30)
assert.equal(repsPerSession(30, 2), 15)
assert.equal(repsPerSession(30, 4), 8)
assert.equal(repsPerSession(10, 3), 4)
assert.equal(repsPerSession(1, 3), 1)
assert.equal(repsPerSession(30, 0), 30)

for (const total of [1, 7, 10, 45, 500]) {
  for (const sessions of [1, 2, 3, 4, 5, 6]) {
    const each = repsPerSession(total, sessions)
    assert.ok(each >= 1, `${total}/${sessions} must ask for at least one rep`)
    assert.ok(
      each * sessions >= total,
      `${total}/${sessions} must reach the daily goal`
    )
  }
}

console.log("Goal ladder checks passed")
