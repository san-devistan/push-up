import assert from "node:assert/strict"

import {
  abandonActiveAttempt,
  createCounterState,
  getDepthGuideY,
  getPoseMetrics,
  isDepthReached,
  isReadyPosition,
  processPoseMetrics,
  type PoseLandmark,
  type PoseMetrics,
} from "./counter.ts"

const pose = (elbowAngle: number): PoseMetrics => ({
  confidence: 0.9,
  elbowAngle,
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

const sideLandmarks = landmarks()
sideLandmarks[11] = { visibility: 0.9, x: 0.1, y: 0.5 }
sideLandmarks[13] = { visibility: 0.9, x: 0.25, y: 0.5 }
sideLandmarks[15] = { visibility: 0.9, x: 0.4, y: 0.5 }
sideLandmarks[23] = { visibility: 0.9, x: 0.55, y: 0.5 }
sideLandmarks[27] = { visibility: 0.9, x: 0.9, y: 0.5 }
assert.equal(getPoseMetrics(sideLandmarks), null)

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
const depthGuideY = getDepthGuideY(frontLandmarks)
assert.ok(Math.abs((depthGuideY ?? 0) - 0.47) < 0.000_001)
assert.equal(isDepthReached(frontLandmarks, depthGuideY), false)
frontLandmarks[11] = { visibility: 0.15, x: 0.35, y: 0.48 }
frontLandmarks[12] = { visibility: 0.15, x: 0.65, y: 0.48 }
assert.equal(isDepthReached(frontLandmarks, depthGuideY), true)

let frontState = createCounterState()
frontState = processPoseMetrics(frontState, pose(140), 100, false).state
frontState = processPoseMetrics(frontState, pose(90), 500, true).state
frontState = processPoseMetrics(frontState, pose(165), 900, false).state
assert.equal(frontState.validReps, 1)
assert.equal(frontState.attempts[0]?.minBodyAngle, 180)

console.log("push-up counter check passed")
