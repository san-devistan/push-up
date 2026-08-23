import { type HybridObject, NitroModules } from "react-native-nitro-modules"
import type { Frame } from "react-native-vision-camera"

export type DetectedFace = {
  frameHeight: number
  frameWidth: number
  height: number
  rollAngle: number
  width: number
  yawAngle: number
}

interface AppleFaceDetector extends HybridObject<{ ios: "swift" }> {
  readonly error?: string
  readonly face?: DetectedFace
  processFrame(frame: Frame): void
  reset(): void
}

// ponytail: one workout camera exists at a time; add a factory only for concurrent streams.
export const appleFaceDetector =
  NitroModules.createHybridObject<AppleFaceDetector>("AppleFaceDetector")
