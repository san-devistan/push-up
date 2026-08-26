import { useEffect } from "react"
import { StyleSheet, type ViewStyle } from "react-native"
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
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg"
import { useCSSVariable } from "uniwind"

const AnimatedLinearGradient = createAnimatedComponent(LinearGradient)
const AnimatedPath = createAnimatedComponent(Path)
const TRACE_LENGTH = 295.38
const TRACE_PATH =
  "M31 7 H119 A19 19 0 0 1 138 26 A19 19 0 0 1 119 45 H31 A19 19 0 0 1 12 26 A19 19 0 0 1 31 7 Z"
const VISIBLE_LENGTH = 100
const TRACE_PROGRESS = [
  0, 0.29792, 0.34844, 0.39896, 0.44948, 0.5, 0.79792, 0.84844, 0.89896,
  0.94948, 1,
]
const TRACE_X = [
  31, 119, 132.435, 138, 132.435, 119, 31, 17.565, 12, 17.565, 31,
]
const TRACE_Y = [7, 7, 12.565, 26, 39.435, 45, 45, 39.435, 26, 12.565, 7]
const HEIGHT = 52
const WIDTH = 150
const styles = StyleSheet.create({
  root: {
    height: HEIGHT,
    left: "50%",
    marginLeft: -WIDTH / 2,
    position: "absolute",
    width: WIDTH,
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
    strokeDashoffset: -progress.get() * TRACE_LENGTH + VISIBLE_LENGTH,
  }))
  const gradientAnimatedProps = useAnimatedProps(() => {
    const head = progress.get()
    const tail = (head - VISIBLE_LENGTH / TRACE_LENGTH + 1) % 1

    return {
      x1: interpolate(tail, TRACE_PROGRESS, TRACE_X),
      x2: interpolate(head, TRACE_PROGRESS, TRACE_X),
      y1: interpolate(tail, TRACE_PROGRESS, TRACE_Y),
      y2: interpolate(head, TRACE_PROGRESS, TRACE_Y),
    }
  })

  if (process.env.EXPO_OS !== "ios") return null

  const traceStyle = StyleSheet.compose<ViewStyle, ViewStyle, ViewStyle>(
    styles.root,
    { top: Math.max(0, (insets.top - HEIGHT) / 2) }
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
        d={TRACE_PATH}
        fill="none"
        stroke="url(#camera-trace-gradient)"
        strokeDasharray={`${VISIBLE_LENGTH} ${TRACE_LENGTH - VISIBLE_LENGTH}`}
        strokeLinecap="round"
        strokeWidth={7}
      />
    </Svg>
  )
}
