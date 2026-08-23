export const RULER_TICK_COUNT = 31

const MIN_TICK_HEIGHT = 16
const MAX_TICK_HEIGHT = 64
const PEAK_WIDTH = 5

export function rulerIndexAt(
  position: number,
  width: number,
  itemCount: number
): number {
  const lastIndex = Math.max(0, itemCount - 1)
  if (width <= 0 || lastIndex === 0) return 0

  const progress = Math.min(Math.max(position / width, 0), 1)
  return Math.round(progress * lastIndex)
}

export function rulerLabelIndices(
  itemCount: number
): readonly [number, number, number] {
  const lastIndex = Math.max(0, itemCount - 1)
  return [0, Math.round(lastIndex / 2), lastIndex]
}

export function rulerTickHeight(
  tickIndex: number,
  selectedIndex: number,
  itemCount: number
): number {
  const selectedProgress = selectedIndex / Math.max(1, itemCount - 1)
  const tickProgress = tickIndex / (RULER_TICK_COUNT - 1)
  const strength = Math.max(
    0,
    1 - Math.abs(tickProgress - selectedProgress) * PEAK_WIDTH
  )

  return Math.round(
    MIN_TICK_HEIGHT + (MAX_TICK_HEIGHT - MIN_TICK_HEIGHT) * strength * strength
  )
}
