import { PUSHUP_THRESHOLDS } from "@/features/workout/_lib/counter"
import { THEME } from "@/lib/theme"
import { useState } from "react"
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native"
import Svg, { Line, Polyline, Text as SvgText } from "react-native-svg"

// A rep runs from the 160° top down toward a flexed elbow; 60° is deeper than
// anyone gets, so it anchors the bottom of both charts.
const FLOOR_ANGLE = 60
const PLOT_HEIGHT = 112
const PLOT_PADDING = 6

type Attempt = {
  depthTrace?: number[]
  minElbowAngle: number
  startedAtOffsetMs: number
  trace?: number[]
  valid: boolean
}
type TracedAttempt = Pick<Attempt, "startedAtOffsetMs" | "valid"> & {
  values: number[]
}

const styles = StyleSheet.create({
  bar: { borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  plot: { height: PLOT_HEIGHT },
})

function hasPoseTrace(attempts: readonly Attempt[]) {
  return attempts.some(
    (attempt) =>
      (attempt.depthTrace?.length ?? 0) > 1 || (attempt.trace?.length ?? 0) > 1
  )
}

function toDepthRatio(angle: number) {
  const span = PUSHUP_THRESHOLDS.top - FLOOR_ANGLE

  return Math.max(0, Math.min(1, (angle - FLOOR_ANGLE) / span))
}

function toPlotY(angle: number) {
  return (
    PLOT_PADDING + (1 - toDepthRatio(angle)) * (PLOT_HEIGHT - PLOT_PADDING * 2)
  )
}

function toPolyline({
  mapY,
  offset,
  total,
  values,
  width,
}: {
  mapY: (value: number) => number
  offset: number
  total: number
  values: readonly number[]
  width: number
}) {
  return values
    .map((value, index) => {
      const x = ((offset + index) / Math.max(1, total - 1)) * width

      return `${x.toFixed(1)},${mapY(value).toFixed(1)}`
    })
    .join(" ")
}

function toRepLines(
  attempts: readonly TracedAttempt[],
  width: number,
  mapY: (value: number) => number
) {
  const total = attempts.reduce((sum, item) => sum + item.values.length, 0)
  let offset = 0

  return attempts.map((attempt) => {
    const key = `${attempt.startedAtOffsetMs}:${attempt.values.length}`
    const points = toPolyline({
      mapY,
      offset,
      total,
      values: attempt.values,
      width,
    })
    offset += attempt.values.length

    return { key, points, valid: attempt.valid }
  })
}

function getTracedAttempts(
  attempts: readonly Attempt[],
  key: "depthTrace" | "trace"
) {
  return attempts.flatMap((attempt) => {
    const values = attempt[key]

    return values && values.length > 1
      ? [
          {
            startedAtOffsetMs: attempt.startedAtOffsetMs,
            valid: attempt.valid,
            values,
          },
        ]
      : []
  })
}

function getDepthPlotY(attempts: readonly TracedAttempt[]) {
  const values = [0, ...attempts.flatMap((attempt) => attempt.values)]
  const minimum = Math.min(...values)
  const maximum = Math.max(...values)
  const padding = Math.max((maximum - minimum) * 0.1, 0.02)
  const start = minimum - padding
  const span = maximum - minimum + padding * 2

  return (value: number) =>
    PLOT_PADDING + ((value - start) / span) * (PLOT_HEIGHT - PLOT_PADDING * 2)
}

function getMeasure(setWidth: (width: number) => void) {
  return (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)
}

function getBarStyle(angle: number): StyleProp<ViewStyle> {
  return StyleSheet.compose(styles.bar, {
    height: `${Math.max(4, (1 - toDepthRatio(angle)) * 100)}%`,
  })
}

/** One motion stroke per rep. New sessions plot shoulder travel relative to
 * the calibrated target; older sessions fall back to their elbow-angle trace. */
function RepPositionChart({ attempts }: { attempts: readonly Attempt[] }) {
  const [width, setWidth] = useState(0)
  const depthTraces = getTracedAttempts(attempts, "depthTrace")
  const showsTargetDepth = depthTraces.length > 0
  const traced = showsTargetDepth
    ? depthTraces
    : getTracedAttempts(attempts, "trace")

  if (traced.length === 0) {
    return null
  }

  const mapY = showsTargetDepth ? getDepthPlotY(traced) : toPlotY
  const targetY = showsTargetDepth ? mapY(0) : null
  const targetLabelY =
    targetY === null ? 0 : targetY < 18 ? targetY + 14 : targetY - 6
  const lines = width > 0 ? toRepLines(traced, width, mapY) : []
  return (
    <View onLayout={getMeasure(setWidth)} style={styles.plot}>
      <Svg height={PLOT_HEIGHT} width={width}>
        {targetY === null ? null : (
          <>
            <Line
              stroke={THEME.dark.mutedForeground}
              strokeDasharray="4 5"
              strokeWidth={1}
              x1={0}
              x2={width}
              y1={targetY}
              y2={targetY}
            />
            <SvgText
              fill={THEME.dark.mutedForeground}
              fontSize={9}
              fontWeight="700"
              x={4}
              y={targetLabelY}
            >
              TARGET DEPTH
            </SvgText>
          </>
        )}
        {lines.map((line) => (
          <Polyline
            fill="none"
            key={line.key}
            points={line.points}
            stroke={line.valid ? THEME.dark.primary : THEME.dark.destructive}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
          />
        ))}
      </Svg>
    </View>
  )
}

/** Fallback for sessions recorded before the pose trace existed: only the
 * deepest point of each rep survived, so plot that one number per rep. */
function RepDepthChart({ attempts }: { attempts: readonly Attempt[] }) {
  if (attempts.length === 0) {
    return null
  }

  return (
    <View className="flex-row items-stretch gap-1" style={styles.plot}>
      {attempts.map((attempt, index) => (
        <View
          accessibilityLabel={`Rep ${index + 1}: ${Math.round(attempt.minElbowAngle)} degrees`}
          className="h-full flex-1 justify-end"
          key={attempt.startedAtOffsetMs}
        >
          <View
            className={attempt.valid ? "bg-primary" : "bg-destructive/50"}
            style={getBarStyle(attempt.minElbowAngle)}
          />
        </View>
      ))}
    </View>
  )
}

export function RepMotionChart({ attempts }: { attempts: readonly Attempt[] }) {
  return hasPoseTrace(attempts) ? (
    <RepPositionChart attempts={attempts} />
  ) : (
    <RepDepthChart attempts={attempts} />
  )
}
