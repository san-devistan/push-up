export type TrainingHint = "bodyCamera" | "layPhoneFlat"

export function getActiveTrackingHint(
  phoneFlat: boolean,
  depthMeters: number | null,
  poseVerified: boolean
): TrainingHint | null {
  if (!phoneFlat) return "layPhoneFlat"
  if (!poseVerified || depthMeters === null) return "bodyCamera"

  return null
}
