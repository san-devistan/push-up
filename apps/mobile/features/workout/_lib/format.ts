export function formatDuration(durationMs: number) {
  const totalSeconds = Math.round(durationMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export function formatSeconds(durationMs: number) {
  return `${(durationMs / 1000).toFixed(1)}s`
}

export function formatClock(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

export function formatCompact(value: number) {
  return value >= 10_000
    ? `${Math.round(value / 1000).toLocaleString()}K`
    : value.toLocaleString()
}
