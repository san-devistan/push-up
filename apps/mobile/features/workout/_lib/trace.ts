export type PoseTrace = {
  depthTrace?: number[]
  trace: number[]
  tracedAtOffsetMs: number
}

// 80ms resolves the down/up shape of a ~2s rep; the cap keeps a rep that
// stalls at the bottom from growing the stored session without bound.
const TRACE_SAMPLE_INTERVAL_MS = 80
const TRACE_MAX_SAMPLES = 48

function appendSample(trace: readonly number[], value: number) {
  return trace.length >= TRACE_MAX_SAMPLES ? [...trace] : [...trace, value]
}

function roundDepth(depthOffset: number) {
  return Math.round(depthOffset * 1000) / 1000
}

export function connectTrace(
  values: readonly number[],
  previousEnd: number | undefined
) {
  const anchor = previousEnd ?? values.at(-1)

  return anchor === undefined ? [] : [anchor, ...values]
}

export function startTrace(
  elbowAngle: number,
  depthOffset: number | null,
  elapsedMs: number
): PoseTrace {
  return {
    ...(depthOffset === null ? {} : { depthTrace: [roundDepth(depthOffset)] }),
    trace: [Math.round(elbowAngle)],
    tracedAtOffsetMs: elapsedMs,
  }
}

export function sampleTrace(
  state: PoseTrace,
  elbowAngle: number,
  depthOffset: number | null,
  elapsedMs: number
): PoseTrace {
  return elapsedMs - state.tracedAtOffsetMs < TRACE_SAMPLE_INTERVAL_MS
    ? state
    : {
        depthTrace:
          state.depthTrace && depthOffset !== null
            ? appendSample(state.depthTrace, roundDepth(depthOffset))
            : undefined,
        trace: appendSample(state.trace, Math.round(elbowAngle)),
        tracedAtOffsetMs: elapsedMs,
      }
}

/** The closing frame is the lockout, so the curve ends where the rep did. */
export function closeTrace(
  state: PoseTrace,
  elbowAngle: number,
  depthOffset: number | null,
  elapsedMs: number
) {
  if (state.tracedAtOffsetMs === elapsedMs) {
    return { depthTrace: state.depthTrace, trace: state.trace }
  }

  return {
    depthTrace:
      state.depthTrace && depthOffset !== null
        ? appendSample(state.depthTrace, roundDepth(depthOffset))
        : undefined,
    trace: appendSample(state.trace, Math.round(elbowAngle)),
  }
}
