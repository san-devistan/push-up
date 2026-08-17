import type {
  CounterState,
  PoseLandmark,
  PoseMetrics,
  WorkoutAttempt,
} from "@/features/workout/_lib/counter"

const SESSION_DEBUG_INTERVAL_MS = 200
export const MAX_SESSION_DEBUG_FRAMES = 900
const DEBUG_HEAD_LANDMARKS = [0, 2, 5, 7, 8] as const
const DEBUG_HAND_LANDMARKS = [15, 16] as const
const DEBUG_SHOULDER_LANDMARKS = [11, 12] as const
type DebugSessionPhase = "active" | "countdown" | "positioning"

export type SessionDebugFrame = {
  counter: {
    active: boolean
    attempts: number
    maxTrackingGapMs: number
    minElbowAngle: number | null
    reachedBottom: boolean
    validReps: number
  }
  depth: {
    deltaY: number | null
    guideY: number | null
    reached: boolean
    shoulderY: number | null
  }
  elapsedMs: number
  metrics: {
    confidence: number
    elbowAngle: number
  } | null
  pose: {
    bestArmConfidence: number | null
    handsY: number | null
    headY: number | null
    leftShoulderVisibility: number | null
    rightShoulderVisibility: number | null
    shoulderGap: number | null
    shoulderY: number | null
    wristY: number | null
  }
  ready: boolean
  setupHint: string
  trackingGapMs: number
}

function roundDebugValue(value: number | null) {
  return value === null ? null : Math.round(value * 1000) / 1000
}

function roundDebugNumber(value: number) {
  return Math.round(value * 1000) / 1000
}

function visibleY(landmarks: readonly PoseLandmark[], index: number) {
  const landmark = landmarks[index]
  return landmark && landmark.visibility >= 0.1 ? landmark.y : null
}

function averageVisibleY(
  landmarks: readonly PoseLandmark[],
  indices: readonly number[]
) {
  const positions = indices.flatMap((index) => {
    const y = visibleY(landmarks, index)
    return y === null ? [] : [y]
  })

  return positions.length === 0
    ? null
    : positions.reduce((total, y) => total + y, 0) / positions.length
}

function getArmConfidence(
  landmarks: readonly PoseLandmark[],
  shoulderIndex: number,
  elbowIndex: number,
  wristIndex: number
) {
  const shoulder = landmarks[shoulderIndex]
  const elbow = landmarks[elbowIndex]
  const wrist = landmarks[wristIndex]

  return shoulder && elbow && wrist
    ? Math.min(shoulder.visibility, elbow.visibility, wrist.visibility)
    : null
}

function getShoulderGap(
  leftShoulder: PoseLandmark | undefined,
  rightShoulder: PoseLandmark | undefined
) {
  return leftShoulder && rightShoulder
    ? Math.abs(leftShoulder.x - rightShoulder.x)
    : null
}

function getPoseDebug(landmarks: readonly PoseLandmark[]) {
  const leftShoulder = landmarks[11]
  const rightShoulder = landmarks[12]
  const shoulderGap = getShoulderGap(leftShoulder, rightShoulder)
  const shoulderY = averageVisibleY(landmarks, DEBUG_SHOULDER_LANDMARKS)
  const leftWristY = visibleY(landmarks, 15)
  const rightWristY = visibleY(landmarks, 16)
  const wristY = Math.max(leftWristY ?? -1, rightWristY ?? -1)
  const bestArmConfidence = Math.max(
    getArmConfidence(landmarks, 11, 13, 15) ?? -1,
    getArmConfidence(landmarks, 12, 14, 16) ?? -1
  )

  return {
    bestArmConfidence:
      bestArmConfidence < 0 ? null : roundDebugValue(bestArmConfidence),
    handsY: roundDebugValue(averageVisibleY(landmarks, DEBUG_HAND_LANDMARKS)),
    headY: roundDebugValue(averageVisibleY(landmarks, DEBUG_HEAD_LANDMARKS)),
    leftShoulderVisibility: roundDebugValue(leftShoulder?.visibility ?? null),
    rightShoulderVisibility: roundDebugValue(rightShoulder?.visibility ?? null),
    shoulderGap: roundDebugValue(shoulderGap),
    shoulderY: roundDebugValue(shoulderY),
    wristY: wristY < 0 ? null : roundDebugValue(wristY),
  }
}

function logSessionDebug(
  event: "attempt" | "frame",
  payload: Record<string, unknown>
) {
  if (typeof __DEV__ === "undefined" || !__DEV__) {
    return
  }

  // ponytail: temporary dev telemetry; remove after counter calibration.
  console.info(`[pushup:${event}]`, payload)
}

function getMaxTrackingGapMs(counterState: CounterState) {
  return counterState.activeAttempt?.maxTrackingGapMs ?? 0
}

export function logSessionAttempt({
  attempt,
  validReps,
}: {
  attempt: WorkoutAttempt
  validReps: number
}) {
  logSessionDebug("attempt", {
    durationMs: Math.round(attempt.durationMs),
    failureReasons: attempt.failureReasons,
    minElbowAngle: roundDebugValue(attempt.minElbowAngle),
    valid: attempt.valid,
    validReps,
  })
}

export function logSessionFrame({
  counterState,
  depthGuideY,
  depthReached,
  landmarks,
  lastLoggedAt,
  metrics,
  now,
  phase,
  ready,
  sessionStartedAt,
  setupHint,
  trackingGapMs,
}: {
  counterState: CounterState
  depthGuideY: number | null
  depthReached: boolean
  landmarks: readonly PoseLandmark[]
  lastLoggedAt: number
  metrics: PoseMetrics | null
  now: number
  phase: DebugSessionPhase
  ready: boolean
  sessionStartedAt: number
  setupHint: string
  trackingGapMs: number
}) {
  if (
    typeof __DEV__ === "undefined" ||
    !__DEV__ ||
    now - lastLoggedAt < SESSION_DEBUG_INTERVAL_MS
  ) {
    return { frame: null, lastLoggedAt }
  }

  const activeAttempt = counterState.activeAttempt
  const pose = getPoseDebug(landmarks)
  const frame = {
    counter: {
      active: activeAttempt !== null,
      attempts: counterState.attempts.length,
      maxTrackingGapMs: getMaxTrackingGapMs(counterState),
      minElbowAngle: activeAttempt
        ? roundDebugValue(activeAttempt.minElbowAngle)
        : null,
      reachedBottom: activeAttempt?.reachedBottom ?? false,
      validReps: counterState.validReps,
    },
    depth: {
      deltaY:
        depthGuideY === null || pose.shoulderY === null
          ? null
          : roundDebugValue(pose.shoulderY - depthGuideY),
      guideY: roundDebugValue(depthGuideY),
      reached: depthReached,
      shoulderY: pose.shoulderY,
    },
    elapsedMs: Math.max(0, now - sessionStartedAt),
    metrics: metrics
      ? {
          confidence: roundDebugNumber(metrics.confidence),
          elbowAngle: roundDebugNumber(metrics.elbowAngle),
        }
      : null,
    pose,
    ready,
    setupHint,
    trackingGapMs: Math.max(0, trackingGapMs),
  } satisfies SessionDebugFrame

  logSessionDebug("frame", { ...frame, phase })

  return {
    frame: phase === "active" ? frame : null,
    lastLoggedAt: now,
  }
}

export function appendSessionDebugFrame(
  frames: SessionDebugFrame[],
  frame: SessionDebugFrame
) {
  // ponytail: retain the latest three minutes; raise the cap for longer repros.
  if (frames.length >= MAX_SESSION_DEBUG_FRAMES) {
    frames.shift()
  }
  frames.push(frame)
}

export function serializeSessionDebugFrames(
  frames: readonly SessionDebugFrame[]
) {
  return frames.length === 0 ? null : JSON.stringify(frames)
}
