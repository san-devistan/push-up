import type { BodyLandmark } from "@/features/tracking/body/types"
import { poseDetector } from "@/modules/pose-detector/src/spec.nitro"
import { useEffect, useRef } from "react"

const LANDMARK_INTERVAL_MS = 100

export { poseDetector }

export function useBodyTracker({
  isActive,
  onError,
  onLandmarks,
}: {
  isActive: boolean
  onError: (message: string) => void
  onLandmarks: (landmarks: readonly BodyLandmark[]) => void
}) {
  const errorCallback = useRef(onError)
  const landmarksCallback = useRef(onLandmarks)

  useEffect(() => {
    errorCallback.current = onError
  }, [onError])

  useEffect(() => {
    landmarksCallback.current = onLandmarks
  }, [onLandmarks])

  useEffect(() => {
    if (!isActive) return undefined

    poseDetector.reset()

    const interval = setInterval(() => {
      const error = poseDetector.error
      if (error) errorCallback.current(error)
      landmarksCallback.current(poseDetector.landmarks)
    }, LANDMARK_INTERVAL_MS)

    return () => {
      clearInterval(interval)
      poseDetector.reset()
    }
  }, [isActive])
}
