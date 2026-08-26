import { usePhoneInclination } from "@/features/workout/_hooks/use-phone-inclination"
import { useSessionClock } from "@/features/workout/_hooks/use-session-clock"
import {
  abandonActiveAttempt,
  createCounterState,
  getPushupDepthProgress,
  processDepthRatio,
  recordTrackingLoss,
  type CounterState,
  type WorkoutAttempt,
} from "@/features/workout/_lib/counter"
import {
  handleCompletedAttempt,
  notifySessionEnd,
} from "@/features/workout/_lib/feedback"
import type { SetupFraming, TrainingHint } from "@/features/workout/_lib/setup"
import {
  createWorkoutSession,
  saveSession,
  type TrainingPlan,
  type WorkoutSession,
  type WorkoutStatus,
} from "@/features/workout/_lib/storage"
import { syncPendingSessions } from "@/features/workout/_lib/sync"
import {
  createTrackingCalibration,
  finishTrackingCalibration,
  getActiveTrackingStatus,
  getTrackingFrame,
  sampleTrackingCalibration,
  TRACKING_CALIBRATION_DURATION_MS,
  TRACKING_LOSS_GRACE_MS,
  type TrackingCalibration,
  type TrackingScales,
} from "@/features/workout/_lib/tracking"
import type { TrackingObservation } from "@/features/workout/camera.types"
import { useI18n } from "@/hooks/use-i18n"
import { loopSfx, playSfx, stopSfx } from "@/lib/sfx"
import { api } from "@workspace/backend/api"
import { useMutation } from "convex/react"
import { useEffect, useRef, useState } from "react"

export type SessionPhase = "active" | "countdown" | "paused" | "positioning"

const COUNTDOWN_TRACKING_GRACE_MS = 500
const INITIAL_COUNTER_STATE = createCounterState()
const INITIAL_TRACKING_CALIBRATION = createTrackingCalibration()
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
  calibration,
  clock,
  counter,
  lastTrackingAt,
  phase,
  planSoundEnabled,
  readySince,
  setCountdown,
  setPhase,
  topScales,
}: {
  calibration: { current: TrackingCalibration }
  clock: ReturnType<typeof useSessionClock>["clock"]
  counter: { current: CounterState }
  lastTrackingAt: { current: number }
  phase: SessionPhase
  planSoundEnabled: boolean
  readySince: { current: number | null }
  setCountdown: (value: number) => void
  setPhase: (phase: SessionPhase) => void
  topScales: { current: TrackingScales | null }
}) {
  useEffect(() => {
    if (phase !== "countdown") return undefined

    let current = 3
    loopSfx("recording", planSoundEnabled)
    const interval = setInterval(() => {
      if (
        readySince.current === null ||
        Date.now() - lastTrackingAt.current > COUNTDOWN_TRACKING_GRACE_MS
      ) {
        clearInterval(interval)
        stopSfx()
        calibration.current = createTrackingCalibration()
        readySince.current = null
        topScales.current = null
        setCountdown(3)
        setPhase("positioning")
        return
      }

      current -= 1
      if (current > 0) {
        setCountdown(current)
        return
      }

      clearInterval(interval)
      playSfx("start", planSoundEnabled)
      counter.current = createCounterState()
      clock.start()
      setPhase("active")
    }, 1000)

    return () => clearInterval(interval)
  }, [
    calibration,
    clock,
    counter,
    lastTrackingAt,
    phase,
    planSoundEnabled,
    readySince,
    setCountdown,
    setPhase,
    topScales,
  ])
}

function toggleSessionPause({
  clock,
  lastTrackingAt,
  phase,
  setPhase,
}: {
  clock: ReturnType<typeof useSessionClock>["clock"]
  lastTrackingAt: { current: number }
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
    lastTrackingAt.current = Date.now()
    setPhase("active")
  }
}

function processActiveFrame({
  counter,
  depthRatio,
  elapsedMs,
  onCompleted,
  poseVerified,
}: {
  counter: { current: CounterState }
  depthRatio: number
  elapsedMs: number
  onCompleted: (attempt: WorkoutAttempt, state: CounterState) => void
  poseVerified: boolean
}) {
  const result = processDepthRatio(
    counter.current,
    depthRatio,
    elapsedMs,
    poseVerified
  )
  counter.current = result.state

  if (result.event.type === "attempt-completed") {
    onCompleted(result.event.attempt, result.state)
  }
}

function useSessionCleanup({
  finished,
  toastTimeout,
}: {
  finished: { current: boolean }
  toastTimeout: { current: ReturnType<typeof setTimeout> | null }
}) {
  const [cleanup] = useState(() => () => {
    if (!finished.current) stopSfx()
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
  const [phase, setPhase] = useState<SessionPhase>("positioning")
  const [setupFraming, setSetupFraming] = useState<SetupFraming>("unknown")
  const [trackingHint, setTrackingHint] = useState<TrainingHint | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [validReps, setValidReps] = useState(0)
  const phoneInclination = usePhoneInclination(phase !== "paused")
  const { clock, elapsedMs } = useSessionClock(phase === "active")
  const calibration = useRef(INITIAL_TRACKING_CALIBRATION)
  const counter = useRef(INITIAL_COUNTER_STATE)
  const finished = useRef(false)
  const lastDepthRatio = useRef<number | null>(null)
  const lastSignalSeenAt = useRef({ body: 0, depth: 0 })
  const lastTrackingAt = useRef(0)
  const lastTrackingElapsedMs = useRef(0)
  const readySince = useRef<number | null>(null)
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const topScales = useRef<TrackingScales | null>(null)
  function complete(status: WorkoutStatus, counterState?: CounterState) {
    if (finished.current) return

    finished.current = true
    const endedAt = Date.now()
    const startedAt = clock.startedAt.current || endedAt
    const session = createWorkoutSession({
      counterState: counterState ?? counter.current,
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

  const showToast = (message: string) =>
    showSessionToast(message, setToast, toastTimeout)

  function resetPositioning() {
    calibration.current = createTrackingCalibration()
    lastDepthRatio.current = null
    readySince.current = null
    topScales.current = null
    setCountdown(3)
    setPhase("positioning")
  }

  function handleTrackingIssue(trackingIssueMs: number) {
    setDepthProgress(0)
    readySince.current = null

    if (phase === "countdown") {
      stopSfx()
      resetPositioning()
      return
    }

    if (phase !== "active") return

    counter.current = recordTrackingLoss(
      counter.current,
      lastTrackingElapsedMs.current
    )
    if (trackingIssueMs > TRACKING_LOSS_GRACE_MS) {
      counter.current = abandonActiveAttempt(counter.current)
      lastDepthRatio.current = null
    }
  }

  function onObservation(observation: TrackingObservation) {
    const now = Date.now()
    const { ratios, scales, setup } = getTrackingFrame(
      observation,
      topScales.current,
      phoneInclination.flat.current,
      lastDepthRatio.current
    )
    const tracking = getActiveTrackingStatus(
      lastSignalSeenAt.current,
      lastTrackingAt.current,
      phoneInclination.flat.current,
      ratios,
      now
    )
    lastSignalSeenAt.current = tracking.signalSeenAt

    setSetupFraming(tracking.depthRatio === null ? setup.framing : "ready")

    if (phase !== "positioning") {
      if (tracking.type === "issue") {
        setTrackingHint(tracking.hint)
        handleTrackingIssue(tracking.elapsedMs)
        return
      }

      lastTrackingAt.current = now
      lastDepthRatio.current = tracking.depthRatio
      setTrackingHint(null)

      if (phase === "countdown") return

      const currentElapsedMs = clock.getElapsed(now)
      lastTrackingElapsedMs.current = currentElapsedMs

      if (phase === "paused") return

      setDepthProgress(getPushupDepthProgress(tracking.depthRatio))
      processActiveFrame({
        counter,
        depthRatio: tracking.depthRatio,
        elapsedMs: currentElapsedMs,
        onCompleted: (attempt, state) =>
          handleCompletedAttempt({
            attempt,
            complete,
            didNotCount: t("feedback.didNotCount"),
            setValidReps,
            showToast,
            soundEnabled: plan.soundEnabled,
            state,
            targetReps,
          }),
        poseVerified: true,
      })
      return
    }

    if (!setup.valid) {
      handleTrackingIssue(0)
      return
    }

    lastTrackingAt.current = now
    setTrackingHint(null)

    if (readySince.current === null) {
      readySince.current = now
      calibration.current = sampleTrackingCalibration(
        createTrackingCalibration(),
        scales
      )
      return
    }

    calibration.current = sampleTrackingCalibration(calibration.current, scales)
    if (now - readySince.current < TRACKING_CALIBRATION_DURATION_MS) return

    const calibrated = finishTrackingCalibration(calibration.current)
    if (calibrated === null) {
      readySince.current = null
      return
    }

    topScales.current = calibrated
    lastDepthRatio.current = 1
    setCountdown(3)
    setPhase("countdown")
  }

  function togglePause() {
    lastSignalSeenAt.current = { body: Date.now(), depth: Date.now() }
    setDepthProgress(0)
    setTrackingHint(null)
    toggleSessionPause({ clock, lastTrackingAt, phase, setPhase })
  }

  useCountdown({
    calibration,
    clock,
    counter,
    lastTrackingAt,
    phase,
    planSoundEnabled: plan.soundEnabled,
    readySince,
    setCountdown,
    setPhase,
    topScales,
  })

  useSessionCleanup({ finished, toastTimeout })
  return {
    countdown,
    depthProgress,
    elapsedMs,
    error,
    onCameraError: setError,
    onObservation,
    phase,
    phoneInclination: phoneInclination.display,
    setupFraming,
    stop: () => complete("stopped"),
    toast,
    trackingHint,
    togglePause,
    validReps,
  }
}
