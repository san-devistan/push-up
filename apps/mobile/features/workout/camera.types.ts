import type { BodyLandmark } from "@/features/tracking/body/types"

export type DepthObservation = {
  accuracy: "absolute" | "relative" | "unknown"
  distanceMeters: number
  quality: "high" | "low" | "unknown"
}

export type TrackingObservation = {
  depth: DepthObservation | null
  landmarks: readonly BodyLandmark[]
}

export type TrackingCameraProps = {
  isActive: boolean
  onError: (message: string) => void
  onObservation: (observation: TrackingObservation) => void
  showPreview?: boolean
}
