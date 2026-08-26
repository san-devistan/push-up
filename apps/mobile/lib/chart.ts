import { useCSSVariable } from "uniwind"

const FALLBACK_SERIES = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"]
const MAGNITUDES = ["k", "M", "B", "T"] as const

export type SeriesColorIndex = 1 | 2 | 3 | 4 | 5

export interface Plot {
  width: number
  height: number
  left: number
  top: number
}

export function useSeriesColor(
  explicit: string | undefined,
  index: SeriesColorIndex
): string {
  const token = useCSSVariable(`--color-chart-${index}`)
  return (
    explicit ?? (typeof token === "string" ? token : FALLBACK_SERIES[index - 1])
  )
}

function trimZeros(text: string): string {
  return text.includes(".") ? text.replace(/\.?0+$/, "") : text
}

function mantissa(value: number): string {
  return trimZeros(value.toFixed(Math.abs(value) < 10 ? 1 : 0))
}

export function compactNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value)

  const abs = Math.abs(value)
  if (abs < 1_000) {
    if (Number.isInteger(value)) return String(value)
    return trimZeros(value.toFixed(abs < 1 ? 2 : 1))
  }

  let index = 0
  let scaled = value / 1_000
  while (Math.abs(scaled) >= 1_000 && index < MAGNITUDES.length - 1) {
    scaled /= 1_000
    index += 1
  }

  let text = mantissa(scaled)
  if (Math.abs(Number(text)) >= 1_000 && index < MAGNITUDES.length - 1) {
    index += 1
    text = mantissa(scaled / 1_000)
  }

  return `${text}${MAGNITUDES[index]}`
}

export function bandOf(index: number, total: number, plot: Plot): number {
  "worklet"
  if (total <= 0) return plot.left + plot.width / 2
  const width = plot.width / total
  return plot.left + width * (index + 0.5)
}

export function barPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  towards: "up" | "down" | "left" | "right"
): string {
  "worklet"
  if (width <= 0 || height <= 0) return ""
  const r = Math.max(0, Math.min(radius, width / 2, height / 2))
  const right = x + width
  const bottom = y + height

  if (towards === "up") {
    return (
      `M${x},${bottom}L${x},${y + r}Q${x},${y} ${x + r},${y}` +
      `L${right - r},${y}Q${right},${y} ${right},${y + r}L${right},${bottom}Z`
    )
  }
  if (towards === "down") {
    return (
      `M${x},${y}L${x},${bottom - r}Q${x},${bottom} ${x + r},${bottom}` +
      `L${right - r},${bottom}Q${right},${bottom} ${right},${bottom - r}L${right},${y}Z`
    )
  }
  if (towards === "right") {
    return (
      `M${x},${y}L${right - r},${y}Q${right},${y} ${right},${y + r}` +
      `L${right},${bottom - r}Q${right},${bottom} ${right - r},${bottom}L${x},${bottom}Z`
    )
  }
  return (
    `M${right},${y}L${x + r},${y}Q${x},${y} ${x},${y + r}` +
    `L${x},${bottom - r}Q${x},${bottom} ${x + r},${bottom}L${right},${bottom}Z`
  )
}

export function columnValues(
  data: Record<string, unknown>[],
  key: string
): (number | null)[] {
  "worklet"
  return data.map((row) => {
    const value = row[key]
    return typeof value === "number" && !Number.isNaN(value) ? value : null
  })
}
