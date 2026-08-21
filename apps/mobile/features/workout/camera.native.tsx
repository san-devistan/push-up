import { LandmarksOverlay } from "@/features/workout/_components/camera-overlay"
import {
  getDepthGuideY,
  getPoseMetrics,
  isDepthReached,
  PUSHUP_THRESHOLDS,
  type PoseLandmark,
} from "@/features/workout/_lib/counter"
import type { PoseCameraProps } from "@/features/workout/camera.types"
import { useI18n } from "@/hooks/use-i18n"
import { translate } from "@/lib/i18n"
import { Button, Text } from "panelui-native"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { StyleSheet, View } from "react-native"
import {
  nitroPoseExercises,
  type ExerciseConfig,
} from "react-native-nitro-pose-exercises"
import {
  Camera,
  useAsyncRunner,
  useCameraDevice,
  useCameraPermission,
  useFrameOutput,
} from "react-native-vision-camera"

const DETECTION_CONFIG = {
  angles: [],
  cameraAngle: "front",
  formRules: [],
  holdDurationMs: 0,
  name: "Push-Up Detection",
  phases: [],
  postureFamily: "horizontalProne",
  repSequence: [],
  type: "rep",
  visibilityThreshold: PUSHUP_THRESHOLDS.visibility,
} satisfies ExerciseConfig

const CAMERA_RESOLUTION = { height: 360, width: 640 } as const

const styles = StyleSheet.create({
  cameraMessage: { color: "#ffffff" },
  cameraSurface: { backgroundColor: "#000000" },
})
type PoseOverlay = {
  depthGuideY: number | null
  depthReached: boolean
  landmarks: readonly PoseLandmark[]
}

export default function PoseCamera({
  isActive,
  onError,
  onLandmarks,
  showDepthGuide = true,
  showSetupGuides = false,
}: PoseCameraProps) {
  "use no memo"

  const { language, t } = useI18n()
  const { hasPermission, requestPermission } = useCameraPermission()
  const device = useCameraDevice("front")
  const asyncRunner = useAsyncRunner()
  const errorCallback = useRef(onError)
  const landmarksCallback = useRef(onLandmarks)
  const [initialized, setInitialized] = useState(false)
  const [overlay, setOverlay] = useState<PoseOverlay>({
    depthGuideY: null,
    depthReached: false,
    landmarks: [],
  })
  const isIos = process.env.EXPO_OS === "ios"

  useEffect(() => {
    errorCallback.current = onError
  }, [onError])

  useEffect(() => {
    landmarksCallback.current = onLandmarks
  }, [onLandmarks])

  useEffect(() => {
    if (!hasPermission) {
      void requestPermission()
    }
  }, [hasPermission, requestPermission])

  useEffect(() => {
    let mounted = true

    void nitroPoseExercises
      .initialize("")
      .then(() => {
        if (!mounted) {
          return false
        }

        nitroPoseExercises.loadExercise(DETECTION_CONFIG)
        nitroPoseExercises.startSession(0, 0)
        setInitialized(true)
        return true
      })
      .catch(() =>
        errorCallback.current(translate(language, "camera.poseStartError"))
      )

    return () => {
      mounted = false
      nitroPoseExercises.release()
    }
  }, [language])

  useEffect(() => {
    if (!initialized) {
      return undefined
    }

    const interval = setInterval(() => {
      const detectedLandmarks = nitroPoseExercises.landmarks
      const metrics = getPoseMetrics(detectedLandmarks)
      const calibratedDepth =
        metrics && metrics.elbowAngle >= PUSHUP_THRESHOLDS.top
          ? getDepthGuideY(detectedLandmarks)
          : null

      setOverlay((current) => {
        const depthGuideY = calibratedDepth ?? current.depthGuideY

        return {
          depthGuideY,
          depthReached: isDepthReached(detectedLandmarks, depthGuideY),
          landmarks: detectedLandmarks,
        }
      })
      landmarksCallback.current(detectedLandmarks)
    }, 100)

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

      if (!accepted) {
        frame.dispose()
      }
    },
  })
  const cameraOutputs = useMemo(
    () => (initialized ? [frameOutput] : []),
    [frameOutput, initialized]
  )
  const requestCameraPermission = useCallback(() => {
    void requestPermission()
  }, [requestPermission])

  if (!hasPermission) {
    return (
      <View
        className="flex-1 items-center justify-center gap-4 px-8"
        style={styles.cameraSurface}
      >
        <Text className="text-center" style={styles.cameraMessage}>
          {t("camera.accessRequired")}
        </Text>
        <Button onPress={requestCameraPermission}>{t("camera.allow")}</Button>
      </View>
    )
  }

  if (!device) {
    return (
      <View
        className="flex-1 items-center justify-center px-8"
        style={styles.cameraSurface}
      >
        <Text className="text-center" style={styles.cameraMessage}>
          {t("camera.unavailable")}
        </Text>
      </View>
    )
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <Camera
        device={device}
        isActive={isActive && initialized}
        mirrorMode="on"
        orientationSource="interface"
        outputs={cameraOutputs}
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
      />
      <LandmarksOverlay
        depthGuideY={overlay.depthGuideY}
        depthReached={overlay.depthReached}
        landmarks={overlay.landmarks}
        showDepthGuide={showDepthGuide}
        showSetupGuides={showSetupGuides}
      />
    </View>
  )
}
