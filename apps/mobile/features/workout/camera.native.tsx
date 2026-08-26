import { Button } from "@/components/ui/button"
import { poseDetector, useBodyTracker } from "@/features/tracking/body/tracker"
import type {
  DepthObservation,
  TrackingCameraProps,
} from "@/features/workout/camera.types"
import { useI18n } from "@/hooks/use-i18n"
import { Text } from "panelui-native"
import { useEffect, useRef, useState } from "react"
import { Platform, StyleSheet, View } from "react-native"
import {
  Camera,
  type CameraDevice,
  type Depth,
  useAsyncRunner,
  useCameraDevices,
  useCameraPermission,
  useDepthOutput,
  useFrameOutput,
} from "react-native-vision-camera"
import { scheduleOnRN } from "react-native-worklets"

import { getMedianDepthMeters } from "./_lib/depth"

const CAMERA_RESOLUTION = { height: 360, width: 640 } as const
const DEPTH_RESOLUTION = { height: 240, width: 320 } as const
const DEPTH_STALE_AFTER_MS = 500
const IS_ANDROID = Platform.OS === "android"
const styles = StyleSheet.create({
  messageSurface: { zIndex: 10 },
})

type LatestDepth = DepthObservation & { receivedAt: number }

function supportsTracking(device: CameraDevice) {
  return (
    device.getSupportedResolutions("stream").length > 0 &&
    device.getSupportedResolutions("depth-stream").length > 0
  )
}

function readDepthMeters(depth: Depth) {
  "worklet"

  let readableDepth = depth

  try {
    let format: "android-depth-16" | "float-depth-32"

    if (depth.pixelFormat === "depth-32-bit") {
      format = "float-depth-32"
    } else if (IS_ANDROID && depth.pixelFormat === "depth-16-bit") {
      format = "android-depth-16"
    } else if (depth.availableDepthPixelFormats.includes("depth-32-bit")) {
      readableDepth = depth.convert("depth-32-bit")
      format = "float-depth-32"
    } else {
      return null
    }

    return getMedianDepthMeters({
      buffer: readableDepth.getDepthData(),
      bytesPerRow: readableDepth.bytesPerRow,
      format,
      height: readableDepth.height,
      width: readableDepth.width,
    })
  } finally {
    if (readableDepth !== depth) readableDepth.dispose()
    depth.dispose()
  }
}

export default function TrackingCamera({
  isActive,
  onError,
  onObservation,
  showPreview = false,
}: TrackingCameraProps) {
  "use no memo"

  const { t } = useI18n()
  const asyncRunner = useAsyncRunner()
  const { hasPermission, requestPermission } = useCameraPermission()
  const devices = useCameraDevices()
  const frontDevice = devices.find(({ position }) => position === "front")
  const device = devices.find(
    (candidate) => candidate.position === "front" && supportsTracking(candidate)
  )
  const latestDepth = useRef<LatestDepth | null>(null)
  const depthErrorReported = useRef(false)
  const errorCallback = useRef(onError)
  const observationCallback = useRef(onObservation)

  useEffect(() => {
    errorCallback.current = onError
  }, [onError])

  useEffect(() => {
    observationCallback.current = onObservation
  }, [onObservation])

  useEffect(() => {
    if (!hasPermission) void requestPermission()
  }, [hasPermission, requestPermission])

  const [handleError] = useState(
    () => (error: Error) => errorCallback.current(error.message)
  )
  const [handleDepth] = useState(
    () =>
      (
        distanceMeters: number,
        quality: DepthObservation["quality"],
        accuracy: DepthObservation["accuracy"]
      ) => {
        latestDepth.current = {
          accuracy,
          distanceMeters,
          quality,
          receivedAt: Date.now(),
        }
      }
  )
  const [handleDepthError] = useState(() => (message: string) => {
    if (depthErrorReported.current) return

    depthErrorReported.current = true
    errorCallback.current(message)
  })
  const permissionCallback = useRef(requestPermission)

  useEffect(() => {
    permissionCallback.current = requestPermission
  }, [requestPermission])

  const [requestCameraPermission] = useState(
    () => () => void permissionCallback.current()
  )

  useEffect(() => {
    latestDepth.current = null
    depthErrorReported.current = false
  }, [device?.id, isActive])

  useBodyTracker({
    isActive: isActive && device !== undefined,
    onError,
    onLandmarks(landmarks) {
      const now = Date.now()
      const currentDepth = latestDepth.current
      const depth =
        currentDepth && now - currentDepth.receivedAt <= DEPTH_STALE_AFTER_MS
          ? {
              accuracy: currentDepth.accuracy,
              distanceMeters: currentDepth.distanceMeters,
              quality: currentDepth.quality,
            }
          : null

      observationCallback.current({ depth, landmarks })
    },
  })
  const frameOutput = useFrameOutput({
    dropFramesWhileBusy: true,
    pixelFormat: "yuv",
    targetResolution: CAMERA_RESOLUTION,
    onFrame(frame) {
      "worklet"
      const accepted = asyncRunner.runAsync(() => {
        "worklet"
        try {
          poseDetector.processFrame(frame)
        } finally {
          frame.dispose()
        }
      })

      if (!accepted) frame.dispose()
    },
  })
  const depthOutput = useDepthOutput({
    enableFiltering: true,
    targetResolution: DEPTH_RESOLUTION,
    onDepth(depth) {
      "worklet"
      try {
        const quality = depth.depthDataQuality
        const accuracy = depth.depthDataAccuracy
        const distanceMeters = readDepthMeters(depth)
        if (distanceMeters === null) return

        scheduleOnRN(handleDepth, distanceMeters, quality, accuracy)
      } catch (error) {
        scheduleOnRN(
          handleDepthError,
          `Depth tracking failed: ${String(error)}`
        )
      }
    },
  })
  const [outputs] = useState(() => [frameOutput, depthOutput])

  if (!hasPermission) {
    return (
      <View
        className="flex-1 items-center justify-center gap-4 bg-background px-8"
        style={styles.messageSurface}
      >
        <Text className="text-center text-foreground">
          {t("camera.accessRequired")}
        </Text>
        <Button onPress={requestCameraPermission}>{t("camera.allow")}</Button>
      </View>
    )
  }

  if (!frontDevice) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background px-8"
        style={styles.messageSurface}
      >
        <Text className="text-center text-foreground">
          {t("camera.unavailable")}
        </Text>
      </View>
    )
  }

  if (!device) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background px-8"
        style={styles.messageSurface}
      >
        <Text className="text-center text-foreground">
          {t("camera.depthUnsupported")}
        </Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-background">
      <Camera
        device={device}
        isActive={isActive}
        mirrorMode="on"
        onError={handleError}
        orientationSource="interface"
        outputs={outputs}
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
      />
      {showPreview ? null : (
        <View className="absolute inset-0 bg-background" pointerEvents="none" />
      )}
    </View>
  )
}
