import { type HybridObject, NitroModules } from "react-native-nitro-modules"
import type { Frame } from "react-native-vision-camera"

export type DetectedLandmark = {
  visibility: number
  x: number
  y: number
  z: number
}

interface PumprPoseDetector extends HybridObject<{
  android: "kotlin"
  ios: "swift"
}> {
  readonly error?: string
  readonly landmarks: DetectedLandmark[]
  processFrame(frame: Frame): void
  reset(): void
}

// ponytail: one workout camera exists at a time; add a factory only for concurrent streams.
export const poseDetector =
  NitroModules.createHybridObject<PumprPoseDetector>("PumprPoseDetector")
