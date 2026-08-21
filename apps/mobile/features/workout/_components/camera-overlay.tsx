import {
  PUSHUP_THRESHOLDS,
  SETUP_ZONES,
  type PoseLandmark,
} from "@/features/workout/_lib/counter"
import { useI18n } from "@/hooks/use-i18n"
import { StyleSheet } from "react-native"
import Svg, { Circle, Line, Rect, Text as SvgText } from "react-native-svg"

const CAMERA_RESOLUTION = { height: 360, width: 640 } as const

const LANDMARK_KEYS = Array.from({ length: 34 }, (_, index) => String(index))
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
const SETUP_HEAD_ZONE_END_Y = CAMERA_RESOLUTION.width * SETUP_ZONES.head.max
const SETUP_HEAD_ZONE_START_Y = CAMERA_RESOLUTION.width * SETUP_ZONES.head.min
const SETUP_HEAD_ZONE_HEIGHT = SETUP_HEAD_ZONE_END_Y - SETUP_HEAD_ZONE_START_Y
const SETUP_LABEL_FONT_SIZE = 16
const SETUP_LABEL_X = 52
const SETUP_WRIST_ZONE_END_Y = CAMERA_RESOLUTION.width * SETUP_ZONES.wrist.max
const SETUP_WRIST_ZONE_START_Y = CAMERA_RESOLUTION.width * SETUP_ZONES.wrist.min
const SETUP_WRIST_ZONE_HEIGHT =
  SETUP_WRIST_ZONE_END_Y - SETUP_WRIST_ZONE_START_Y

export function LandmarksOverlay({
  depthGuideY,
  depthReached,
  landmarks,
  showDepthGuide,
  showSetupGuides,
}: {
  depthGuideY: number | null
  depthReached: boolean
  landmarks: readonly PoseLandmark[]
  showDepthGuide: boolean
  showSetupGuides: boolean
}) {
  const { t } = useI18n()
  const guideColor = depthReached ? "#319f5b" : "#ef4444"
  const guidePosition =
    showDepthGuide && depthGuideY !== null
      ? depthGuideY * CAMERA_RESOLUTION.width
      : null

  return (
    <Svg
      pointerEvents="none"
      preserveAspectRatio="xMidYMid slice"
      style={StyleSheet.absoluteFill}
      viewBox={PORTRAIT_VIEWBOX}
    >
      {showSetupGuides ? (
        <>
          <Rect
            fill="#319f5b"
            fillOpacity={0.12}
            height={SETUP_HEAD_ZONE_HEIGHT}
            width={CAMERA_RESOLUTION.height}
            x={0}
            y={SETUP_HEAD_ZONE_START_Y}
          />
          <Line
            stroke="#319f5b"
            strokeDasharray="8 8"
            strokeOpacity={0.8}
            strokeWidth={3}
            x1={20}
            x2={CAMERA_RESOLUTION.height - 20}
            y1={SETUP_HEAD_ZONE_START_Y}
            y2={SETUP_HEAD_ZONE_START_Y}
          />
          <Line
            stroke="#319f5b"
            strokeDasharray="8 8"
            strokeOpacity={0.8}
            strokeWidth={3}
            x1={20}
            x2={CAMERA_RESOLUTION.height - 20}
            y1={SETUP_HEAD_ZONE_END_Y}
            y2={SETUP_HEAD_ZONE_END_Y}
          />
          <SvgText
            fill="#319f5b"
            fontSize={SETUP_LABEL_FONT_SIZE}
            fontWeight="700"
            x={SETUP_LABEL_X}
            y={SETUP_HEAD_ZONE_END_Y - 12}
          >
            {t("camera.headZone")}
          </SvgText>
          <Rect
            fill="#319f5b"
            fillOpacity={0.12}
            height={SETUP_WRIST_ZONE_HEIGHT}
            width={CAMERA_RESOLUTION.height}
            x={0}
            y={SETUP_WRIST_ZONE_START_Y}
          />
          <Line
            stroke="#319f5b"
            strokeDasharray="8 8"
            strokeOpacity={0.8}
            strokeWidth={3}
            x1={20}
            x2={CAMERA_RESOLUTION.height - 20}
            y1={SETUP_WRIST_ZONE_START_Y}
            y2={SETUP_WRIST_ZONE_START_Y}
          />
          <Line
            stroke="#319f5b"
            strokeDasharray="8 8"
            strokeOpacity={0.8}
            strokeWidth={3}
            x1={20}
            x2={CAMERA_RESOLUTION.height - 20}
            y1={SETUP_WRIST_ZONE_END_Y}
            y2={SETUP_WRIST_ZONE_END_Y}
          />
          <SvgText
            fill="#319f5b"
            fontSize={SETUP_LABEL_FONT_SIZE}
            fontWeight="700"
            x={SETUP_LABEL_X}
            y={SETUP_WRIST_ZONE_START_Y + SETUP_LABEL_FONT_SIZE + 12}
          >
            {t("camera.wristZone")}
          </SvgText>
        </>
      ) : null}
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
            x={SETUP_LABEL_X}
            y={guidePosition - 10}
          >
            {t(depthReached ? "camera.depthReached" : "camera.targetDepth")}
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
            stroke="#319f5b"
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
            fill="#319f5b"
            r={5}
            stroke="#0a0a0a"
            strokeWidth={2}
          />
        ) : null
      })}
    </Svg>
  )
}
