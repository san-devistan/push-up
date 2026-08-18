// Relative so `pnpm check:counter` can run this file under bare node, which
// does not resolve the "@/" alias.
import { closeTrace, sampleTrace, startTrace, type PoseTrace } from "./trace.ts"

export const PUSHUP_THRESHOLDS = {
  depthTolerance: 0.01,
  leaveTop: 150,
  recoveryMaxElbowAngle: 125,
  recoveryMaxTrackingGapMs: 750,
  recoveryMinAttemptMs: 700,
  top: 160,
  visibility: 0.1,
} as const

export type FailureReason =
  | "body_misalignment"
  | "incomplete_lockout"
  | "insufficient_depth"
  | "tracking_lost"

export type PoseLandmark = {
  x: number
  y: number
  visibility: number
}

export type PoseMetrics = {
  confidence: number
  elbowAngle: number
  shoulderY: number
}

export type WorkoutAttempt = {
  // Shoulder distance from the calibrated depth guide, sampled through the
  // rep. Zero is the actual target shown by the camera overlay.
  depthTrace?: number[]
  durationMs: number
  failureReasons: FailureReason[]
  minBodyAngle: number
  minElbowAngle: number
  startedAtOffsetMs: number
  // Elbow angles sampled through the rep, oldest first — the motion curve the
  // summary graphs. Absent on sessions recorded before tracing existed.
  trace?: number[]
  valid: boolean
}

type ActiveAttempt = PoseTrace & {
  maxTrackingGapMs: number
  minElbowAngle: number
  reachedBottom: boolean
  startedAtOffsetMs: number
  trackingLostAtOffsetMs: number | null
}

export type CounterState = {
  activeAttempt: ActiveAttempt | null
  attempts: WorkoutAttempt[]
  validReps: number
}

export type CounterEvent =
  | { type: "none" }
  | { attempt: WorkoutAttempt; type: "attempt-completed" }

const ARM_LANDMARKS = [
  { elbow: 13, shoulder: 11, wrist: 15 },
  { elbow: 14, shoulder: 12, wrist: 16 },
] as const

const BODY_LANDMARKS = [11, 12, 13, 14, 15, 16, 23, 24] as const
const DEPTH_GUIDE_TRAVEL_RATIO = 0.4
const HAND_TARGET_MIN_Y = 0.75
const HAND_TOO_LOW_Y = 0.96
const HEAD_LANDMARKS = [0, 2, 5, 7, 8] as const
const HEAD_TARGET_MAX_Y = 0.25
const HEAD_TOO_HIGH_Y = 0.04
const LEGACY_FRONT_BODY_ANGLE = 180

function angle(
  pointA: PoseLandmark,
  vertex: PoseLandmark,
  pointC: PoseLandmark
) {
  const first = { x: pointA.x - vertex.x, y: pointA.y - vertex.y }
  const second = { x: pointC.x - vertex.x, y: pointC.y - vertex.y }
  const denominator =
    Math.hypot(first.x, first.y) * Math.hypot(second.x, second.y)

  if (denominator === 0) {
    return 0
  }

  const cosine = Math.min(
    1,
    Math.max(-1, (first.x * second.x + first.y * second.y) / denominator)
  )

  return (Math.acos(cosine) * 180) / Math.PI
}

export function getPoseMetrics(
  landmarks: readonly PoseLandmark[]
): PoseMetrics | null {
  const leftShoulder = landmarks[11]
  const rightShoulder = landmarks[12]

  if (!leftShoulder || !rightShoulder) {
    return null
  }

  const visibleArms = ARM_LANDMARKS.map((indices) => {
    const points = {
      elbow: landmarks[indices.elbow],
      shoulder: landmarks[indices.shoulder],
      wrist: landmarks[indices.wrist],
    }

    if (Object.values(points).some((point) => point === undefined)) {
      return null
    }

    return {
      confidence: Math.min(
        points.elbow.visibility,
        points.shoulder.visibility,
        points.wrist.visibility
      ),
      points,
    }
  }).filter((arm) => arm !== null)
  // oxlint-disable-next-line unicorn/no-array-sort -- Hermes does not support toSorted.
  const arm = visibleArms.sort((first, second) => {
    return second.confidence - first.confidence
  })[0]

  if (!arm) {
    return null
  }

  const confidence = Math.min(
    arm.confidence,
    leftShoulder.visibility,
    rightShoulder.visibility
  )
  const shouldersAreVisibleFromFront =
    Math.abs(leftShoulder.x - rightShoulder.x) > 0.06
  const handIsBelowShoulders =
    arm.points.wrist.y > (leftShoulder.y + rightShoulder.y) / 2 - 0.08

  if (
    confidence < PUSHUP_THRESHOLDS.visibility ||
    !shouldersAreVisibleFromFront ||
    !handIsBelowShoulders
  ) {
    return null
  }

  return {
    confidence,
    elbowAngle: angle(arm.points.shoulder, arm.points.elbow, arm.points.wrist),
    shoulderY: (leftShoulder.y + rightShoulder.y) / 2,
  }
}

export function getDepthGuideY(
  landmarks: readonly PoseLandmark[]
): number | null {
  const guidePositions = ARM_LANDMARKS.flatMap((indices) => {
    const shoulder = landmarks[indices.shoulder]
    const wrist = landmarks[indices.wrist]

    if (
      !shoulder ||
      !wrist ||
      Math.min(shoulder.visibility, wrist.visibility) <
        PUSHUP_THRESHOLDS.visibility ||
      wrist.y <= shoulder.y
    ) {
      return []
    }

    return [shoulder.y + (wrist.y - shoulder.y) * DEPTH_GUIDE_TRAVEL_RATIO]
  })

  return guidePositions.length === 0
    ? null
    : guidePositions.reduce((total, position) => total + position, 0) /
        guidePositions.length
}

export function isDepthReached(
  landmarks: readonly PoseLandmark[],
  depthGuideY: number | null
) {
  if (depthGuideY === null) {
    return false
  }

  const shoulderPositions = [11, 12].flatMap((index) => {
    const shoulder = landmarks[index]
    return shoulder && shoulder.visibility >= PUSHUP_THRESHOLDS.visibility
      ? [shoulder.y]
      : []
  })

  return (
    shoulderPositions.length > 0 &&
    shoulderPositions.reduce((total, position) => total + position, 0) /
      shoulderPositions.length >=
      depthGuideY - PUSHUP_THRESHOLDS.depthTolerance
  )
}

export function isReadyPosition(metrics: PoseMetrics | null) {
  return metrics !== null && metrics.elbowAngle >= PUSHUP_THRESHOLDS.top
}

function hasVisibleLandmark(landmarks: readonly PoseLandmark[], index: number) {
  return (landmarks[index]?.visibility ?? 0) >= PUSHUP_THRESHOLDS.visibility
}

function hasVisibleBody(landmarks: readonly PoseLandmark[]) {
  return BODY_LANDMARKS.some((index) => hasVisibleLandmark(landmarks, index))
}

function averageVisibleY(
  landmarks: readonly PoseLandmark[],
  indices: readonly number[]
) {
  const positions = indices.flatMap((index) =>
    hasVisibleLandmark(landmarks, index) ? [landmarks[index]?.y ?? 0] : []
  )

  return positions.length === 0
    ? null
    : positions.reduce((total, position) => total + position, 0) /
        positions.length
}

export function getSetupState(
  landmarks: readonly PoseLandmark[],
  metrics: PoseMetrics | null,
  ready: boolean
) {
  if (!hasVisibleBody(landmarks)) {
    return { hint: "Fit body in frame", valid: false }
  }

  const headY = averageVisibleY(landmarks, HEAD_LANDMARKS)
  const handsY = averageVisibleY(landmarks, [15, 16])

  if (headY === null || handsY === null) {
    return { hint: "Show head and hands", valid: false }
  }

  if (headY < HEAD_TOO_HIGH_Y || handsY > HAND_TOO_LOW_Y) {
    return { hint: "Move back a little", valid: false }
  }

  if (headY > HEAD_TARGET_MAX_Y && handsY < HAND_TARGET_MIN_Y) {
    return { hint: "Move closer to camera", valid: false }
  }

  if (headY > HEAD_TARGET_MAX_Y) {
    return { hint: "Raise phone toward head", valid: false }
  }

  if (handsY < HAND_TARGET_MIN_Y) {
    return { hint: "Lower phone toward hands", valid: false }
  }

  if (!metrics) {
    return { hint: "Face camera", valid: false }
  }

  return ready
    ? { hint: "Hold still", valid: true }
    : { hint: "Start from top position", valid: false }
}

export function createCounterState(): CounterState {
  return { activeAttempt: null, attempts: [], validReps: 0 }
}

export function recordTrackingLoss(
  state: CounterState,
  lastPoseAtOffsetMs: number,
  depthReached: boolean
): CounterState {
  if (!state.activeAttempt) {
    return state
  }

  return {
    ...state,
    activeAttempt: {
      ...state.activeAttempt,
      reachedBottom: state.activeAttempt.reachedBottom || depthReached,
      trackingLostAtOffsetMs:
        state.activeAttempt.trackingLostAtOffsetMs ?? lastPoseAtOffsetMs,
    },
  }
}

function closeTrackingGap(attempt: ActiveAttempt, elapsedMs: number) {
  if (attempt.trackingLostAtOffsetMs === null) {
    return attempt
  }

  return {
    ...attempt,
    maxTrackingGapMs: Math.max(
      attempt.maxTrackingGapMs,
      elapsedMs - attempt.trackingLostAtOffsetMs
    ),
    trackingLostAtOffsetMs: null,
  }
}

function canRecoverBottom(
  attempt: ActiveAttempt,
  metrics: PoseMetrics,
  elapsedMs: number
) {
  return (
    !attempt.reachedBottom &&
    attempt.maxTrackingGapMs > 0 &&
    attempt.maxTrackingGapMs <= PUSHUP_THRESHOLDS.recoveryMaxTrackingGapMs &&
    elapsedMs - attempt.startedAtOffsetMs >=
      PUSHUP_THRESHOLDS.recoveryMinAttemptMs &&
    attempt.minElbowAngle <= PUSHUP_THRESHOLDS.recoveryMaxElbowAngle &&
    metrics.elbowAngle >= PUSHUP_THRESHOLDS.top
  )
}

export function processPoseMetrics(
  state: CounterState,
  metrics: PoseMetrics,
  elapsedMs: number,
  depthReached: boolean,
  depthOffset: number | null = null
): { event: CounterEvent; state: CounterState } {
  if (!state.activeAttempt) {
    if (metrics.elbowAngle >= PUSHUP_THRESHOLDS.leaveTop) {
      return { event: { type: "none" }, state }
    }

    return {
      event: { type: "none" },
      state: {
        ...state,
        activeAttempt: {
          maxTrackingGapMs: 0,
          minElbowAngle: metrics.elbowAngle,
          reachedBottom: depthReached,
          startedAtOffsetMs: elapsedMs,
          trackingLostAtOffsetMs: null,
          ...startTrace(metrics.elbowAngle, depthOffset, elapsedMs),
        },
      },
    }
  }

  const gapClosed = closeTrackingGap(state.activeAttempt, elapsedMs)
  const trackedAttempt = {
    ...gapClosed,
    ...sampleTrace(gapClosed, metrics.elbowAngle, depthOffset, elapsedMs),
  }
  const observedAttempt = {
    ...trackedAttempt,
    minElbowAngle: Math.min(trackedAttempt.minElbowAngle, metrics.elbowAngle),
    reachedBottom: trackedAttempt.reachedBottom || depthReached,
  }
  const activeAttempt = {
    ...observedAttempt,
    reachedBottom:
      observedAttempt.reachedBottom ||
      canRecoverBottom(observedAttempt, metrics, elapsedMs),
  }

  if (metrics.elbowAngle < PUSHUP_THRESHOLDS.top) {
    return {
      event: { type: "none" },
      state: { ...state, activeAttempt },
    }
  }

  const failureReasons: FailureReason[] = []

  if (!activeAttempt.reachedBottom) {
    failureReasons.push(
      activeAttempt.maxTrackingGapMs > 0 &&
        activeAttempt.minElbowAngle <= PUSHUP_THRESHOLDS.recoveryMaxElbowAngle
        ? "tracking_lost"
        : "insufficient_depth"
    )
  }

  const attempt = {
    durationMs: Math.max(0, elapsedMs - activeAttempt.startedAtOffsetMs),
    failureReasons,
    minBodyAngle: LEGACY_FRONT_BODY_ANGLE,
    minElbowAngle: activeAttempt.minElbowAngle,
    startedAtOffsetMs: activeAttempt.startedAtOffsetMs,
    ...closeTrace(activeAttempt, metrics.elbowAngle, depthOffset, elapsedMs),
    valid: failureReasons.length === 0,
  } satisfies WorkoutAttempt

  return {
    event: { attempt, type: "attempt-completed" },
    state: {
      activeAttempt: null,
      attempts: [...state.attempts, attempt],
      validReps: state.validReps + (attempt.valid ? 1 : 0),
    },
  }
}

export function abandonActiveAttempt(state: CounterState): CounterState {
  return { ...state, activeAttempt: null }
}

export function finishActiveAttempt(
  state: CounterState,
  elapsedMs: number
): CounterState {
  if (!state.activeAttempt) {
    return state
  }

  const activeAttempt = closeTrackingGap(state.activeAttempt, elapsedMs)
  const failureReasons: FailureReason[] = activeAttempt.reachedBottom
    ? ["incomplete_lockout"]
    : [
        activeAttempt.maxTrackingGapMs > 0 &&
        activeAttempt.minElbowAngle <= PUSHUP_THRESHOLDS.recoveryMaxElbowAngle
          ? "tracking_lost"
          : "insufficient_depth",
      ]

  return {
    activeAttempt: null,
    attempts: [
      ...state.attempts,
      {
        durationMs: Math.max(0, elapsedMs - activeAttempt.startedAtOffsetMs),
        failureReasons,
        depthTrace: activeAttempt.depthTrace,
        minBodyAngle: LEGACY_FRONT_BODY_ANGLE,
        minElbowAngle: activeAttempt.minElbowAngle,
        startedAtOffsetMs: activeAttempt.startedAtOffsetMs,
        trace: activeAttempt.trace,
        valid: false,
      },
    ],
    validReps: state.validReps,
  }
}
