export const PUSHUP_THRESHOLDS = {
  leaveTop: 150,
  top: 160,
  visibility: 0.1,
} as const

export type FailureReason =
  | "body_misalignment"
  | "incomplete_lockout"
  | "insufficient_depth"

export type PoseLandmark = {
  x: number
  y: number
  visibility: number
}

export type PoseMetrics = {
  confidence: number
  elbowAngle: number
}

export type WorkoutAttempt = {
  durationMs: number
  failureReasons: FailureReason[]
  minBodyAngle: number
  minElbowAngle: number
  startedAtOffsetMs: number
  valid: boolean
}

type ActiveAttempt = {
  minElbowAngle: number
  reachedBottom: boolean
  startedAtOffsetMs: number
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

const DEPTH_GUIDE_TRAVEL_RATIO = 0.4
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
  const arm = visibleArms.toSorted((first, second) => {
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
  const shouldersAreFrontFacing =
    Math.abs(leftShoulder.x - rightShoulder.x) > 0.06
  const handIsBelowShoulders =
    arm.points.wrist.y > (leftShoulder.y + rightShoulder.y) / 2 - 0.08

  if (
    confidence < PUSHUP_THRESHOLDS.visibility ||
    !shouldersAreFrontFacing ||
    !handIsBelowShoulders
  ) {
    return null
  }

  return {
    confidence,
    elbowAngle: angle(arm.points.shoulder, arm.points.elbow, arm.points.wrist),
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
      depthGuideY
  )
}

export function isReadyPosition(metrics: PoseMetrics | null) {
  return metrics !== null && metrics.elbowAngle >= PUSHUP_THRESHOLDS.top
}

export function createCounterState(): CounterState {
  return { activeAttempt: null, attempts: [], validReps: 0 }
}

export function processPoseMetrics(
  state: CounterState,
  metrics: PoseMetrics,
  elapsedMs: number,
  depthReached: boolean
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
          minElbowAngle: metrics.elbowAngle,
          reachedBottom: depthReached,
          startedAtOffsetMs: elapsedMs,
        },
      },
    }
  }

  const activeAttempt = {
    ...state.activeAttempt,
    minElbowAngle: Math.min(
      state.activeAttempt.minElbowAngle,
      metrics.elbowAngle
    ),
    reachedBottom: state.activeAttempt.reachedBottom || depthReached,
  }

  if (metrics.elbowAngle < PUSHUP_THRESHOLDS.top) {
    return {
      event: { type: "none" },
      state: { ...state, activeAttempt },
    }
  }

  const failureReasons: FailureReason[] = []

  if (!activeAttempt.reachedBottom) {
    failureReasons.push("insufficient_depth")
  }

  const attempt = {
    durationMs: Math.max(0, elapsedMs - activeAttempt.startedAtOffsetMs),
    failureReasons,
    minBodyAngle: LEGACY_FRONT_BODY_ANGLE,
    minElbowAngle: activeAttempt.minElbowAngle,
    startedAtOffsetMs: activeAttempt.startedAtOffsetMs,
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

  const failureReasons: FailureReason[] = state.activeAttempt.reachedBottom
    ? ["incomplete_lockout"]
    : ["insufficient_depth"]

  return {
    activeAttempt: null,
    attempts: [
      ...state.attempts,
      {
        durationMs: Math.max(
          0,
          elapsedMs - state.activeAttempt.startedAtOffsetMs
        ),
        failureReasons,
        minBodyAngle: LEGACY_FRONT_BODY_ANGLE,
        minElbowAngle: state.activeAttempt.minElbowAngle,
        startedAtOffsetMs: state.activeAttempt.startedAtOffsetMs,
        valid: false,
      },
    ],
    validReps: state.validReps,
  }
}
