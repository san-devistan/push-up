const TRACE_SAMPLE_INTERVAL_MS = 80

export type MotionTrace = {
  depthTrace: number[]
  depthTraceOffsetsMs: number[]
  tracedAtOffsetMs: number
}

function appendSample(
  state: MotionTrace,
  depthMeters: number,
  elapsedMs: number
): MotionTrace {
  return {
    depthTrace: [...state.depthTrace, depthMeters],
    depthTraceOffsetsMs: [...state.depthTraceOffsetsMs, elapsedMs],
    tracedAtOffsetMs: elapsedMs,
  }
}

export function startTrace(
  depthMeters: number,
  elapsedMs: number
): MotionTrace {
  return {
    depthTrace: [depthMeters],
    depthTraceOffsetsMs: [elapsedMs],
    tracedAtOffsetMs: elapsedMs,
  }
}

export function sampleTrace(
  state: MotionTrace,
  depthMeters: number,
  elapsedMs: number
): MotionTrace {
  return elapsedMs - state.tracedAtOffsetMs < TRACE_SAMPLE_INTERVAL_MS
    ? state
    : appendSample(state, depthMeters, elapsedMs)
}

export function closeTrace(
  state: MotionTrace,
  depthMeters: number,
  elapsedMs: number
) {
  return state.tracedAtOffsetMs === elapsedMs
    ? state
    : appendSample(state, depthMeters, elapsedMs)
}
