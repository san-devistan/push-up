import type { BodyLandmark } from "@/features/tracking/body/types"
import type { TrackingObservation } from "@/features/workout/camera.types"

import { requireFlatPhone } from "./inclination.ts"
import {
  getActiveTrackingHint,
  getTrackingSetupState,
  type SetupHint,
  type TrainingHint,
} from "./setup.ts"

export const BODY_VISIBILITY_THRESHOLD = 0.15
const DEPTH_RATIO_RANGE = { maximum: 5, minimum: 0.7 } as const
const MAXIMUM_DEPTH_RATIO_JUMP = 1.25
const MINIMUM_CALIBRATION_SAMPLES = 3
export const TRACKING_CALIBRATION_DURATION_MS = 1000
export const TRACKING_LOSS_GRACE_MS = 1500

export function getTrackingHintAfterGrace<Hint extends SetupHint>(
  hint: Hint | null,
  trackingLostMs: number
): Hint | null {
  return trackingLostMs > TRACKING_LOSS_GRACE_MS ? hint : null
}

type ScaleSample = { count: number; total: number }

export type TrackingScales = {
  distanceMeters: number | null
  ears: number | null
  eyes: number | null
  hips: number | null
  mouth: number | null
  shoulders: number | null
}

export type TrackingCalibration = {
  distanceMeters: ScaleSample
  ears: ScaleSample
  eyes: ScaleSample
  hips: ScaleSample
  mouth: ScaleSample
  shoulders: ScaleSample
}

export type TrackingRatios = {
  depth: number | null
  face: number | null
  poseVerified: boolean
  signalCount: number
  source: "depth" | "depth+pose" | "none"
  torso: number | null
}

type TrackingSignalSeenAt = { body: number; depth: number }

export type ActiveTrackingStatus =
  | {
      depthRatio: number | null
      elapsedMs: number
      hint: TrainingHint | null
      signalSeenAt: TrackingSignalSeenAt
      type: "issue"
    }
  | {
      depthRatio: number
      signalSeenAt: TrackingSignalSeenAt
      type: "tracked"
    }

export function getActiveTrackingStatus(
  lastSeen: TrackingSignalSeenAt,
  lastTrackingAt: number,
  phoneFlat: boolean,
  ratios: TrackingRatios | null,
  now: number
): ActiveTrackingStatus {
  const depthRatio = ratios?.depth ?? null
  const signalSeenAt = {
    body: ratios?.poseVerified ? now : lastSeen.body,
    depth: depthRatio === null ? lastSeen.depth : now,
  }
  const issue = getActiveTrackingHint(phoneFlat, ratios)

  if (issue === null && depthRatio !== null) {
    return { depthRatio, signalSeenAt, type: "tracked" }
  }

  const elapsedMs =
    issue === "bodyCamera"
      ? now - Math.min(signalSeenAt.body, signalSeenAt.depth)
      : now - lastTrackingAt

  return {
    depthRatio,
    elapsedMs,
    hint: getTrackingHintAfterGrace(issue, elapsedMs),
    signalSeenAt,
    type: "issue",
  }
}

export function createTrackingCalibration(): TrackingCalibration {
  return {
    distanceMeters: { count: 0, total: 0 },
    ears: { count: 0, total: 0 },
    eyes: { count: 0, total: 0 },
    hips: { count: 0, total: 0 },
    mouth: { count: 0, total: 0 },
    shoulders: { count: 0, total: 0 },
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

function sampleScale(sample: ScaleSample, value: number | null): ScaleSample {
  return value === null
    ? sample
    : { count: sample.count + 1, total: sample.total + value }
}

export function sampleTrackingCalibration(
  calibration: TrackingCalibration,
  scales: TrackingScales
): TrackingCalibration {
  return {
    distanceMeters: sampleScale(
      calibration.distanceMeters,
      scales.distanceMeters
    ),
    ears: sampleScale(calibration.ears, scales.ears),
    eyes: sampleScale(calibration.eyes, scales.eyes),
    hips: sampleScale(calibration.hips, scales.hips),
    mouth: sampleScale(calibration.mouth, scales.mouth),
    shoulders: sampleScale(calibration.shoulders, scales.shoulders),
  }
}

function averageScale(sample: ScaleSample) {
  return sample.count >= MINIMUM_CALIBRATION_SAMPLES
    ? sample.total / sample.count
    : null
}

export function finishTrackingCalibration(
  calibration: TrackingCalibration
): TrackingScales | null {
  const scales = {
    distanceMeters: averageScale(calibration.distanceMeters),
    ears: averageScale(calibration.ears),
    eyes: averageScale(calibration.eyes),
    hips: averageScale(calibration.hips),
    mouth: averageScale(calibration.mouth),
    shoulders: averageScale(calibration.shoulders),
  }

  return scales.distanceMeters !== null && hasPoseTracking(scales)
    ? scales
    : null
}

function getScaleRatio(scale: number | null, topScale: number | null) {
  return scale === null || topScale === null || topScale <= 0
    ? null
    : scale / topScale
}

function getSensorDepthRatio(
  distanceMeters: number | null,
  topDistanceMeters: number | null
) {
  return distanceMeters === null ||
    distanceMeters <= 0 ||
    topDistanceMeters === null ||
    topDistanceMeters <= 0
    ? null
    : topDistanceMeters / distanceMeters
}

function median(values: number[]) {
  values.sort((left, right) => left - right)
  const middle = Math.floor(values.length / 2)

  return values.length % 2 === 0
    ? ((values[middle - 1] ?? 0) + (values[middle] ?? 0)) / 2
    : (values[middle] ?? 0)
}

export function getTrackingDepthRatio(
  scales: TrackingScales,
  topScales: TrackingScales,
  previousDepthRatio: number | null = null
) {
  return getTrackingRatios(scales, topScales, previousDepthRatio).depth
}

function isPlausibleDepthRatio(
  ratio: number | null,
  previousDepthRatio: number | null
) {
  return (
    ratio !== null &&
    ratio >= DEPTH_RATIO_RANGE.minimum &&
    ratio <= DEPTH_RATIO_RANGE.maximum &&
    (previousDepthRatio === null ||
      Math.abs(ratio - previousDepthRatio) <= MAXIMUM_DEPTH_RATIO_JUMP)
  )
}

export function getTrackingRatios(
  scales: TrackingScales,
  topScales: TrackingScales,
  previousDepthRatio: number | null = null
): TrackingRatios {
  const sensorDepth = getSensorDepthRatio(
    scales.distanceMeters,
    topScales.distanceMeters
  )
  const depth = isPlausibleDepthRatio(sensorDepth, previousDepthRatio)
    ? sensorDepth
    : null
  const faceValues = [
    getScaleRatio(scales.eyes, topScales.eyes),
    getScaleRatio(scales.ears, topScales.ears),
    getScaleRatio(scales.mouth, topScales.mouth),
  ].filter((ratio): ratio is number =>
    isPlausibleDepthRatio(ratio, previousDepthRatio)
  )
  const torsoValues = [
    getScaleRatio(scales.shoulders, topScales.shoulders),
    getScaleRatio(scales.hips, topScales.hips),
  ].filter((ratio): ratio is number =>
    isPlausibleDepthRatio(ratio, previousDepthRatio)
  )
  const face = faceValues.length > 0 ? median(faceValues) : null
  const torso = torsoValues.length > 0 ? median(torsoValues) : null
  const poseVerified = hasPoseTracking(scales)
  const signalCount =
    faceValues.length + torsoValues.length + (depth === null ? 0 : 1)

  return {
    depth,
    face,
    poseVerified,
    signalCount,
    source: depth === null ? "none" : poseVerified ? "depth+pose" : "depth",
    torso,
  }
}

export function getTrackingFrame(
  observation: TrackingObservation,
  topScales: TrackingScales | null,
  phoneFlat: boolean,
  previousDepthRatio: number | null = null
) {
  const scales = getTrackingScales(observation)
  const ratios = topScales
    ? getTrackingRatios(scales, topScales, previousDepthRatio)
    : null
  const setup = requireFlatPhone(
    getTrackingSetupState(
      hasPoseTracking(scales) && scales.distanceMeters !== null
    ),
    phoneFlat
  )

  return { ratios, scales, setup }
}
