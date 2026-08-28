import { useEffect, useState } from "react"
import { useReducedMotion } from "react-native-reanimated"

export function useDelayedValue<T>(value: T, delay: number) {
  const reducedMotion = useReducedMotion()
  const [delayedValue, setDelayedValue] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(
      () => setDelayedValue(value),
      reducedMotion ? 0 : delay
    )

    return () => clearTimeout(timeout)
  }, [delay, reducedMotion, value])

  return delayedValue
}
