import type { BodyLandmark } from "@/features/tracking/body/types"
import { useEffect, useRef, useState } from "react"
import type { StyleProp, ViewStyle } from "react-native"
import { nitroPoseExercises } from "react-native-nitro-pose-exercises"
import {
  Camera,
  type CameraDevice,
  useAsyncRunner,
  useFrameOutput,
} from "react-native-vision-camera"

const CAMERA_RESOLUTION = { height: 360, width: 640 } as const
const LANDMARK_INTERVAL_MS = 100

export default function BodyTrackingCamera({
  device,
  isActive,
  onError,
  onLandmarks,
  style,
}: {
  device: CameraDevice
  isActive: boolean
  onError: (message: string) => void
  onLandmarks: (landmarks: readonly BodyLandmark[]) => void
  style?: StyleProp<ViewStyle>
}) {
  "use no memo"

  const asyncRunner = useAsyncRunner()
  const errorCallback = useRef(onError)
  const landmarksCallback = useRef(onLandmarks)
  const [initialized, setInitialized] = useState(false)
  const isIos = process.env.EXPO_OS === "ios"

  useEffect(() => {
    errorCallback.current = onError
  }, [onError])

  useEffect(() => {
    landmarksCallback.current = onLandmarks
  }, [onLandmarks])

  useEffect(() => {
    let mounted = true

    void nitroPoseExercises
      .initialize("")
      .then(() => {
        if (mounted) setInitialized(true)
        return undefined
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : "Body tracking could not start."
        errorCallback.current(message)
      })

    return () => {
      mounted = false
      nitroPoseExercises.release()
    }
  }, [])

  useEffect(() => {
    if (!initialized) return undefined

    const interval = setInterval(() => {
      landmarksCallback.current(
        nitroPoseExercises.landmarks.map(({ visibility, x, y, z }) => ({
          visibility,
          x,
          y,
          z,
        }))
      )
    }, LANDMARK_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [initialized])

  const frameOutput = useFrameOutput({
    dropFramesWhileBusy: true,
    pixelFormat: "yuv",
    targetResolution: CAMERA_RESOLUTION,
    onFrame(frame) {
      "worklet"
      const accepted = asyncRunner.runAsync(() => {
        "worklet"
        try {
          if (isIos) {
            nitroPoseExercises.processFrameIOS(frame)
          } else {
            nitroPoseExercises.processFrameAndroid(frame)
          }
        } finally {
          frame.dispose()
        }
      })

      if (!accepted) frame.dispose()
    },
  })
  const [handleCameraError] = useState(
    () => (error: Error) => errorCallback.current(error.message)
  )
  const [outputs] = useState(() => [frameOutput])

  return (
    <Camera
      device={device}
      isActive={isActive && initialized}
      mirrorMode={device.position === "front" ? "on" : "off"}
      onError={handleCameraError}
      orientationSource="interface"
      outputs={outputs}
      resizeMode="cover"
      style={style}
    />
  )
}
