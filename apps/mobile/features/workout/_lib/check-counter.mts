import assert from "node:assert/strict"

import {
  abandonActiveAttempt,
  createCounterState,
  getDepthGuideY,
  getPoseMetrics,
  getSetupState,
  isDepthReached,
  isReadyPosition,
  processPoseMetrics,
  recordTrackingLoss,
  type PoseLandmark,
  type PoseMetrics,
} from "./counter.ts"

const pose = (elbowAngle: number, shoulderY = 0.3): PoseMetrics => ({
  confidence: 0.9,
  elbowAngle,
  shoulderY,
})

const landmarks = () =>
  Array.from<PoseLandmark>({ length: 34 }, () => ({
    visibility: 0,
    x: 0,
    y: 0,
  }))

let state = createCounterState()
state = processPoseMetrics(state, pose(140), 100, false).state
state = processPoseMetrics(state, pose(120), 500, true).state
state = processPoseMetrics(state, pose(165), 900, false).state
assert.equal(state.validReps, 1)
assert.equal(state.attempts[0]?.valid, true)

state = processPoseMetrics(state, pose(140), 1_000, false).state
state = processPoseMetrics(state, pose(90), 1_300, false).state
state = processPoseMetrics(state, pose(165), 1_600, false).state
assert.deepEqual(state.attempts[1]?.failureReasons, ["insufficient_depth"])

state = processPoseMetrics(state, pose(140), 2_000, false).state
state = abandonActiveAttempt(state)
assert.equal(state.attempts.length, 2)

const missingShoulderLandmarks = landmarks()
missingShoulderLandmarks[11] = { visibility: 0.9, x: 0.1, y: 0.5 }
missingShoulderLandmarks[13] = { visibility: 0.9, x: 0.25, y: 0.5 }
missingShoulderLandmarks[15] = { visibility: 0.9, x: 0.4, y: 0.5 }
missingShoulderLandmarks[23] = { visibility: 0.9, x: 0.55, y: 0.5 }
missingShoulderLandmarks[27] = { visibility: 0.9, x: 0.9, y: 0.5 }
assert.equal(getPoseMetrics(missingShoulderLandmarks), null)

const frontLandmarks = landmarks()
frontLandmarks[11] = { visibility: 0.15, x: 0.35, y: 0.35 }
frontLandmarks[12] = { visibility: 0.15, x: 0.65, y: 0.35 }
frontLandmarks[13] = { visibility: 0.15, x: 0.3, y: 0.5 }
frontLandmarks[14] = { visibility: 0.15, x: 0.7, y: 0.5 }
frontLandmarks[15] = { visibility: 0.15, x: 0.25, y: 0.65 }
frontLandmarks[16] = { visibility: 0.15, x: 0.75, y: 0.65 }
frontLandmarks[23] = { visibility: 0.15, x: 0.35, y: 0.45 }
frontLandmarks[27] = { visibility: 0.15, x: 0.35, y: 0.55 }
const detectedFrontPose = getPoseMetrics(frontLandmarks)
assert.ok(detectedFrontPose)
assert.equal(isReadyPosition(detectedFrontPose), true)
assert.equal(detectedFrontPose.shoulderY, 0.35)
const depthGuideY = getDepthGuideY(frontLandmarks)
assert.ok(Math.abs((depthGuideY ?? 0) - 0.47) < 0.000_001)
assert.equal(isDepthReached(frontLandmarks, depthGuideY), false)
frontLandmarks[11] = { visibility: 0.15, x: 0.35, y: 0.459 }
frontLandmarks[12] = { visibility: 0.15, x: 0.65, y: 0.459 }
assert.equal(isDepthReached(frontLandmarks, depthGuideY), false)
frontLandmarks[11] = { visibility: 0.15, x: 0.35, y: 0.461 }
frontLandmarks[12] = { visibility: 0.15, x: 0.65, y: 0.461 }
assert.equal(isDepthReached(frontLandmarks, depthGuideY), true)

let frontState = createCounterState()
frontState = processPoseMetrics(frontState, pose(140), 100, false).state
frontState = processPoseMetrics(frontState, pose(90), 500, true).state
frontState = processPoseMetrics(frontState, pose(165), 900, false).state
assert.equal(frontState.validReps, 1)
assert.equal(frontState.attempts[0]?.minBodyAngle, 180)

assert.deepEqual(getSetupState(landmarks(), null, false), {
  hint: "Fit body in frame",
  valid: false,
})
frontLandmarks[0] = { visibility: 0.15, x: 0.5, y: 0.1 }
frontLandmarks[15] = { visibility: 0.15, x: 0.25, y: 0.85 }
frontLandmarks[16] = { visibility: 0.15, x: 0.75, y: 0.85 }
assert.deepEqual(getSetupState(frontLandmarks, pose(170), true), {
  hint: "Hold still",
  valid: true,
})
frontLandmarks[0] = { visibility: 0.15, x: 0.5, y: 0.35 }
frontLandmarks[15] = { visibility: 0.15, x: 0.25, y: 0.65 }
frontLandmarks[16] = { visibility: 0.15, x: 0.75, y: 0.65 }
assert.deepEqual(getSetupState(frontLandmarks, pose(170), true), {
  hint: "Move closer to camera",
  valid: false,
})

let recoveredState = createCounterState()
recoveredState = processPoseMetrics(recoveredState, pose(140), 100, false).state
recoveredState = processPoseMetrics(recoveredState, pose(120), 400, false).state
recoveredState = recordTrackingLoss(recoveredState, 400, false)
recoveredState = processPoseMetrics(
  recoveredState,
  pose(165),
  1050,
  false
).state
assert.equal(recoveredState.validReps, 1)

let lostState = createCounterState()
lostState = processPoseMetrics(lostState, pose(140), 100, false).state
lostState = processPoseMetrics(lostState, pose(120), 400, false).state
lostState = recordTrackingLoss(lostState, 400, false)
lostState = processPoseMetrics(lostState, pose(165), 1200, false).state
assert.deepEqual(lostState.attempts[0]?.failureReasons, ["tracking_lost"])

// The first rep of `state` was sampled at 100/500/900ms, all past the 80ms
// interval, so the trace is the whole descent and lockout.
assert.deepEqual(state.attempts[0]?.trace, [140, 120, 165])
// Frames closer together than the sample interval are dropped, but the closing
// lockout is always kept.
let denseState = createCounterState()
denseState = processPoseMetrics(denseState, pose(140), 20, false).state
denseState = processPoseMetrics(denseState, pose(130), 60, false).state
denseState = processPoseMetrics(denseState, pose(100), 400, true).state
denseState = processPoseMetrics(denseState, pose(95), 440, true).state
denseState = processPoseMetrics(denseState, pose(165), 800, false).state
assert.deepEqual(denseState.attempts[0]?.trace, [140, 100, 165])

let depthState = createCounterState()
depthState = processPoseMetrics(
  depthState,
  pose(140, 0.3),
  100,
  false,
  -0.17
).state
depthState = processPoseMetrics(
  depthState,
  pose(100, 0.48),
  500,
  true,
  0.01
).state
depthState = processPoseMetrics(
  depthState,
  pose(165, 0.3),
  900,
  false,
  -0.17
).state
assert.deepEqual(depthState.attempts[0]?.depthTrace, [-0.17, 0.01, -0.17])

let cappedState = createCounterState()
cappedState = processPoseMetrics(cappedState, pose(150), 0, true).state
for (let index = 1; index <= 200; index += 1) {
  cappedState = processPoseMetrics(
    cappedState,
    pose(100),
    index * 100,
    true
  ).state
}
cappedState = processPoseMetrics(cappedState, pose(165), 20_100, true).state
assert.equal(cappedState.attempts[0]?.trace?.length, 48)

console.log("push-up counter check passed")
