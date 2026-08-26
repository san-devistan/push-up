import {
  closeTrace,
  sampleTrace,
  startTrace,
  type MotionTrace,
} from "./trace.ts"

export const COUNTER_THRESHOLDS = {
  bottom: 1.35,
  leaveTop: 1.12,
  recoveryMaxTrackingGapMs: 750,
  returnTop: 1.08,
} as const

export type FailureReason =
  | "incomplete_return"
  | "insufficient_depth"
  | "tracking_lost"

export type WorkoutAttempt = {
  depthTrace?: number[]
  durationMs: number
  failureReasons: FailureReason[]
  startedAtOffsetMs: number
  valid: boolean
}

type ActiveAttempt = MotionTrace & {
  maxTrackingGapMs: number
  poseVerified: boolean
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

export function createCounterState(): CounterState {
  return { activeAttempt: null, attempts: [], validReps: 0 }
}

export function getPushupDepthProgress(depthRatio: number) {
  const progress =
    (depthRatio - COUNTER_THRESHOLDS.returnTop) /
    (COUNTER_THRESHOLDS.bottom - COUNTER_THRESHOLDS.returnTop)

  return Math.max(0, Math.min(1, progress))
}

export function recordTrackingLoss(
  state: CounterState,
  lastTrackingAtOffsetMs: number
): CounterState {
  if (!state.activeAttempt) return state

  return {
    ...state,
    activeAttempt: {
      ...state.activeAttempt,
      trackingLostAtOffsetMs:
        state.activeAttempt.trackingLostAtOffsetMs ?? lastTrackingAtOffsetMs,
    },
  }
}

function closeTrackingGap(attempt: ActiveAttempt, elapsedMs: number) {
  if (attempt.trackingLostAtOffsetMs === null) return attempt

  return {
    ...attempt,
    maxTrackingGapMs: Math.max(
      attempt.maxTrackingGapMs,
      elapsedMs - attempt.trackingLostAtOffsetMs
    ),
    trackingLostAtOffsetMs: null,
  }
}

function createFailureReasons(attempt: ActiveAttempt): FailureReason[] {
  const reasons: FailureReason[] = []

  if (!attempt.reachedBottom) {
    reasons.push("insufficient_depth")
  }

  if (
    !attempt.poseVerified ||
    attempt.maxTrackingGapMs > COUNTER_THRESHOLDS.recoveryMaxTrackingGapMs
  ) {
    reasons.push("tracking_lost")
  }

  return reasons
}

export function processDepthRatio(
  state: CounterState,
  depthRatio: number,
  elapsedMs: number,
  poseVerified: boolean
): { event: CounterEvent; state: CounterState } {
  const depthOffset = depthRatio - COUNTER_THRESHOLDS.bottom

  if (!state.activeAttempt) {
    if (depthRatio < COUNTER_THRESHOLDS.leaveTop) {
      return { event: { type: "none" }, state }
    }

    return {
      event: { type: "none" },
      state: {
        ...state,
        activeAttempt: {
          maxTrackingGapMs: 0,
          poseVerified,
          reachedBottom: depthRatio >= COUNTER_THRESHOLDS.bottom,
          startedAtOffsetMs: elapsedMs,
          trackingLostAtOffsetMs: null,
          ...startTrace(depthOffset, elapsedMs),
        },
      },
    }
  }

  const gapClosed = closeTrackingGap(state.activeAttempt, elapsedMs)
  const traced = {
    ...gapClosed,
    ...sampleTrace(gapClosed, depthOffset, elapsedMs),
  }
  const activeAttempt = {
    ...traced,
    poseVerified: traced.poseVerified || poseVerified,
    reachedBottom:
      traced.reachedBottom || depthRatio >= COUNTER_THRESHOLDS.bottom,
  }

  if (depthRatio > COUNTER_THRESHOLDS.returnTop) {
    return {
      event: { type: "none" },
      state: { ...state, activeAttempt },
    }
  }

  const durationMs = Math.max(0, elapsedMs - activeAttempt.startedAtOffsetMs)
  const failureReasons = createFailureReasons(activeAttempt)
  const attempt = {
    depthTrace: closeTrace(activeAttempt, depthOffset, elapsedMs),
    durationMs,
    failureReasons,
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
  if (!state.activeAttempt) return state

  const activeAttempt = closeTrackingGap(state.activeAttempt, elapsedMs)
  const failureReasons: FailureReason[] = [
    activeAttempt.reachedBottom ? "incomplete_return" : "insufficient_depth",
  ]

  if (
    !activeAttempt.poseVerified ||
    activeAttempt.maxTrackingGapMs > COUNTER_THRESHOLDS.recoveryMaxTrackingGapMs
  ) {
    failureReasons.push("tracking_lost")
  }

  return {
    activeAttempt: null,
    attempts: [
      ...state.attempts,
      {
        depthTrace: activeAttempt.depthTrace,
        durationMs: Math.max(0, elapsedMs - activeAttempt.startedAtOffsetMs),
        failureReasons,
        startedAtOffsetMs: activeAttempt.startedAtOffsetMs,
        valid: false,
      },
    ],
    validReps: state.validReps,
  }
}
