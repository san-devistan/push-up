import assert from "node:assert/strict"

import {
  abandonActiveAttempt,
  COUNTER_THRESHOLDS,
  createCounterState,
  finishActiveAttempt,
  getDepthGlowProgress,
  processDepthMeters,
  recordTrailingDepth,
} from "./counter.ts"
import { getDepthMeasurement, getMedianDepthMeters } from "./depth.ts"
import { getRepExpression, getTrackingGuidance } from "./guidance.ts"
import { getPhoneInclinationDegrees, isPhoneFlat } from "./inclination.ts"
import { getActiveTrackingHint } from "./setup.ts"
import { sampleTrace, startTrace } from "./trace.ts"
import {
  createTrackingIssueState,
  getActiveTrackingStatus,
  getTrackingFrame,
  getTrackingScales,
  hasPoseTracking,
} from "./tracking.ts"

const glowAt325mm = getDepthGlowProgress(0.325)
const glowAt30cm = getDepthGlowProgress(0.3)
const glowAt275mm = getDepthGlowProgress(0.275)
assert.equal(getDepthGlowProgress(0.35), 0)
assert.equal(getDepthGlowProgress(0.25), 1)
assert.equal(getDepthGlowProgress(0), 1)
assert.ok(glowAt325mm > 0)
assert.ok(glowAt325mm > glowAt30cm - glowAt325mm)
assert.ok(glowAt30cm - glowAt325mm > glowAt275mm - glowAt30cm)
assert.ok(glowAt275mm - glowAt30cm > 1 - glowAt275mm)

const maximumTopState = processDepthMeters(
  createCounterState(),
  COUNTER_THRESHOLDS.topMaximumMeters,
  0,
  true
).state
assert.notEqual(maximumTopState.topPosition, null)
const aboveMaximumTopState = processDepthMeters(
  createCounterState(),
  COUNTER_THRESHOLDS.topMaximumMeters + 0.001,
  0,
  true
).state
assert.equal(aboveMaximumTopState.topPosition, null)

let boundaryState = createCounterState()
boundaryState = processDepthMeters(boundaryState, 0.3, 0, true).state
boundaryState = processDepthMeters(boundaryState, 0.299, 100, true).state
boundaryState = processDepthMeters(boundaryState, 0.3, 200, true).state
assert.equal(boundaryState.validReps, 1)

let state = createCounterState()
state = processDepthMeters(state, 0.2, 100, true).state
assert.equal(state.activeAttempt, null)
state = processDepthMeters(state, 0.5, 200, false).state
assert.equal(state.topPosition, null)
state = processDepthMeters(state, 0.5, 300, true).state
state = processDepthMeters(state, 0.35, 400, true).state
state = processDepthMeters(state, 0.3, 450, false).state
assert.equal(state.activeAttempt, null)
state = processDepthMeters(state, 0.299, 500, false).state
assert.notEqual(state.activeAttempt, null)
state = processDepthMeters(state, 0.5, 800, false).state
assert.equal(state.validReps, 0)
state = processDepthMeters(state, 0.5, 900, true).state
assert.equal(state.validReps, 1)
assert.equal(state.topPosition?.startedAtOffsetMs, 900)
assert.deepEqual(state.attempts[0]?.depthTrace, [0.5, 0.35, 0.299, 0.5, 0.5])
assert.deepEqual(
  state.attempts[0]?.depthTraceOffsetsMs,
  [300, 400, 500, 800, 900]
)

state = recordTrailingDepth(state, 0.55, 980)
state = recordTrailingDepth(state, 0.6, 1060)
assert.deepEqual(state.attempts[0]?.depthTrace?.slice(-2), [0.55, 0.6])
assert.deepEqual(state.attempts[0]?.depthTraceOffsetsMs?.slice(-2), [980, 1060])
assert.equal(state.attempts[0]?.durationMs, 760)

state = processDepthMeters(state, 0.2, 1_100, false).state
state = processDepthMeters(state, 0.5, 1_400, true).state
assert.equal(state.validReps, 2)
assert.equal(state.attempts[1]?.startedAtOffsetMs, 900)

let stoppedState = createCounterState()
stoppedState = processDepthMeters(stoppedState, 0.5, 100, true).state
stoppedState = processDepthMeters(stoppedState, 0.2, 500, false).state
stoppedState = finishActiveAttempt(stoppedState, 800)
assert.deepEqual(stoppedState.attempts[0]?.failureReasons, [
  "incomplete_return",
])

let abandonedState = createCounterState()
abandonedState = processDepthMeters(abandonedState, 0.5, 100, true).state
abandonedState = processDepthMeters(abandonedState, 0.2, 500, false).state
abandonedState = abandonActiveAttempt(abandonedState)
assert.equal(abandonedState.activeAttempt, null)
assert.equal(abandonedState.topPosition, null)

let denseState = createCounterState()
denseState = processDepthMeters(denseState, 0.5, 0, true).state
denseState = processDepthMeters(denseState, 0.2, 100, false).state
for (let index = 1; index <= 200; index += 1) {
  denseState = processDepthMeters(denseState, 0.2, index * 100, false).state
}
denseState = processDepthMeters(denseState, 0.5, 20_100, true).state
assert.ok((denseState.attempts[0]?.depthTrace?.length ?? 0) > 48)
assert.equal(denseState.attempts[0]?.depthTrace?.at(-1), 0.5)
assert.equal(denseState.attempts[0]?.depthTraceOffsetsMs?.at(-1), 20_100)

const preciseTrace = sampleTrace(startTrace(0.512_345, 0), 0.234_567, 100)
assert.deepEqual(preciseTrace.depthTrace, [0.512_345, 0.234_567])
assert.deepEqual(preciseTrace.depthTraceOffsetsMs, [0, 100])

assert.equal(getActiveTrackingHint(false, 0.2, false), "layPhoneFlat")
assert.equal(getActiveTrackingHint(true, 0.2, false), "bodyCamera")
assert.equal(getActiveTrackingHint(true, null, true), "bodyCamera")
assert.equal(getActiveTrackingHint(true, 0.01, true), null)
assert.equal(getActiveTrackingHint(true, 10, true), null)
assert.equal(getActiveTrackingHint(true, 0.3, true), null)

let issueState = createTrackingIssueState()
let trackingStatus = getActiveTrackingStatus(
  issueState,
  true,
  {
    depthMeters: 0.2,
    poseVerified: false,
  },
  1_000
)
assert.equal(trackingStatus.type, "issue")
assert.equal(trackingStatus.type === "issue" ? trackingStatus.hint : null, null)
issueState = trackingStatus.issueState
trackingStatus = getActiveTrackingStatus(
  issueState,
  true,
  {
    depthMeters: 0.2,
    poseVerified: false,
  },
  2_501
)
assert.equal(
  trackingStatus.type === "issue" ? trackingStatus.hint : null,
  "bodyCamera"
)

const landmarks = Array.from({ length: 33 }, () => ({
  visibility: 0,
  x: 0,
  y: 0,
  z: 0,
}))
landmarks[3] = { visibility: 0.9, x: 0.46, y: 0.25, z: 0 }
landmarks[6] = { visibility: 0.9, x: 0.54, y: 0.25, z: 0 }
landmarks[7] = { visibility: 0.8, x: 0.42, y: 0.28, z: 0 }
landmarks[8] = { visibility: 0.8, x: 0.58, y: 0.28, z: 0 }
landmarks[9] = { visibility: 0.9, x: 0.47, y: 0.32, z: 0 }
landmarks[10] = { visibility: 0.9, x: 0.53, y: 0.32, z: 0 }
landmarks[11] = { visibility: 0.9, x: 0.4, y: 0.4, z: 0 }
landmarks[12] = { visibility: 0.9, x: 0.6, y: 0.4, z: 0 }

const depth = {
  accuracy: "absolute" as const,
  distanceMeters: 0.5,
  quality: "high" as const,
}
const scales = getTrackingScales({ depth, landmarks })
assert.equal(hasPoseTracking(scales), true)
assert.equal(hasPoseTracking({ ...scales, shoulders: null }), true)
assert.equal(
  hasPoseTracking({
    ...scales,
    ears: null,
    eyes: null,
    mouth: null,
  }),
  true
)
assert.equal(
  hasPoseTracking({
    ...scales,
    ears: null,
    eyes: null,
    mouth: null,
    shoulders: null,
  }),
  false
)
const frame = getTrackingFrame({ depth, landmarks })
assert.equal(frame.signals.depthMeters, 0.5)
assert.equal(frame.signals.poseVerified, true)
assert.equal(
  getTrackingFrame({
    depth: { ...depth, distanceMeters: 0.2196 },
    landmarks,
  }).signals.depthMeters,
  0.2196
)

const floatDepthBuffer = new ArrayBuffer(8 * 8 * 4)
new Float32Array(floatDepthBuffer).fill(0.75)
const floatDepthMeasurement = getDepthMeasurement({
  buffer: floatDepthBuffer,
  bytesPerRow: 8 * 4,
  format: "float-depth-32",
  height: 8,
  width: 8,
})
assert.equal(floatDepthMeasurement.distanceMeters, null)
assert.equal(floatDepthMeasurement.sampleCount, 64)
assert.equal(floatDepthMeasurement.usableSampleCount, 0)

const zeroDepthBuffer = new ArrayBuffer(8 * 8 * 4)
assert.equal(
  getMedianDepthMeters({
    buffer: zeroDepthBuffer,
    bytesPerRow: 8 * 4,
    format: "float-depth-32",
    height: 8,
    width: 8,
  }),
  0
)

const androidDepthBuffer = new ArrayBuffer(8 * 8 * 2)
new Uint16Array(androidDepthBuffer).fill(700 | (4 << 13))
assert.equal(
  getMedianDepthMeters({
    buffer: androidDepthBuffer,
    bytesPerRow: 8 * 2,
    format: "android-depth-16",
    height: 8,
    width: 8,
  }),
  0.7
)

const mixedDepthBuffer = new ArrayBuffer(8 * 8 * 2)
const mixedDepthPixels = new Uint16Array(mixedDepthBuffer)
mixedDepthPixels.fill(1_200)
for (let y = 1; y < 7; y += 1) {
  for (let x = 2; x < 6; x += 1) {
    if ((y - 1) * 4 + x - 2 < 12) mixedDepthPixels[y * 8 + x] = 220
  }
}
const mixedDepthMeasurement = getDepthMeasurement({
  buffer: mixedDepthBuffer,
  bytesPerRow: 8 * 2,
  format: "android-depth-16",
  height: 8,
  width: 8,
})
assert.equal(mixedDepthMeasurement.distanceMeters, 0.22)
assert.equal(mixedDepthMeasurement.usableSampleCount, 12)

const lowCoverageDepthBuffer = new ArrayBuffer(8 * 8 * 2)
const lowCoverageDepthPixels = new Uint16Array(lowCoverageDepthBuffer)
lowCoverageDepthPixels.fill(1_200)
lowCoverageDepthPixels.fill(220, 0, 6)
const lowCoverageDepthMeasurement = getDepthMeasurement({
  buffer: lowCoverageDepthBuffer,
  bytesPerRow: 8 * 2,
  format: "android-depth-16",
  height: 8,
  width: 8,
})
assert.equal(lowCoverageDepthMeasurement.distanceMeters, null)
assert.equal(lowCoverageDepthMeasurement.usableSampleCount, 6)

assert.equal(getPhoneInclinationDegrees({ x: 0, y: 0, z: 0 }), null)
assert.equal(getPhoneInclinationDegrees({ x: 0, y: -1, z: 0 }), 0)
assert.equal(getPhoneInclinationDegrees({ x: 0, y: 0, z: 1 }), 90)
assert.equal(isPhoneFlat(90), true)
assert.equal(isPhoneFlat(60), false)

assert.notEqual(getRepExpression(0), getRepExpression(1))
assert.equal(getRepExpression(5), getRepExpression(0))
assert.deepEqual(getTrackingGuidance("bodyCamera"), {
  expression: "uneasy-left",
  message: "setup.noBody",
})
assert.deepEqual(getTrackingGuidance("layPhoneFlat"), {
  expression: "angry-brows",
  message: "hint.layPhoneFlat",
})
assert.equal(getTrackingGuidance(null), null)

console.log("tracking counter check passed")
