import {
  closeTrace,
  sampleTrace,
  startTrace,
  type MotionTrace,
} from "./trace.ts"

export const COUNTER_THRESHOLDS = {
  bottomMeters: 0.3,
  topMaximumMeters: 0.7,
} as const

const DEPTH_GLOW_MINIMUM_METERS = 0.25
const DEPTH_GLOW_MAXIMUM_METERS = 0.35
const DEPTH_GLOW_LOG_STRENGTH = 9

export type FailureReason =
  | "incomplete_return"
  | "insufficient_depth"
  | "tracking_lost"

export type WorkoutAttempt = {
  depthTrace?: number[]
  depthTraceOffsetsMs?: number[]
  durationMs: number
  failureReasons: FailureReason[]
  startedAtOffsetMs: number
  valid: boolean
}

type TracedAttempt = MotionTrace & {
  startedAtOffsetMs: number
}

export type CounterState = {
  activeAttempt: TracedAttempt | null
  attempts: WorkoutAttempt[]
  topPosition: TracedAttempt | null
  validReps: number
}

export type CounterEvent =
  | { type: "none" }
  | { attempt: WorkoutAttempt; type: "attempt-completed" }

export function createCounterState(): CounterState {
  return {
    activeAttempt: null,
    attempts: [],
    topPosition: null,
    validReps: 0,
  }
}

export function getDepthGlowProgress(depthMeters: number) {
  const linearProgress = Math.max(
    0,
    Math.min(
      1,
      (DEPTH_GLOW_MAXIMUM_METERS - depthMeters) /
        (DEPTH_GLOW_MAXIMUM_METERS - DEPTH_GLOW_MINIMUM_METERS)
    )
  )

  return (
    Math.log1p(linearProgress * DEPTH_GLOW_LOG_STRENGTH) /
    Math.log1p(DEPTH_GLOW_LOG_STRENGTH)
  )
}

function isTopPosition(depthMeters: number, poseVerified: boolean) {
  return (
    poseVerified &&
    depthMeters >= COUNTER_THRESHOLDS.bottomMeters &&
    depthMeters <= COUNTER_THRESHOLDS.topMaximumMeters
  )
}

export function processDepthMeters(
  state: CounterState,
  depthMeters: number,
  elapsedMs: number,
  poseVerified: boolean
): { event: CounterEvent; state: CounterState } {
  const topPosition = isTopPosition(depthMeters, poseVerified)

  if (state.activeAttempt) {
    const activeAttempt = {
      ...state.activeAttempt,
      ...sampleTrace(state.activeAttempt, depthMeters, elapsedMs),
    }

    if (!topPosition) {
      return {
        event: { type: "none" },
        state: { ...state, activeAttempt },
      }
    }

    const trace = closeTrace(activeAttempt, depthMeters, elapsedMs)
    const attempt = {
      depthTrace: trace.depthTrace,
      depthTraceOffsetsMs: trace.depthTraceOffsetsMs,
      durationMs: Math.max(0, elapsedMs - activeAttempt.startedAtOffsetMs),
      failureReasons: [],
      startedAtOffsetMs: activeAttempt.startedAtOffsetMs,
      valid: true,
    } satisfies WorkoutAttempt

    return {
      event: { attempt, type: "attempt-completed" },
      state: {
        activeAttempt: null,
        attempts: [...state.attempts, attempt],
        topPosition: {
          ...startTrace(depthMeters, elapsedMs),
          startedAtOffsetMs: elapsedMs,
        },
        validReps: state.validReps + 1,
      },
    }
  }

  if (topPosition) {
    const trace = state.topPosition
      ? sampleTrace(state.topPosition, depthMeters, elapsedMs)
      : startTrace(depthMeters, elapsedMs)

    return {
      event: { type: "none" },
      state: {
        ...state,
        topPosition: {
          ...trace,
          startedAtOffsetMs: state.topPosition?.startedAtOffsetMs ?? elapsedMs,
        },
      },
    }
  }

  if (state.topPosition === null) return { event: { type: "none" }, state }

  const trace = sampleTrace(state.topPosition, depthMeters, elapsedMs)

  if (depthMeters >= COUNTER_THRESHOLDS.bottomMeters) {
    return {
      event: { type: "none" },
      state: { ...state, topPosition: { ...state.topPosition, ...trace } },
    }
  }

  return {
    event: { type: "none" },
    state: {
      ...state,
      activeAttempt: {
        ...state.topPosition,
        ...trace,
      },
      topPosition: null,
    },
  }
}

export function abandonActiveAttempt(state: CounterState): CounterState {
  return { ...state, activeAttempt: null, topPosition: null }
}

export function recordTrailingDepth(
  state: CounterState,
  depthMeters: number,
  elapsedMs: number
): CounterState {
  const attempt = state.attempts.at(-1)
  const depthTrace = attempt?.depthTrace
  const depthTraceOffsetsMs = attempt?.depthTraceOffsetsMs
  const tracedAtOffsetMs = depthTraceOffsetsMs?.at(-1)

  if (
    !attempt ||
    !depthTrace ||
    !depthTraceOffsetsMs ||
    tracedAtOffsetMs == null
  ) {
    return state
  }

  const trace = sampleTrace(
    { depthTrace, depthTraceOffsetsMs, tracedAtOffsetMs },
    depthMeters,
    elapsedMs
  )

  if (trace.tracedAtOffsetMs === tracedAtOffsetMs) return state

  return {
    ...state,
    attempts: [
      ...state.attempts.slice(0, -1),
      {
        ...attempt,
        depthTrace: trace.depthTrace,
        depthTraceOffsetsMs: trace.depthTraceOffsetsMs,
        durationMs: Math.max(
          attempt.durationMs,
          elapsedMs - attempt.startedAtOffsetMs
        ),
      },
    ],
  }
}

export function finishActiveAttempt(
  state: CounterState,
  elapsedMs: number
): CounterState {
  if (!state.activeAttempt) return state

  const attempt = {
    depthTrace: state.activeAttempt.depthTrace,
    depthTraceOffsetsMs: state.activeAttempt.depthTraceOffsetsMs,
    durationMs: Math.max(0, elapsedMs - state.activeAttempt.startedAtOffsetMs),
    failureReasons: ["incomplete_return"],
    startedAtOffsetMs: state.activeAttempt.startedAtOffsetMs,
    valid: false,
  } satisfies WorkoutAttempt

  return {
    activeAttempt: null,
    attempts: [...state.attempts, attempt],
    topPosition: null,
    validReps: state.validReps,
  }
}
