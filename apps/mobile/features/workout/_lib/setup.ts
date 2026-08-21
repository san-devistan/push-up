export type SetupFraming = "close" | "far" | "off-center" | "ready" | "unknown"

export type SetupHint =
  | "faceCamera"
  | "fitBody"
  | "holdStill"
  | "lowerPhone"
  | "moveBack"
  | "moveCloser"
  | "raisePhone"
  | "showHeadHands"
  | "startTop"
  | "tiltPhone"

export type SetupState = {
  framing: SetupFraming
  hint: SetupHint
  valid: boolean
}
