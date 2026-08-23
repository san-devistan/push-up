import { loadDeviceMotion } from "@/features/workout/_lib/device-motion"
import {
  getPhoneInclinationDegrees,
  isPhoneFlat,
} from "@/features/workout/_lib/inclination"
import { useEffect, useRef, useState } from "react"

const SENSOR_UPDATE_INTERVAL_MS = 200
const SMOOTHING_FACTOR = 0.25

type SensorSubscription = { remove: () => void }

export type PhoneInclinationDisplay =
  | { type: "checking" }
  | { type: "unavailable" }
  | { degrees: number; flat: boolean; type: "available" }

export function usePhoneInclination(enabled: boolean) {
  const [display, setDisplay] = useState<PhoneInclinationDisplay>({
    type: "checking",
  })
  const degrees = useRef<number | null>(null)
  const flat = useRef(true)

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
          const nextFlat = isPhoneFlat(smoothedDegrees)
          flat.current = nextFlat
          const roundedDegrees = Math.round(smoothedDegrees)
          setDisplay((current) =>
            current.type === "available" &&
            current.degrees === roundedDegrees &&
            current.flat === nextFlat
              ? current
              : {
                  degrees: roundedDegrees,
                  flat: nextFlat,
                  type: "available",
                }
          )
        }
      )
    }

    void subscribe().catch(() => {
      if (!active) return

      degrees.current = null
      flat.current = true
      setDisplay({ type: "unavailable" })
    })

    return () => {
      active = false
      subscription?.remove()
      degrees.current = null
      flat.current = true
    }
  }, [enabled])

  return { degrees, display, flat }
}
