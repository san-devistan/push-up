import { Button } from "@/components/ui/button"
import type {
  FaceCameraProps,
  FaceObservation,
} from "@/features/workout/camera.types"
import { useI18n } from "@/hooks/use-i18n"
import { Text } from "panelui-native"
import { useEffect, useRef, useState } from "react"
import { StyleSheet, View } from "react-native"
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera"
import {
  type Face,
  useFaceDetectorOutput,
} from "react-native-vision-camera-face-detector"

const OBSERVATION_INTERVAL_MS = 100
const styles = StyleSheet.create({
  messageSurface: { zIndex: 10 },
})

function toObservation(face: Face): FaceObservation {
  return {
    frameHeight: face.frameHeight,
    frameWidth: face.frameWidth,
    height: face.bounds.height,
    rollAngle: face.rollAngle,
    width: face.bounds.width,
    yawAngle: face.yawAngle,
  }
}

export default function FaceCamera({
  isActive,
  onError,
  onFace,
}: FaceCameraProps) {
  "use no memo"

  const { t } = useI18n()
  const { hasPermission, requestPermission } = useCameraPermission()
  const device = useCameraDevice("front")
  const errorCallback = useRef(onError)
  const faceCallback = useRef(onFace)
  const lastObservationAt = useRef(0)

  useEffect(() => {
    errorCallback.current = onError
  }, [onError])

  useEffect(() => {
    faceCallback.current = onFace
  }, [onFace])

  useEffect(() => {
    if (!hasPermission) void requestPermission()
  }, [hasPermission, requestPermission])

  const [handleFacesDetected] = useState(() => (faces: Face[]) => {
    const now = Date.now()
    if (now - lastObservationAt.current < OBSERVATION_INTERVAL_MS) return

    lastObservationAt.current = now
    const face = faces.length === 1 ? faces[0] : undefined
    faceCallback.current(face ? toObservation(face) : null)
  })
  const [handleError] = useState(
    () => (error: Error) => errorCallback.current(error.message)
  )
  const permissionCallback = useRef(requestPermission)

  useEffect(() => {
    permissionCallback.current = requestPermission
  }, [requestPermission])

  const [requestCameraPermission] = useState(
    () => () => void permissionCallback.current()
  )
  const faceDetectorOutput = useFaceDetectorOutput({
    cameraFacing: "front",
    minFaceSize: 0.1,
    onError: handleError,
    onFacesDetected: handleFacesDetected,
    outputResolution: "preview",
    performanceMode: "fast",
    runClassifications: false,
    runContours: false,
    runLandmarks: false,
    trackingEnabled: true,
  })
  const [outputs] = useState(() => [faceDetectorOutput])

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
        onError={handleError}
        orientationSource="interface"
        outputs={outputs}
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
      />
      <View className="absolute inset-0 bg-background" pointerEvents="none" />
    </View>
  )
}
