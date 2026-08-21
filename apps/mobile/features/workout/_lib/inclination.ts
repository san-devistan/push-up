import type { SetupState } from "./setup.ts"

export const MAX_PHONE_INCLINATION_DEGREES = 20

type GravityVector = {
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

export function requireUprightPhone(
  setup: SetupState,
  phoneUpright: boolean
): SetupState {
  return setup.valid && !phoneUpright
    ? { ...setup, hint: "tiltPhone", valid: false }
    : setup
}
