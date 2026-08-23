import { Button } from "@/components/ui/button"
import type { FaceCameraProps } from "@/features/workout/camera.types"
import { useI18n } from "@/hooks/use-i18n"
import { appleFaceDetector } from "@/modules/face-detector/src/spec.nitro"
import { Text } from "panelui-native"
import { useEffect, useRef, useState } from "react"
import { StyleSheet, View } from "react-native"
import {
  Camera,
  useAsyncRunner,
  useCameraDevice,
  useCameraPermission,
  useFrameOutput,
} from "react-native-vision-camera"

const CAMERA_RESOLUTION = { height: 1280, width: 720 } as const
const OBSERVATION_INTERVAL_MS = 100
const styles = StyleSheet.create({
  messageSurface: { zIndex: 10 },
})

export default function FaceCamera({
  isActive,
  onError,
  onFace,
}: FaceCameraProps) {
  "use no memo"

  const { t } = useI18n()
  const asyncRunner = useAsyncRunner()
  const { hasPermission, requestPermission } = useCameraPermission()
  const device = useCameraDevice("front")
  const errorCallback = useRef(onError)
  const faceCallback = useRef(onFace)

  useEffect(() => {
    errorCallback.current = onError
  }, [onError])

  useEffect(() => {
    faceCallback.current = onFace
  }, [onFace])

  useEffect(() => {
    if (!hasPermission) void requestPermission()
  }, [hasPermission, requestPermission])

  useEffect(() => {
    appleFaceDetector.reset()
    if (!isActive) return undefined

    const interval = setInterval(() => {
      const error = appleFaceDetector.error
      if (error) errorCallback.current(error)
      faceCallback.current(appleFaceDetector.face ?? null)
    }, OBSERVATION_INTERVAL_MS)

    return () => {
      clearInterval(interval)
      appleFaceDetector.reset()
    }
  }, [isActive])

  const frameOutput = useFrameOutput({
    dropFramesWhileBusy: true,
    pixelFormat: "yuv",
    targetResolution: CAMERA_RESOLUTION,
    onFrame(frame) {
      "worklet"
      const accepted = asyncRunner.runAsync(() => {
        "worklet"
        appleFaceDetector.processFrame(frame)
        frame.dispose()
      })

      if (!accepted) frame.dispose()
    },
  })
  const [handleCameraError] = useState(
    () => (error: Error) => errorCallback.current(error.message)
  )
  const permissionCallback = useRef(requestPermission)

  useEffect(() => {
    permissionCallback.current = requestPermission
  }, [requestPermission])

  const [requestCameraPermission] = useState(
    () => () => void permissionCallback.current()
  )
  const [outputs] = useState(() => [frameOutput])

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

  if (!device) {
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

  return (
    <View className="flex-1 bg-background">
      <Camera
        device={device}
        isActive={isActive}
        mirrorMode="on"
        onError={handleCameraError}
        orientationSource="interface"
        outputs={outputs}
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
      />
      <View className="absolute inset-0 bg-background" pointerEvents="none" />
    </View>
  )
}
