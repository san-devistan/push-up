import type { BodyLandmark } from "@/features/tracking/body/types"
import type { TrackingObservation } from "@/features/workout/camera.types"

import { getActiveTrackingHint, type TrainingHint } from "./setup.ts"

export const BODY_VISIBILITY_THRESHOLD = 0.15
export const TRACKING_LOSS_GRACE_MS = 1500

export type TrackingSignals = {
  depthMeters: number | null
  poseVerified: boolean
}

export type TrackingScales = {
  distanceMeters: number | null
  ears: number | null
  eyes: number | null
  hips: number | null
  mouth: number | null
  shoulders: number | null
}

export type TrackingIssueState = {
  hint: TrainingHint | null
  sinceMs: number
}

export type ActiveTrackingStatus =
  | { issueState: TrackingIssueState; type: "tracked" }
  | {
      elapsedMs: number
      hint: TrainingHint | null
      issueState: TrackingIssueState
      type: "issue"
    }

export function createTrackingIssueState(now = 0): TrackingIssueState {
  return { hint: null, sinceMs: now }
}

export function getActiveTrackingStatus(
  previous: TrackingIssueState,
  phoneFlat: boolean,
  signals: TrackingSignals,
  now: number
): ActiveTrackingStatus {
  const issue = getActiveTrackingHint(
    phoneFlat,
    signals.depthMeters,
    signals.poseVerified
  )

  if (issue === null) {
    return {
      issueState: createTrackingIssueState(now),
      type: "tracked",
    }
  }

  const issueState =
    previous.hint === issue ? previous : { hint: issue, sinceMs: now }
  const elapsedMs = now - issueState.sinceMs

  return {
    elapsedMs,
    hint: elapsedMs > TRACKING_LOSS_GRACE_MS ? issue : null,
    issueState,
    type: "issue",
  }
}

function getSegmentScale(
  landmarks: readonly BodyLandmark[],
  firstIndex: number,
  secondIndex: number
) {
  const first = landmarks[firstIndex]
  const second = landmarks[secondIndex]

  if (
    !first ||
    !second ||
    first.visibility < BODY_VISIBILITY_THRESHOLD ||
    second.visibility < BODY_VISIBILITY_THRESHOLD
  ) {
    return null
  }

  const scale = Math.hypot(first.x - second.x, first.y - second.y)
  return Number.isFinite(scale) && scale > 0 ? scale : null
}

export function getTrackingScales({
  depth,
  landmarks,
}: TrackingObservation): TrackingScales {
  return {
    distanceMeters: depth?.distanceMeters ?? null,
    ears: getSegmentScale(landmarks, 7, 8),
    eyes: getSegmentScale(landmarks, 3, 6),
    hips: getSegmentScale(landmarks, 23, 24),
    mouth: getSegmentScale(landmarks, 9, 10),
    shoulders: getSegmentScale(landmarks, 11, 12),
  }
}

export function hasPoseTracking(scales: TrackingScales) {
  return (
    scales.shoulders !== null ||
    scales.eyes !== null ||
    scales.ears !== null ||
    scales.mouth !== null
  )
}

export function getTrackingFrame(observation: TrackingObservation) {
  const scales = getTrackingScales(observation)
  const signals = {
    depthMeters: scales.distanceMeters,
    poseVerified: hasPoseTracking(scales),
  } satisfies TrackingSignals

  return { scales, signals }
}
