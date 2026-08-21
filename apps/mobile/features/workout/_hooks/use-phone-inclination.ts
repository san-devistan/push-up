import { loadDeviceMotion } from "@/features/workout/_lib/device-motion"
import {
  getPhoneInclinationDegrees,
  MAX_PHONE_INCLINATION_DEGREES,
} from "@/features/workout/_lib/inclination"
import { useEffect, useRef, useState } from "react"

const SENSOR_UPDATE_INTERVAL_MS = 200
const SMOOTHING_FACTOR = 0.25

type SensorSubscription = { remove: () => void }

export type PhoneInclinationDisplay =
  | { type: "checking" }
  | { type: "unavailable" }
  | { degrees: number; type: "available"; upright: boolean }

export function usePhoneInclination(enabled: boolean) {
  const [display, setDisplay] = useState<PhoneInclinationDisplay>({
    type: "checking",
  })
  const degrees = useRef<number | null>(null)
  const upright = useRef(true)

  useEffect(() => {
    if (!enabled) return undefined

    let active = true
    let smoothedDegrees: number | null = null
    let subscription: SensorSubscription | null = null

    async function subscribe() {
      const DeviceMotion = await loadDeviceMotion()
      if (!DeviceMotion) {
        if (active) setDisplay({ type: "unavailable" })
        return
      }

      const available = await DeviceMotion.isAvailableAsync()
      if (!active) return
      if (!available) {
        setDisplay({ type: "unavailable" })
        return
      }

      DeviceMotion.setUpdateInterval(SENSOR_UPDATE_INTERVAL_MS)
      subscription = DeviceMotion.addListener(
        ({ accelerationIncludingGravity }) => {
          if (!active) return

          const measuredDegrees = getPhoneInclinationDegrees(
            accelerationIncludingGravity
          )
          if (measuredDegrees === null) return

          smoothedDegrees =
            smoothedDegrees === null
              ? measuredDegrees
              : smoothedDegrees +
                (measuredDegrees - smoothedDegrees) * SMOOTHING_FACTOR
          degrees.current = smoothedDegrees
          const nextUpright = smoothedDegrees <= MAX_PHONE_INCLINATION_DEGREES
          upright.current = nextUpright
          const roundedDegrees = Math.round(smoothedDegrees)
          setDisplay((current) =>
            current.type === "available" &&
            current.degrees === roundedDegrees &&
            current.upright === nextUpright
              ? current
              : {
                  degrees: roundedDegrees,
                  type: "available",
                  upright: nextUpright,
                }
          )
        }
      )
    }

    void subscribe().catch(() => {
      if (!active) return

      degrees.current = null
      upright.current = true
      setDisplay({ type: "unavailable" })
    })

    return () => {
      active = false
      subscription?.remove()
      degrees.current = null
      upright.current = true
    }
  }, [enabled])

  return { degrees, display, upright }
}
