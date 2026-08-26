export type SetupFraming = "ready" | "unknown"

export type SetupHint = "bodyCamera" | "layPhoneFlat" | "startTop"
export type TrainingHint = Exclude<SetupHint, "startTop">

type TrainingSignals = {
  depth: number | null
  poseVerified: boolean
}

export type SetupState = {
  framing: SetupFraming
  hint: SetupHint
  valid: boolean
}

export function getTrackingSetupState(trackingAvailable: boolean): SetupState {
  return trackingAvailable
    ? { framing: "ready", hint: "startTop", valid: true }
    : { framing: "unknown", hint: "bodyCamera", valid: false }
}

export function getActiveTrackingHint(
  phoneFlat: boolean,
  signals: TrainingSignals | null
): TrainingHint | null {
  if (!phoneFlat) return "layPhoneFlat"

  if (signals === null || signals.depth === null || !signals.poseVerified) {
    return "bodyCamera"
  }

  return null
}
