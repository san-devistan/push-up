import type { FaceObservation } from "@/features/workout/camera.types"

const FACE_SCALE_RANGE = { maximum: 0.6, minimum: 0.16 } as const
const MAX_HEAD_TURN_DEGREES = 35

export type SetupFraming = "close" | "far" | "off-center" | "ready" | "unknown"

export type SetupHint =
  | "centerFace"
  | "faceCamera"
  | "layPhoneFlat"
  | "moveBack"
  | "moveCloser"
  | "startTop"

export type SetupState = {
  framing: SetupFraming
  hint: SetupHint
  valid: boolean
}

export function getFaceScale(face: FaceObservation | null) {
  if (
    !face ||
    face.frameHeight <= 0 ||
    face.frameWidth <= 0 ||
    face.height <= 0 ||
    face.width <= 0
  ) {
    return null
  }

  return Math.sqrt(
    (face.height * face.width) / (face.frameHeight * face.frameWidth)
  )
}

export function getFaceSetupState(
  face: FaceObservation | null,
  scale: number | null
): SetupState {
  if (!face || scale === null) {
    return { framing: "unknown", hint: "faceCamera", valid: false }
  }

  if (
    Math.abs(face.rollAngle) > MAX_HEAD_TURN_DEGREES ||
    Math.abs(face.yawAngle) > MAX_HEAD_TURN_DEGREES
  ) {
    return { framing: "off-center", hint: "centerFace", valid: false }
  }

  if (scale < FACE_SCALE_RANGE.minimum) {
    return { framing: "far", hint: "moveCloser", valid: false }
  }

  if (scale > FACE_SCALE_RANGE.maximum) {
    return { framing: "close", hint: "moveBack", valid: false }
  }

  return { framing: "ready", hint: "startTop", valid: true }
}
