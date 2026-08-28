import { usePhoneInclination } from "@/features/workout/_hooks/use-phone-inclination"
import { useSessionClock } from "@/features/workout/_hooks/use-session-clock"
import {
  abandonActiveAttempt,
  createCounterState,
  getDepthGlowProgress,
  processDepthMeters,
  recordTrailingDepth,
  type CounterState,
  type WorkoutAttempt,
} from "@/features/workout/_lib/counter"
import {
  handleCompletedAttempt,
  notifySessionEnd,
} from "@/features/workout/_lib/feedback"
import type { TrainingHint } from "@/features/workout/_lib/setup"
import {
  createWorkoutSession,
  saveSession,
  type TrainingPlan,
  type WorkoutSession,
  type WorkoutStatus,
} from "@/features/workout/_lib/storage"
import { syncPendingSessions } from "@/features/workout/_lib/sync"
import {
  createTrackingIssueState,
  getActiveTrackingStatus,
  getTrackingFrame,
  TRACKING_LOSS_GRACE_MS,
} from "@/features/workout/_lib/tracking"
import type { TrackingObservation } from "@/features/workout/camera.types"
import { useI18n } from "@/hooks/use-i18n"
import { loopSfx, playSfx, stopSfx } from "@/lib/sfx"
import { api } from "@workspace/backend/api"
import { useMutation } from "convex/react"
import { useEffect, useRef, useState } from "react"

export type SessionPhase = "active" | "countdown" | "paused"

const INITIAL_COUNTER_STATE = createCounterState()
const INITIAL_TRACKING_ISSUE = createTrackingIssueState()
const COMPLETION_BUFFER_MS = 250
const TOAST_DURATION_MS = 1200

function clearToastTimeout(timeout: {
  current: ReturnType<typeof setTimeout> | null
}) {
  if (timeout.current) clearTimeout(timeout.current)
}

function showSessionToast(
  message: string,
  setToast: (message: string | null) => void,
  timeout: { current: ReturnType<typeof setTimeout> | null }
) {
  setToast(message)
  clearToastTimeout(timeout)
  timeout.current = setTimeout(() => setToast(null), TOAST_DURATION_MS)
}

function useCountdown({
  clock,
  counter,
  phase,
  planSoundEnabled,
  setCountdown,
  setPhase,
}: {
  clock: ReturnType<typeof useSessionClock>["clock"]
  counter: { current: CounterState }
  phase: SessionPhase
  planSoundEnabled: boolean
  setCountdown: (value: number) => void
  setPhase: (phase: SessionPhase) => void
}) {
  useEffect(() => {
    if (phase !== "countdown") return undefined

    let current = 3
    loopSfx("recording", planSoundEnabled)
    const interval = setInterval(() => {
      current -= 1
      if (current > 0) return setCountdown(current)

      clearInterval(interval)
      playSfx("start", planSoundEnabled)
      counter.current = createCounterState()
      clock.start()
      setPhase("active")
    }, 1000)

    return () => clearInterval(interval)
  }, [clock, counter, phase, planSoundEnabled, setCountdown, setPhase])
}

function toggleSessionPause({
  clock,
  phase,
  setPhase,
}: {
  clock: ReturnType<typeof useSessionClock>["clock"]
  phase: SessionPhase
  setPhase: (phase: SessionPhase) => void
}) {
  if (phase === "active") {
    clock.pause()
    setPhase("paused")
    stopSfx()
    return
  }

  if (phase === "paused") {
    clock.resume()
    setPhase("active")
  }
}

function processActiveFrame({
  counter,
  depthMeters,
  elapsedMs,
  onCompleted,
  poseVerified,
}: {
  counter: { current: CounterState }
  depthMeters: number
  elapsedMs: number
  onCompleted: (attempt: WorkoutAttempt, state: CounterState) => void
  poseVerified: boolean
}) {
  const result = processDepthMeters(
    counter.current,
    depthMeters,
    elapsedMs,
    poseVerified
  )
  counter.current = result.state

  if (result.event.type === "attempt-completed") {
    onCompleted(result.event.attempt, result.state)
  }
}

function useSessionCleanup({
  completionTimeout,
  finished,
  toastTimeout,
}: {
  completionTimeout: { current: ReturnType<typeof setTimeout> | null }
  finished: { current: boolean }
  toastTimeout: { current: ReturnType<typeof setTimeout> | null }
}) {
  const [cleanup] = useState(() => () => {
    if (!finished.current) stopSfx()
    if (completionTimeout.current) clearTimeout(completionTimeout.current)
    clearToastTimeout(toastTimeout)
  })

  useEffect(() => cleanup, [cleanup])
}

export function useSession({
  onComplete,
  plan,
  targetReps,
}: {
  onComplete: (session: WorkoutSession) => void
  plan: TrainingPlan
  targetReps: number
}) {
  "use no memo"

  const { t } = useI18n()
  const syncSession = useMutation(api.workoutSessions.sync)
  const [countdown, setCountdown] = useState(3)
  const [depthProgress, setDepthProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState<SessionPhase>("countdown")
  const [trackingHint, setTrackingHint] = useState<TrainingHint | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [validReps, setValidReps] = useState(0)
  const phoneInclination = usePhoneInclination(phase !== "paused")
  const { clock, elapsedMs } = useSessionClock(phase === "active")
  const completionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const counter = useRef(INITIAL_COUNTER_STATE)
  const finished = useRef(false)
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const trackingIssue = useRef(INITIAL_TRACKING_ISSUE)

  function finish(status: WorkoutStatus) {
    finished.current = true
    const endedAt = Date.now()
    const startedAt = clock.startedAt.current || endedAt
    const session = createWorkoutSession({
      counterState: counter.current,
      endedAt,
      plan,
      startedAt,
      status,
      targetReps,
      totalDurationMs: clock.getElapsed(endedAt),
    })

    notifySessionEnd(status, plan.soundEnabled)
    saveSession(session)
    void syncPendingSessions(syncSession)
    onComplete(session)
  }

  function complete(status: WorkoutStatus) {
    if (finished.current || completionTimeout.current) return

    if (status === "completed") {
      completionTimeout.current = setTimeout(() => {
        completionTimeout.current = null
        finish(status)
      }, COMPLETION_BUFFER_MS)
      return
    }

    finish(status)
  }

  function onObservation(observation: TrackingObservation) {
    const now = Date.now()
    const frame = getTrackingFrame(observation)
    const tracking = getActiveTrackingStatus(
      trackingIssue.current,
      phoneInclination.flat.current,
      frame.signals,
      now
    )
    trackingIssue.current = tracking.issueState

    setTrackingHint(
      phase === "active" && tracking.type === "issue" ? tracking.hint : null
    )

    if (phase !== "active") return

    if (
      tracking.type === "issue" &&
      tracking.elapsedMs > TRACKING_LOSS_GRACE_MS
    ) {
      setDepthProgress(0)
      counter.current = abandonActiveAttempt(counter.current)
      return
    }

    const depthMeters = frame.signals.depthMeters
    if (!phoneInclination.flat.current || depthMeters === null) return

    const currentElapsedMs = clock.getElapsed(now)
    setDepthProgress(getDepthGlowProgress(depthMeters))

    if (completionTimeout.current) {
      counter.current = recordTrailingDepth(
        counter.current,
        depthMeters,
        currentElapsedMs
      )
      return
    }

    processActiveFrame({
      counter,
      depthMeters,
      elapsedMs: currentElapsedMs,
      onCompleted: (attempt, state) =>
        handleCompletedAttempt({
          attempt,
          complete,
          didNotCount: t("feedback.didNotCount"),
          setValidReps,
          showToast: (message) =>
            showSessionToast(message, setToast, toastTimeout),
          soundEnabled: plan.soundEnabled,
          state,
          targetReps,
        }),
      poseVerified: frame.signals.poseVerified,
    })
  }

  function togglePause() {
    trackingIssue.current = createTrackingIssueState(Date.now())
    setDepthProgress(0)
    setTrackingHint(null)
    toggleSessionPause({ clock, phase, setPhase })
  }

  useCountdown({
    clock,
    counter,
    phase,
    planSoundEnabled: plan.soundEnabled,
    setCountdown,
    setPhase,
  })

  useSessionCleanup({ completionTimeout, finished, toastTimeout })
  return {
    countdown,
    depthProgress,
    elapsedMs,
    error,
    onCameraError: setError,
    onObservation,
    phase,
    stop: () => complete("stopped"),
    toast,
    trackingHint,
    togglePause,
    validReps,
  }
}
