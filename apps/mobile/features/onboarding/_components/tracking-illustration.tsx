import { useEffect } from "react"
import { StyleSheet, View, type ViewStyle } from "react-native"
import {
  Easing,
  cancelAnimation,
  createAnimatedComponent,
  interpolate,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg"
import { useCSSVariable } from "uniwind"

const AnimatedLinearGradient = createAnimatedComponent(LinearGradient)
const AnimatedPath = createAnimatedComponent(Path)
const CAMERA_TRACE_LENGTH = 315.4
const CAMERA_TRACE_PATH =
  "M26 7 H124 A19 19 0 0 1 143 26 A19 19 0 0 1 124 45 H26 A19 19 0 0 1 7 26 A19 19 0 0 1 26 7 Z"
const CAMERA_TRACE_VISIBLE_LENGTH = 76
const CAMERA_TRACE_PROGRESS = [
  0, 0.31072, 0.35806, 0.40536, 0.45268, 0.5, 0.81072, 0.85806, 0.90536,
  0.95268, 1,
]
const CAMERA_TRACE_X = [
  26, 124, 137.435, 143, 137.435, 124, 26, 12.565, 7, 12.565, 26,
]
const CAMERA_TRACE_Y = [7, 7, 12.565, 26, 39.435, 45, 45, 39.435, 26, 12.565, 7]
const PHYSICAL_CAMERA_TRACE_HEIGHT = 52
const PHYSICAL_CAMERA_TRACE_WIDTH = 150
const styles = StyleSheet.create({
  illustration: { transform: [{ translateY: -32 }] },
  physicalCameraTrace: {
    height: PHYSICAL_CAMERA_TRACE_HEIGHT,
    left: "50%",
    marginLeft: -PHYSICAL_CAMERA_TRACE_WIDTH / 2,
    position: "absolute",
    width: PHYSICAL_CAMERA_TRACE_WIDTH,
    zIndex: 10,
  },
})

export function PhysicalCameraTrace() {
  const insets = useSafeAreaInsets()
  const reducedMotion = useReducedMotion()
  const progress = useSharedValue(0)
  const foregroundValue = useCSSVariable("--color-foreground")
  const foreground =
    typeof foregroundValue === "string" ? foregroundValue : "#ffffff"

  useEffect(() => {
    progress.set(0)
    if (!reducedMotion) {
      progress.set(
        withRepeat(
          withTiming(1, { duration: 1800, easing: Easing.linear }),
          -1,
          false
        )
      )
    }
    return () => cancelAnimation(progress)
  }, [progress, reducedMotion])

  const pathAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset:
      -progress.get() * CAMERA_TRACE_LENGTH + CAMERA_TRACE_VISIBLE_LENGTH,
  }))
  const gradientAnimatedProps = useAnimatedProps(() => {
    const head = progress.get()
    const tail =
      (head - CAMERA_TRACE_VISIBLE_LENGTH / CAMERA_TRACE_LENGTH + 1) % 1

    return {
      x1: interpolate(tail, CAMERA_TRACE_PROGRESS, CAMERA_TRACE_X),
      x2: interpolate(head, CAMERA_TRACE_PROGRESS, CAMERA_TRACE_X),
      y1: interpolate(tail, CAMERA_TRACE_PROGRESS, CAMERA_TRACE_Y),
      y2: interpolate(head, CAMERA_TRACE_PROGRESS, CAMERA_TRACE_Y),
    }
  })

  if (process.env.EXPO_OS !== "ios" || insets.top < 50) {
    return null
  }

  const traceStyle = StyleSheet.compose<ViewStyle, ViewStyle, ViewStyle>(
    styles.physicalCameraTrace,
    { top: (insets.top - PHYSICAL_CAMERA_TRACE_HEIGHT) / 2 }
  )

  return (
    <Svg
      accessible={false}
      pointerEvents="none"
      style={traceStyle}
      viewBox="0 0 150 52"
    >
      <Defs>
        <AnimatedLinearGradient
          animatedProps={gradientAnimatedProps}
          gradientUnits="userSpaceOnUse"
          id="camera-trace-gradient"
        >
          <Stop offset="0" stopColor={foreground} stopOpacity={0} />
          <Stop offset="0.35" stopColor={foreground} stopOpacity={0.08} />
          <Stop offset="0.72" stopColor={foreground} stopOpacity={0.5} />
          <Stop offset="1" stopColor={foreground} stopOpacity={1} />
        </AnimatedLinearGradient>
      </Defs>
      <AnimatedPath
        animatedProps={pathAnimatedProps}
        d={CAMERA_TRACE_PATH}
        fill="none"
        stroke="url(#camera-trace-gradient)"
        strokeDasharray={`${CAMERA_TRACE_VISIBLE_LENGTH} ${CAMERA_TRACE_LENGTH - CAMERA_TRACE_VISIBLE_LENGTH}`}
        strokeLinecap="round"
        strokeWidth={5}
      />
    </Svg>
  )
}

export default function TrackingIllustration() {
  const backgroundValue = useCSSVariable("--color-background")
  const foregroundValue = useCSSVariable("--color-foreground")
  const mutedValue = useCSSVariable("--color-muted-foreground")
  const primaryValue = useCSSVariable("--color-primary")
  const background =
    typeof backgroundValue === "string" ? backgroundValue : "#ffffff"
  const foreground =
    typeof foregroundValue === "string" ? foregroundValue : "#18181b"
  const muted = typeof mutedValue === "string" ? mutedValue : "#71717a"
  const primary = typeof primaryValue === "string" ? primaryValue : "#22c55e"

  return (
    <View
      className="flex-1 items-center justify-center"
      style={styles.illustration}
    >
      <Svg
        accessibilityLabel="A phone tracking a push-up"
        accessible
        height={260}
        viewBox="0 0 320 240"
        width="100%"
      >
        <Line
          opacity={0.35}
          stroke={muted}
          strokeLinecap="round"
          strokeWidth={4}
          x1={28}
          x2={292}
          y1={202}
          y2={202}
        />
        <G transform="translate(18 0)">
          <Circle cx={241} cy={195} fill={primary} opacity={0.06} r={40} />
          <Circle cx={241} cy={195} fill={primary} opacity={0.1} r={27} />
          <Circle cx={241} cy={195} fill={primary} opacity={0.16} r={15} />
          <Path
            d="M34 193 L90 145 Q130 123 170 132"
            fill="none"
            stroke={foreground}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={18}
          />
          <Path
            d="M166 134 L160 158 L174 194"
            fill="none"
            stroke={foreground}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={16}
          />
          <Circle cx={197} cy={122} fill={foreground} r={13} />
          <Rect
            fill={foreground}
            height={14}
            rx={6}
            width={54}
            x={198}
            y={188}
          />
          <Rect
            fill={background}
            height={8}
            rx={3}
            width={46}
            x={202}
            y={191}
          />
          <Circle cx={241} cy={195} fill={primary} r={4} />
        </G>
      </Svg>
    </View>
  )
}
