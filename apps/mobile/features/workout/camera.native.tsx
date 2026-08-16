import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import {
  getDepthGuideY,
  getPoseMetrics,
  isDepthReached,
  PUSHUP_THRESHOLDS,
  type PoseLandmark,
} from "@/features/workout/_lib/counter"
import type { PoseCameraProps } from "@/features/workout/camera.types"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { StyleSheet, View } from "react-native"
import {
  nitroPoseExercises,
  type ExerciseConfig,
} from "react-native-nitro-pose-exercises"
import Svg, { Circle, Line, Text as SvgText } from "react-native-svg"
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
const LANDMARK_KEYS =
  "0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33".split(
    " "
  )
const SKELETON_CONNECTIONS = [
  [0, 2],
  [0, 5],
  [2, 7],
  [5, 8],
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
] as const
const PORTRAIT_VIEWBOX = `0 0 ${CAMERA_RESOLUTION.height} ${CAMERA_RESOLUTION.width}`
const styles = StyleSheet.create({
  cameraMessage: { color: "#ffffff" },
  cameraSurface: { backgroundColor: "#000000" },
})
type PoseOverlay = {
  depthGuideY: number | null
  depthReached: boolean
  landmarks: readonly PoseLandmark[]
}

function LandmarksOverlay({
  depthGuideY,
  depthReached,
  landmarks,
}: {
  depthGuideY: number | null
  depthReached: boolean
  landmarks: readonly PoseLandmark[]
}) {
  const guideColor = depthReached ? "#bef264" : "#ef4444"
  const guidePosition =
    depthGuideY === null ? null : depthGuideY * CAMERA_RESOLUTION.width

  return (
    <Svg
      pointerEvents="none"
      preserveAspectRatio="xMidYMid slice"
      style={StyleSheet.absoluteFill}
      viewBox={PORTRAIT_VIEWBOX}
    >
      {guidePosition === null ? null : (
        <>
          <Line
            stroke="#0a0a0a"
            strokeLinecap="round"
            strokeOpacity={0.7}
            strokeWidth={12}
            x1={24}
            x2={CAMERA_RESOLUTION.height - 24}
            y1={guidePosition}
            y2={guidePosition}
          />
          <Line
            stroke={guideColor}
            strokeLinecap="round"
            strokeWidth={7}
            x1={24}
            x2={CAMERA_RESOLUTION.height - 24}
            y1={guidePosition}
            y2={guidePosition}
          />
          <SvgText
            fill={guideColor}
            fontSize={14}
            fontWeight="700"
            x={24}
            y={guidePosition - 10}
          >
            {depthReached ? "DEPTH REACHED" : "TARGET DEPTH"}
          </SvgText>
        </>
      )}
      {SKELETON_CONNECTIONS.map(([startIndex, endIndex]) => {
        const start = landmarks[startIndex]
        const end = landmarks[endIndex]

        return start &&
          end &&
          start.visibility >= PUSHUP_THRESHOLDS.visibility &&
          end.visibility >= PUSHUP_THRESHOLDS.visibility ? (
          <Line
            key={`${startIndex}-${endIndex}`}
            stroke="#bef264"
            strokeLinecap="round"
            strokeOpacity={0.85}
            strokeWidth={4}
            x1={start.x * CAMERA_RESOLUTION.height}
            x2={end.x * CAMERA_RESOLUTION.height}
            y1={start.y * CAMERA_RESOLUTION.width}
            y2={end.y * CAMERA_RESOLUTION.width}
          />
        ) : null
      })}
      {LANDMARK_KEYS.map((landmarkKey, index) => {
        const landmark = landmarks[index]

        return landmark &&
          landmark.visibility >= PUSHUP_THRESHOLDS.visibility ? (
          <Circle
            key={landmarkKey}
            cx={landmark.x * CAMERA_RESOLUTION.height}
            cy={landmark.y * CAMERA_RESOLUTION.width}
            fill="#bef264"
            r={5}
            stroke="#0a0a0a"
            strokeWidth={2}
          />
        ) : null
      })}
    </Svg>
  )
}

export default function PoseCamera({
  isActive,
  onError,
  onLandmarks,
}: PoseCameraProps) {
  "use no memo"

  const { hasPermission, requestPermission } = useCameraPermission()
  const device = useCameraDevice("front")
  const asyncRunner = useAsyncRunner()
  const landmarksCallback = useRef(onLandmarks)
  const [initialized, setInitialized] = useState(false)
  const [overlay, setOverlay] = useState<PoseOverlay>({
    depthGuideY: null,
    depthReached: false,
    landmarks: [],
  })
  const isIos = process.env.EXPO_OS === "ios"

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
      .catch(() => onError("Pose detection could not start."))

    return () => {
      mounted = false
      nitroPoseExercises.release()
    }
  }, [onError])

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
          Camera access is required to count push-ups locally.
        </Text>
        <Button onPress={requestCameraPermission}>
          <Text>Allow camera</Text>
        </Button>
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
          Camera unavailable.
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
      />
    </View>
  )
}
