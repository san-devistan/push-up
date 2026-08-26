import assert from "node:assert/strict"

import {
  abandonActiveAttempt,
  COUNTER_THRESHOLDS,
  createCounterState,
  finishActiveAttempt,
  getPushupDepthProgress,
  processDepthRatio,
  recordTrackingLoss,
} from "./counter.ts"
import { getMedianDepthMeters } from "./depth.ts"
import {
  getRepExpression,
  getSetupGuidance,
  getTrackingGuidance,
} from "./guidance.ts"
import {
  getPhoneInclinationDegrees,
  isPhoneFlat,
  requireFlatPhone,
} from "./inclination.ts"
import { getActiveTrackingHint, getTrackingSetupState } from "./setup.ts"
import { connectTrace } from "./trace.ts"
import {
  createTrackingCalibration,
  finishTrackingCalibration,
  getActiveTrackingStatus,
  getTrackingDepthRatio,
  getTrackingFrame,
  getTrackingHintAfterGrace,
  getTrackingRatios,
  getTrackingScales,
  hasPoseTracking,
  sampleTrackingCalibration,
} from "./tracking.ts"

assert.equal(getPushupDepthProgress(1), 0)
assert.equal(getPushupDepthProgress(COUNTER_THRESHOLDS.bottom), 1)
assert.equal(getPushupDepthProgress(2), 1)

let state = createCounterState()
state = processDepthRatio(state, 1.15, 100, true).state
state = processDepthRatio(state, 1.4, 200, false).state
state = processDepthRatio(state, 1.05, 300, false).state
assert.equal(state.validReps, 1)
assert.equal(state.attempts[0]?.valid, true)

state = processDepthRatio(state, 1.15, 1_000, true).state
state = processDepthRatio(state, 1.2, 1_300, true).state
state = processDepthRatio(state, 1.05, 1_600, true).state
assert.deepEqual(state.attempts[1]?.failureReasons, ["insufficient_depth"])

state = processDepthRatio(state, 1.2, 2_000, true).state
state = abandonActiveAttempt(state)
assert.equal(state.attempts.length, 2)

let recoveredState = createCounterState()
recoveredState = processDepthRatio(recoveredState, 1.15, 100, true).state
recoveredState = processDepthRatio(recoveredState, 1.4, 400, true).state
recoveredState = recordTrackingLoss(recoveredState, 400)
recoveredState = processDepthRatio(recoveredState, 1.05, 1_050, true).state
assert.equal(recoveredState.validReps, 1)

let lostState = createCounterState()
lostState = processDepthRatio(lostState, 1.15, 100, true).state
lostState = processDepthRatio(lostState, 1.4, 400, true).state
lostState = recordTrackingLoss(lostState, 400)
lostState = processDepthRatio(lostState, 1.05, 1_200, true).state
assert.deepEqual(lostState.attempts[0]?.failureReasons, ["tracking_lost"])

let stoppedState = createCounterState()
stoppedState = processDepthRatio(
  stoppedState,
  COUNTER_THRESHOLDS.bottom,
  100,
  true
).state
stoppedState = finishActiveAttempt(stoppedState, 800)
assert.deepEqual(stoppedState.attempts[0]?.failureReasons, [
  "incomplete_return",
])

let denseState = createCounterState()
denseState = processDepthRatio(denseState, 1.15, 0, true).state
for (let index = 1; index <= 200; index += 1) {
  denseState = processDepthRatio(denseState, 1.4, index * 100, true).state
}
denseState = processDepthRatio(denseState, 1.05, 20_100, true).state
assert.equal(denseState.attempts[0]?.depthTrace?.length, 48)
assert.deepEqual(connectTrace([0.05, -0.3], undefined), [0.05, -0.3])
assert.deepEqual(connectTrace([0.05, -0.3], -0.2), [-0.2, 0.05, -0.3])

const validSetup = getTrackingSetupState(true)
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
const invalidSetup = getTrackingSetupState(false)
assert.deepEqual(invalidSetup, {
  framing: "unknown",
  hint: "bodyCamera",
  valid: false,
})
assert.deepEqual(requireFlatPhone(invalidSetup, false), {
  framing: "unknown",
  hint: "layPhoneFlat",
  valid: false,
})
assert.equal(
  getActiveTrackingHint(false, { depth: 1, poseVerified: true }),
  "layPhoneFlat"
)
assert.equal(getActiveTrackingHint(false, null), "layPhoneFlat")
assert.equal(getActiveTrackingHint(true, null), "bodyCamera")
assert.equal(
  getActiveTrackingHint(true, { depth: null, poseVerified: true }),
  "bodyCamera"
)
assert.equal(
  getActiveTrackingHint(true, { depth: 1, poseVerified: false }),
  "bodyCamera"
)
assert.equal(
  getActiveTrackingHint(true, { depth: 1, poseVerified: true }),
  null
)
let trackingStatus = getActiveTrackingStatus(
  { body: 0, depth: 0 },
  0,
  true,
  { depth: 1, poseVerified: false },
  1000
)
trackingStatus = getActiveTrackingStatus(
  trackingStatus.signalSeenAt,
  0,
  true,
  { depth: null, poseVerified: true },
  1200
)
trackingStatus = getActiveTrackingStatus(
  trackingStatus.signalSeenAt,
  0,
  true,
  { depth: null, poseVerified: true },
  2000
)
assert.equal(trackingStatus.type, "issue")
assert.equal(trackingStatus.hint, null)
trackingStatus = getActiveTrackingStatus(
  trackingStatus.signalSeenAt,
  0,
  true,
  { depth: null, poseVerified: true },
  2501
)
assert.equal(trackingStatus.type, "issue")
assert.equal(trackingStatus.hint, "bodyCamera")
assert.equal(getTrackingHintAfterGrace("bodyCamera", 500), null)
assert.equal(getTrackingHintAfterGrace("bodyCamera", 1501), "bodyCamera")

const landmarks = Array.from({ length: 33 }, () => ({
  visibility: 0,
  x: 0,
  y: 0,
  z: 0,
}))
landmarks[11] = { visibility: 0.9, x: 0.4, y: 0.4, z: 0 }
landmarks[12] = { visibility: 0.9, x: 0.6, y: 0.4, z: 0 }
landmarks[3] = { visibility: 0.9, x: 0.46, y: 0.25, z: 0 }
landmarks[6] = { visibility: 0.9, x: 0.54, y: 0.25, z: 0 }
landmarks[7] = { visibility: 0.8, x: 0.42, y: 0.28, z: 0 }
landmarks[8] = { visibility: 0.8, x: 0.58, y: 0.28, z: 0 }
landmarks[9] = { visibility: 0.9, x: 0.47, y: 0.32, z: 0 }
landmarks[10] = { visibility: 0.9, x: 0.53, y: 0.32, z: 0 }
landmarks[23] = { visibility: 0.8, x: 0.42, y: 0.7, z: 0 }
landmarks[24] = { visibility: 0.8, x: 0.58, y: 0.7, z: 0 }

const depth = {
  accuracy: "absolute" as const,
  distanceMeters: 0.8,
  quality: "high" as const,
}
const topScales = getTrackingScales({ depth, landmarks })
assert.equal(hasPoseTracking(topScales), true)

let trackingCalibration = createTrackingCalibration()
for (let index = 0; index < 3; index += 1) {
  trackingCalibration = sampleTrackingCalibration(
    trackingCalibration,
    topScales
  )
}

const trackingBaseline = finishTrackingCalibration(trackingCalibration)
assert.notEqual(trackingBaseline, null)

let shouldersOnlyCalibration = createTrackingCalibration()
for (let index = 0; index < 3; index += 1) {
  shouldersOnlyCalibration = sampleTrackingCalibration(
    shouldersOnlyCalibration,
    {
      distanceMeters: topScales.distanceMeters,
      ears: null,
      eyes: null,
      hips: null,
      mouth: null,
      shoulders: topScales.shoulders,
    }
  )
}
assert.notEqual(finishTrackingCalibration(shouldersOnlyCalibration), null)
assert.equal(
  getTrackingFrame({ depth, landmarks }, null, true).setup.valid,
  true
)

let faceOnlyCalibration = createTrackingCalibration()
for (let index = 0; index < 3; index += 1) {
  faceOnlyCalibration = sampleTrackingCalibration(faceOnlyCalibration, {
    distanceMeters: topScales.distanceMeters,
    ears: topScales.ears,
    eyes: topScales.eyes,
    hips: null,
    mouth: topScales.mouth,
    shoulders: null,
  })
}
assert.notEqual(finishTrackingCalibration(faceOnlyCalibration), null)

const lowerLandmarks = landmarks.map((landmark) => ({ ...landmark }))
lowerLandmarks[3] = { visibility: 0.9, x: 0.444, y: 0.25, z: 0 }
lowerLandmarks[6] = { visibility: 0.9, x: 0.556, y: 0.25, z: 0 }
lowerLandmarks[7] = { visibility: 0.8, x: 0.388, y: 0.28, z: 0 }
lowerLandmarks[8] = { visibility: 0.8, x: 0.612, y: 0.28, z: 0 }
lowerLandmarks[9] = { visibility: 0.9, x: 0.458, y: 0.32, z: 0 }
lowerLandmarks[10] = { visibility: 0.9, x: 0.542, y: 0.32, z: 0 }
lowerLandmarks[11] = { visibility: 0.9, x: 0.36, y: 0.4, z: 0 }
lowerLandmarks[12] = { visibility: 0.9, x: 0.64, y: 0.4, z: 0 }
lowerLandmarks[23] = { visibility: 0.8, x: 0.388, y: 0.7, z: 0 }
lowerLandmarks[24] = { visibility: 0.8, x: 0.612, y: 0.7, z: 0 }

if (trackingBaseline) {
  const lowerDepth = { ...depth, distanceMeters: depth.distanceMeters / 1.4 }
  const lowerScales = getTrackingScales({
    depth: lowerDepth,
    landmarks: lowerLandmarks,
  })
  const fusedRatio = getTrackingDepthRatio(lowerScales, trackingBaseline, 1)
  assert.ok(fusedRatio !== null && Math.abs(fusedRatio - 1.4) < 0.001)
  assert.equal(
    getTrackingRatios(lowerScales, trackingBaseline, 1).source,
    "depth+pose"
  )

  const faceOnlyLandmarks = lowerLandmarks.map((landmark) => ({ ...landmark }))
  faceOnlyLandmarks[11] = { visibility: 0, x: 0, y: 0, z: 0 }
  faceOnlyLandmarks[12] = { visibility: 0, x: 0, y: 0, z: 0 }
  faceOnlyLandmarks[23] = { visibility: 0, x: 0, y: 0, z: 0 }
  faceOnlyLandmarks[24] = { visibility: 0, x: 0, y: 0, z: 0 }
  const faceRatios = getTrackingRatios(
    getTrackingScales({ depth: lowerDepth, landmarks: faceOnlyLandmarks }),
    trackingBaseline,
    1
  )
  assert.equal(faceRatios.source, "depth+pose")
  assert.ok(
    faceRatios.depth !== null && Math.abs(faceRatios.depth - 1.4) < 0.001
  )

  const badTorso = lowerLandmarks.map((landmark) => ({ ...landmark }))
  badTorso[11] = { visibility: 0.9, x: 0.49, y: 0.4, z: 0 }
  badTorso[12] = { visibility: 0.9, x: 0.51, y: 0.4, z: 0 }
  badTorso[23] = { visibility: 0, x: 0, y: 0, z: 0 }
  badTorso[24] = { visibility: 0, x: 0, y: 0, z: 0 }
  assert.equal(
    getTrackingRatios(
      getTrackingScales({ depth: lowerDepth, landmarks: badTorso }),
      trackingBaseline,
      1
    ).source,
    "depth+pose"
  )

  assert.equal(
    getTrackingRatios(
      {
        distanceMeters: (trackingBaseline.distanceMeters ?? 0) / 6,
        ears: (trackingBaseline.ears ?? 0) * 1.8,
        eyes: (trackingBaseline.eyes ?? 0) * 1.8,
        hips: (trackingBaseline.hips ?? 0) * 1.8,
        mouth: (trackingBaseline.mouth ?? 0) * 1.8,
        shoulders: (trackingBaseline.shoulders ?? 0) * 1.8,
      },
      trackingBaseline,
      1
    ).depth,
    null
  )

  const noPoseScales = getTrackingScales({
    depth: lowerDepth,
    landmarks: landmarks.map(() => ({ visibility: 0, x: 0, y: 0, z: 0 })),
  })
  const depthOnlyRatios = getTrackingRatios(noPoseScales, trackingBaseline, 1)
  assert.equal(depthOnlyRatios.source, "depth")
  assert.equal(depthOnlyRatios.poseVerified, false)
  assert.equal(getActiveTrackingHint(true, depthOnlyRatios), "bodyCamera")
  assert.ok(
    depthOnlyRatios.depth !== null &&
      Math.abs(depthOnlyRatios.depth - 1.4) < 0.001
  )
}

let unverifiedState = createCounterState()
unverifiedState = processDepthRatio(unverifiedState, 1.15, 100, false).state
unverifiedState = processDepthRatio(unverifiedState, 1.4, 500, false).state
unverifiedState = processDepthRatio(unverifiedState, 1.05, 900, false).state
assert.deepEqual(unverifiedState.attempts[0]?.failureReasons, ["tracking_lost"])

const floatDepthBuffer = new ArrayBuffer(8 * 8 * 4)
new Float32Array(floatDepthBuffer).fill(0.75)
assert.equal(
  getMedianDepthMeters({
    buffer: floatDepthBuffer,
    bytesPerRow: 8 * 4,
    format: "float-depth-32",
    height: 8,
    width: 8,
  }),
  0.75
)

const androidDepthBuffer = new ArrayBuffer(8 * 8 * 2)
new Uint16Array(androidDepthBuffer).fill(750 | (4 << 13))
assert.equal(
  getMedianDepthMeters({
    buffer: androidDepthBuffer,
    bytesPerRow: 8 * 2,
    format: "android-depth-16",
    height: 8,
    width: 8,
  }),
  0.75
)

assert.equal(getPhoneInclinationDegrees({ x: 0, y: 0, z: 0 }), null)
assert.equal(getPhoneInclinationDegrees({ x: 0, y: -1, z: 0 }), 0)
assert.equal(getPhoneInclinationDegrees({ x: 0, y: 0, z: 1 }), 90)
assert.equal(isPhoneFlat(90), true)
assert.equal(isPhoneFlat(60), false)

assert.notEqual(getRepExpression(0), getRepExpression(1))
assert.equal(getRepExpression(5), getRepExpression(0))
assert.deepEqual(getSetupGuidance("unknown", false), {
  expression: "angry-brows",
  message: "hint.layPhoneFlat",
})
assert.deepEqual(getSetupGuidance("ready", false), {
  expression: "angry-brows",
  message: "hint.layPhoneFlat",
})
assert.deepEqual(getSetupGuidance("unknown", true), {
  expression: "uneasy-left",
  message: "setup.noBody",
})
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
