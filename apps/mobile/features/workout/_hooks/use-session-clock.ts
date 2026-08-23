import { useEffect, useRef, useState } from "react"

function getElapsedMs({
  now,
  pausedAt,
  pausedDurationMs,
  startedAt,
}: {
  now: number
  pausedAt: number | null
  pausedDurationMs: number
  startedAt: number
}) {
  if (startedAt === 0) return 0

  return Math.max(
    0,
    now -
      startedAt -
      pausedDurationMs -
      (pausedAt === null ? 0 : now - pausedAt)
  )
}

export function useSessionClock(active: boolean) {
  const [elapsedMs, setElapsedMs] = useState(0)
  const pausedAt = useRef<number | null>(null)
  const pausedDurationMs = useRef(0)
  const startedAt = useRef(0)
  const [clock] = useState(() => {
    function getElapsed(now: number) {
      return getElapsedMs({
        now,
        pausedAt: pausedAt.current,
        pausedDurationMs: pausedDurationMs.current,
        startedAt: startedAt.current,
      })
    }

    return {
      getElapsed,
      pause() {
        const now = Date.now()
        pausedAt.current = now
        setElapsedMs(getElapsed(now))
      },
      resume() {
        if (pausedAt.current === null) return

        pausedDurationMs.current += Date.now() - pausedAt.current
        pausedAt.current = null
      },
      start() {
        pausedAt.current = null
        pausedDurationMs.current = 0
        startedAt.current = Date.now()
        setElapsedMs(0)
      },
      startedAt,
    }
  })

  useEffect(() => {
    if (!active) return undefined

    const interval = setInterval(
      () => setElapsedMs(clock.getElapsed(Date.now())),
      100
    )
    return () => clearInterval(interval)
  }, [active, clock])

  return { clock, elapsedMs }
}
