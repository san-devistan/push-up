import { connectTrace } from "@/features/workout/_lib/trace"
import { useI18n } from "@/hooks/use-i18n"
import { THEME } from "@/lib/theme"
import { useState } from "react"
import { StyleSheet, View, type LayoutChangeEvent } from "react-native"
import Svg, { Line, Polyline, Text as SvgText } from "react-native-svg"

const PLOT_HEIGHT = 112
const PLOT_PADDING = 6

type Attempt = {
  depthTrace?: number[]
  startedAtOffsetMs: number
  valid: boolean
}

type TracedAttempt = Pick<Attempt, "startedAtOffsetMs" | "valid"> & {
  values: number[]
}

const styles = StyleSheet.create({ plot: { height: PLOT_HEIGHT } })

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
  const total = 1 + attempts.reduce((sum, item) => sum + item.values.length, 0)
  let offset = 0
  let previousEnd: number | undefined

  return attempts.map((attempt) => {
    const values = connectTrace(attempt.values, previousEnd)
    const key = `${attempt.startedAtOffsetMs}:${attempt.values.length}`
    const points = toPolyline({ mapY, offset, total, values, width })
    previousEnd = values.at(-1)
    offset += attempt.values.length

    return { key, points, valid: attempt.valid }
  })
}

function getTracedAttempts(attempts: readonly Attempt[]) {
  return attempts.flatMap((attempt) => {
    const values = attempt.depthTrace

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

export function RepMotionChart({ attempts }: { attempts: readonly Attempt[] }) {
  const { t } = useI18n()
  const [width, setWidth] = useState(0)
  const traced = getTracedAttempts(attempts)

  if (traced.length === 0) return null

  const mapY = getDepthPlotY(traced)
  const targetY = mapY(0)
  const targetLabelY = targetY < 18 ? targetY + 14 : targetY - 6
  const lines = width > 0 ? toRepLines(traced, width, mapY) : []

  return (
    <View onLayout={getMeasure(setWidth)} style={styles.plot}>
      <Svg height={PLOT_HEIGHT} width={width}>
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
          {t("camera.targetDepth")}
        </SvgText>
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
