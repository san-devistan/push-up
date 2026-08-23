const TRACE_MAX_SAMPLES = 48
const TRACE_SAMPLE_INTERVAL_MS = 80

export type MotionTrace = {
  depthTrace: number[]
  tracedAtOffsetMs: number
}

function appendSample(trace: readonly number[], value: number) {
  return trace.length >= TRACE_MAX_SAMPLES ? [...trace] : [...trace, value]
}

function roundDepth(value: number) {
  return Math.round(value * 100) / 100
}

export function startTrace(
  depthOffset: number,
  elapsedMs: number
): MotionTrace {
  return {
    depthTrace: [roundDepth(depthOffset)],
    tracedAtOffsetMs: elapsedMs,
  }
}

export function sampleTrace(
  state: MotionTrace,
  depthOffset: number,
  elapsedMs: number
): MotionTrace {
  return elapsedMs - state.tracedAtOffsetMs < TRACE_SAMPLE_INTERVAL_MS
    ? state
    : {
        depthTrace: appendSample(state.depthTrace, roundDepth(depthOffset)),
        tracedAtOffsetMs: elapsedMs,
      }
}

export function closeTrace(
  state: MotionTrace,
  depthOffset: number,
  elapsedMs: number
) {
  return state.tracedAtOffsetMs === elapsedMs
    ? state.depthTrace
    : appendSample(state.depthTrace, roundDepth(depthOffset))
}

export function connectTrace(values: readonly number[], previous?: number) {
  return previous === undefined || values[0] === previous
    ? [...values]
    : [previous, ...values]
}
