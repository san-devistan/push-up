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
import {
  appendSessionDebugFrame,
  MAX_SESSION_DEBUG_FRAMES,
  serializeSessionDebugFrames,
  type SessionDebugFrame,
} from "./session-debug.ts"

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

const debugFrame = (elapsedMs: number): SessionDebugFrame => ({
  counter: {
    active: true,
    attempts: 0,
    maxTrackingGapMs: 0,
    minElbowAngle: 120,
    reachedBottom: false,
    validReps: 0,
  },
  depth: {
    deltaY: -0.01,
    guideY: 0.5,
    reached: false,
    shoulderY: 0.49,
  },
  elapsedMs,
  metrics: { confidence: 0.9, elbowAngle: 120 },
  pose: {
    bestArmConfidence: 0.9,
    handsY: 0.8,
    headY: 0.2,
    leftShoulderVisibility: 0.9,
    rightShoulderVisibility: 0.9,
    shoulderGap: 0.2,
    shoulderY: 0.49,
    wristY: 0.8,
  },
  ready: false,
  setupHint: "Start from top position",
  trackingGapMs: 0,
})
const debugFrames: SessionDebugFrame[] = []
for (let elapsedMs = 0; elapsedMs <= MAX_SESSION_DEBUG_FRAMES; elapsedMs += 1) {
  appendSessionDebugFrame(debugFrames, debugFrame(elapsedMs))
}
assert.equal(debugFrames.length, MAX_SESSION_DEBUG_FRAMES)
assert.equal(debugFrames[0]?.elapsedMs, 1)
const serializedDebugFrames = serializeSessionDebugFrames(debugFrames)
assert.ok(serializedDebugFrames)
const parsedDebugFrames: unknown = JSON.parse(serializedDebugFrames)
assert.ok(Array.isArray(parsedDebugFrames))
assert.equal(parsedDebugFrames.length, MAX_SESSION_DEBUG_FRAMES)

console.log("push-up counter check passed")
