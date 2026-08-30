import { COUNTER_THRESHOLDS } from "@/features/workout/_lib/counter"
import { useState } from "react"
import { StyleSheet, View, type LayoutChangeEvent } from "react-native"
import Svg, { Line, Polyline } from "react-native-svg"

const PLOT_HEIGHT = 112
const PLOT_PADDING = 6

type Attempt = {
  depthTrace?: number[]
  depthTraceOffsetsMs?: number[]
  durationMs: number
  startedAtOffsetMs: number
}

type TraceSample = { atOffsetMs: number; depthMeters: number }

const styles = StyleSheet.create({ plot: { height: PLOT_HEIGHT } })

function toPolyline({
  mapY,
  samples,
  width,
}: {
  mapY: (value: number) => number
  samples: readonly TraceSample[]
  width: number
}) {
  const start = samples[0]?.atOffsetMs ?? 0
  const duration = Math.max(1, (samples.at(-1)?.atOffsetMs ?? start) - start)

  return samples
    .map((sample) => {
      const x = ((sample.atOffsetMs - start) / duration) * width
      return `${x.toFixed(1)},${mapY(sample.depthMeters).toFixed(1)}`
    })
    .join(" ")
}

function getTraceSamples(attempts: readonly Attempt[]) {
  return attempts.flatMap((attempt) => {
    const values = attempt.depthTrace

    if (!values || values.length < 2) return []

    const offsets = attempt.depthTraceOffsetsMs
    const hasTimedDepth = offsets?.length === values.length

    return values.map((value, index) => ({
      atOffsetMs: hasTimedDepth
        ? (offsets[index] ?? attempt.startedAtOffsetMs)
        : attempt.startedAtOffsetMs +
          (attempt.durationMs * index) / Math.max(1, values.length - 1),
      depthMeters: hasTimedDepth
        ? value
        : COUNTER_THRESHOLDS.bottomMeters - value,
    }))
  })
}

function getDepthPlotY(samples: readonly TraceSample[]) {
  const values = [
    COUNTER_THRESHOLDS.bottomMeters,
    ...samples.map((sample) => sample.depthMeters),
  ]
  const minimum = Math.min(...values)
  const maximum = Math.max(...values)
  const padding = Math.max((maximum - minimum) * 0.1, 0.02)
  const span = maximum - minimum + padding * 2

  return (value: number) =>
    PLOT_PADDING +
    ((maximum + padding - value) / span) * (PLOT_HEIGHT - PLOT_PADDING * 2)
}

function getMeasure(setWidth: (width: number) => void) {
  return (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)
}

export function RepMotionChart({
  attempts,
  color,
}: {
  attempts: readonly Attempt[]
  color: string
}) {
  const [width, setWidth] = useState(0)
  const samples = getTraceSamples(attempts)

  if (samples.length < 2) return null

  const mapY = getDepthPlotY(samples)
  const targetY = mapY(COUNTER_THRESHOLDS.bottomMeters)
  const points = width > 0 ? toPolyline({ mapY, samples, width }) : ""

  return (
    <View onLayout={getMeasure(setWidth)} style={styles.plot}>
      <Svg height={PLOT_HEIGHT} width={width}>
        <Line
          stroke={color}
          strokeDasharray="4 5"
          strokeOpacity={0.35}
          strokeWidth={1}
          x1={0}
          x2={width}
          y1={targetY}
          y2={targetY}
        />
        {points ? (
          <Polyline
            fill="none"
            points={points}
            stroke={color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
          />
        ) : null}
      </Svg>
    </View>
  )
}
