export const START_BUTTON_HEIGHT = 56

export function getStartButtonBottom(bottomInset: number) {
  return Math.max(bottomInset - 16, 12)
}
