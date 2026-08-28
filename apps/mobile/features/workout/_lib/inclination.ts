export const PHONE_FLAT_TARGET_DEGREES = 90
export const PHONE_FLAT_TOLERANCE_DEGREES = 15

export type GravityVector = {
  x: number
  y: number
  z: number
}

export function getPhoneInclinationDegrees({ x, y, z }: GravityVector) {
  const magnitude = Math.hypot(x, y, z)

  return magnitude === 0
    ? null
    : (Math.acos(Math.max(-1, Math.min(1, -y / magnitude))) * 180) / Math.PI
}

export function isPhoneFlat(degrees: number) {
  return (
    Math.abs(degrees - PHONE_FLAT_TARGET_DEGREES) <=
    PHONE_FLAT_TOLERANCE_DEGREES
  )
}
