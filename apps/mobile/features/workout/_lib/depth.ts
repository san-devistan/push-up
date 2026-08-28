const MAXIMUM_DEPTH_METERS = 0.7
const MINIMUM_DEPTH_METERS = 0
const MINIMUM_USABLE_SAMPLE_RATIO = 0.1

export type DepthBufferFormat = "android-depth-16" | "float-depth-32"

export type DepthMeasurement = {
  distanceMeters: number | null
  sampleCount: number
  sampleRegion: {
    endX: number
    endY: number
    startX: number
    startY: number
    step: number
  }
  usableSampleCount: number
}

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

type DepthBuffer = {
  buffer: ArrayBuffer
  bytesPerRow: number
  format: DepthBufferFormat
  height: number
  width: number
}

export function getDepthMeasurement({
  buffer,
  bytesPerRow,
  format,
  height,
  width,
}: DepthBuffer): DepthMeasurement {
  "worklet"

  const pixelBytes = getPixelBytes(format)
  const rowBytes = bytesPerRow > 0 ? bytesPerRow : width * pixelBytes
  const startX = 0
  const endX = width
  const startY = 0
  const endY = height
  const step = Math.max(1, Math.floor(Math.min(width, height) / 40))
  const view = new DataView(buffer)
  let sampleCount = 0
  const usableSamples: number[] = []

  for (let y = startY; y < endY; y += step) {
    for (let x = startX; x < endX; x += step) {
      const offset = y * rowBytes + x * pixelBytes
      if (offset + pixelBytes > buffer.byteLength) continue

      const meters = readMeters(view, offset, format)
      sampleCount += 1
      if (isUsableDepth(meters)) usableSamples.push(meters)
    }
  }

  return {
    distanceMeters:
      usableSamples.length >=
      Math.max(1, Math.ceil(sampleCount * MINIMUM_USABLE_SAMPLE_RATIO))
        ? median(usableSamples)
        : null,
    sampleCount,
    sampleRegion: { endX, endY, startX, startY, step },
    usableSampleCount: usableSamples.length,
  }
}

export function getMedianDepthMeters(buffer: DepthBuffer) {
  "worklet"
  return getDepthMeasurement(buffer).distanceMeters
}
