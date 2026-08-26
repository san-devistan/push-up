const MAXIMUM_DEPTH_METERS = 3
const MINIMUM_DEPTH_METERS = 0.08
const MINIMUM_SAMPLE_COUNT = 9

export type DepthBufferFormat = "android-depth-16" | "float-depth-32"

function getPixelBytes(format: DepthBufferFormat) {
  "worklet"
  return format === "float-depth-32" ? 4 : 2
}

function readMeters(view: DataView, offset: number, format: DepthBufferFormat) {
  "worklet"
  return format === "float-depth-32"
    ? view.getFloat32(offset, true)
    : (view.getUint16(offset, true) & 0x1fff) / 1000
}

function isUsableDepth(meters: number) {
  "worklet"
  return (
    Number.isFinite(meters) &&
    meters >= MINIMUM_DEPTH_METERS &&
    meters <= MAXIMUM_DEPTH_METERS
  )
}

function median(samples: number[]) {
  "worklet"
  samples.sort((left, right) => left - right)
  const middle = Math.floor(samples.length / 2)

  return samples.length % 2 === 0
    ? ((samples[middle - 1] ?? 0) + (samples[middle] ?? 0)) / 2
    : (samples[middle] ?? null)
}

export function getMedianDepthMeters({
  buffer,
  bytesPerRow,
  format,
  height,
  width,
}: {
  buffer: ArrayBuffer
  bytesPerRow: number
  format: DepthBufferFormat
  height: number
  width: number
}) {
  "worklet"

  const pixelBytes = getPixelBytes(format)
  const rowBytes = bytesPerRow > 0 ? bytesPerRow : width * pixelBytes
  const startX = Math.floor(width * 0.25)
  const endX = Math.ceil(width * 0.75)
  const startY = Math.floor(height * 0.2)
  const endY = Math.ceil(height * 0.8)
  const step = Math.max(1, Math.floor(Math.min(width, height) / 40))
  const view = new DataView(buffer)
  const samples: number[] = []

  for (let y = startY; y < endY; y += step) {
    for (let x = startX; x < endX; x += step) {
      const offset = y * rowBytes + x * pixelBytes
      if (offset + pixelBytes > buffer.byteLength) continue

      const meters = readMeters(view, offset, format)
      if (isUsableDepth(meters)) samples.push(meters)
    }
  }

  return samples.length >= MINIMUM_SAMPLE_COUNT ? median(samples) : null
}
