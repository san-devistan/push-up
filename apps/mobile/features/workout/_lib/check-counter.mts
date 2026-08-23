import assert from "node:assert/strict"

import {
  abandonActiveAttempt,
  createCounterState,
  FACE_COUNTER_THRESHOLDS,
  finishActiveAttempt,
  processFaceScale,
  recordTrackingLoss,
} from "./counter.ts"
import {
  getPhoneInclinationDegrees,
  isPhoneFlat,
  requireFlatPhone,
} from "./inclination.ts"
import { getFaceScale, getFaceSetupState } from "./setup.ts"
import { connectTrace } from "./trace.ts"

const TOP_SCALE = 0.2
const scale = (ratio: number) => TOP_SCALE * ratio

let state = createCounterState()
state = processFaceScale(state, scale(1.15), TOP_SCALE, 100).state
state = processFaceScale(state, scale(1.4), TOP_SCALE, 500).state
state = processFaceScale(state, scale(1.05), TOP_SCALE, 900).state
assert.equal(state.validReps, 1)
assert.equal(state.attempts[0]?.valid, true)

state = processFaceScale(state, scale(1.15), TOP_SCALE, 1_000).state
state = processFaceScale(state, scale(1.2), TOP_SCALE, 1_300).state
state = processFaceScale(state, scale(1.05), TOP_SCALE, 1_600).state
assert.deepEqual(state.attempts[1]?.failureReasons, ["insufficient_depth"])

state = processFaceScale(state, scale(1.2), TOP_SCALE, 2_000).state
state = abandonActiveAttempt(state)
assert.equal(state.attempts.length, 2)

let recoveredState = createCounterState()
recoveredState = processFaceScale(
  recoveredState,
  scale(1.15),
  TOP_SCALE,
  100
).state
recoveredState = processFaceScale(
  recoveredState,
  scale(1.4),
  TOP_SCALE,
  400
).state
recoveredState = recordTrackingLoss(recoveredState, 400)
recoveredState = processFaceScale(
  recoveredState,
  scale(1.05),
  TOP_SCALE,
  1_050
).state
assert.equal(recoveredState.validReps, 1)

let lostState = createCounterState()
lostState = processFaceScale(lostState, scale(1.15), TOP_SCALE, 100).state
lostState = processFaceScale(lostState, scale(1.4), TOP_SCALE, 400).state
lostState = recordTrackingLoss(lostState, 400)
lostState = processFaceScale(lostState, scale(1.05), TOP_SCALE, 1_200).state
assert.deepEqual(lostState.attempts[0]?.failureReasons, ["tracking_lost"])

let stoppedState = createCounterState()
stoppedState = processFaceScale(
  stoppedState,
  scale(FACE_COUNTER_THRESHOLDS.bottom),
  TOP_SCALE,
  100
).state
stoppedState = finishActiveAttempt(stoppedState, 800)
assert.deepEqual(stoppedState.attempts[0]?.failureReasons, [
  "incomplete_return",
])

let denseState = createCounterState()
denseState = processFaceScale(denseState, scale(1.15), TOP_SCALE, 0).state
for (let index = 1; index <= 200; index += 1) {
  denseState = processFaceScale(
    denseState,
    scale(1.4),
    TOP_SCALE,
    index * 100
  ).state
}
denseState = processFaceScale(denseState, scale(1.05), TOP_SCALE, 20_100).state
assert.equal(denseState.attempts[0]?.depthTrace?.length, 48)
assert.deepEqual(connectTrace([0.05, -0.3], undefined), [0.05, -0.3])
assert.deepEqual(connectTrace([0.05, -0.3], -0.2), [-0.2, 0.05, -0.3])

const face = {
  frameHeight: 1000,
  frameWidth: 1000,
  height: 300,
  rollAngle: 0,
  width: 300,
  yawAngle: 0,
}
const faceScale = getFaceScale(face)
assert.equal(faceScale, 0.3)
const validSetup = getFaceSetupState(face, faceScale)
assert.deepEqual(validSetup, {
  framing: "ready",
  hint: "startTop",
  valid: true,
})
assert.deepEqual(requireFlatPhone(validSetup, false), {
  framing: "ready",
  hint: "layPhoneFlat",
  valid: false,
})
assert.deepEqual(getFaceSetupState(null, null), {
  framing: "unknown",
  hint: "faceCamera",
  valid: false,
})

assert.equal(getPhoneInclinationDegrees({ x: 0, y: 0, z: 0 }), null)
assert.equal(getPhoneInclinationDegrees({ x: 0, y: -1, z: 0 }), 0)
assert.equal(getPhoneInclinationDegrees({ x: 0, y: 0, z: 1 }), 90)
assert.equal(isPhoneFlat(90), true)
assert.equal(isPhoneFlat(60), false)

console.log("face counter check passed")
