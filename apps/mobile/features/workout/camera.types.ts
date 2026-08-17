import type { PoseLandmark } from "@/features/workout/_lib/counter"

export type PoseCameraProps = {
  isActive: boolean
  onError: (message: string) => void
  onLandmarks: (landmarks: readonly PoseLandmark[]) => void
  showDepthGuide?: boolean
  showSetupGuides?: boolean
}
