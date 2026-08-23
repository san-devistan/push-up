import assert from "node:assert/strict"

import {
  RULER_TICK_COUNT,
  rulerIndexAt,
  rulerLabelIndices,
  rulerTickHeight,
} from "./time-ruler.ts"

assert.equal(rulerIndexAt(-20, 300, 61), 0)
assert.equal(rulerIndexAt(150, 300, 61), 30)
assert.equal(rulerIndexAt(400, 300, 61), 60)
assert.deepEqual(rulerLabelIndices(61), [0, 30, 60])
assert.equal(rulerTickHeight(15, 30, 61), 64)
assert.equal(rulerTickHeight(0, 30, 61), 16)
assert.equal(RULER_TICK_COUNT, 31)

console.log("Time ruler checks passed")
