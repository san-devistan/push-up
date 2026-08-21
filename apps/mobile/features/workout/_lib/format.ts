export function formatDuration(durationMs: number) {
  const totalSeconds = Math.round(durationMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export function formatClock(
  hour: number,
  minute: number,
  locale: string,
  clockFormat: "12" | "24"
) {
  const date = new Date(2000, 0, 1, hour, minute)

  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    hourCycle: clockFormat === "12" ? "h12" : "h23",
    minute: "2-digit",
  }).format(date)
}

export function formatCompact(value: number) {
  const compact = getCompactNumber(value)
  return `${compact.value}${compact.suffix}`
}

export function getCompactNumber(value: number) {
  return Math.abs(value) < 1000
    ? { suffix: "", value }
    : { suffix: "k", value: Number((value / 1000).toFixed(2)) }
}
