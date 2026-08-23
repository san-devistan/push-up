import { usePhoneInclination } from "@/features/workout/_hooks/use-phone-inclination"
import { useSessionClock } from "@/features/workout/_hooks/use-session-clock"
import {
  abandonActiveAttempt,
  createCounterState,
  processFaceScale,
  recordTrackingLoss,
  type CounterState,
  type WorkoutAttempt,
} from "@/features/workout/_lib/counter"
import {
  handleCompletedAttempt,
  notifySessionEnd,
  speak,
  stopSpeech,
} from "@/features/workout/_lib/feedback"
import { requireFlatPhone } from "@/features/workout/_lib/inclination"
import {
  getFaceScale,
  getFaceSetupState,
  type SetupFraming,
} from "@/features/workout/_lib/setup"
import {
  createWorkoutSession,
  saveSession,
  type TrainingPlan,
  type WorkoutSession,
  type WorkoutStatus,
} from "@/features/workout/_lib/storage"
import { syncPendingSessions } from "@/features/workout/_lib/sync"
import type { FaceObservation } from "@/features/workout/camera.types"
import { useI18n } from "@/hooks/use-i18n"
import { translate } from "@/lib/i18n"
import { api } from "@workspace/backend/api"
import { useMutation } from "convex/react"
import { useEffect, useRef, useState } from "react"

export type SessionPhase = "active" | "countdown" | "paused" | "positioning"

const CALIBRATION_DURATION_MS = 1000
const COUNTDOWN_TRACKING_GRACE_MS = 500
const GUIDANCE_TOAST_INTERVAL_MS = 1800
const INITIAL_COUNTER_STATE = createCounterState()
const TRACKING_LOSS_GRACE_MS = 1500
const TRACKING_TOAST_GRACE_MS = 2200
const TOAST_DURATION_MS = 1200

type Calibration = { count: number; total: number }

function clearToastTimeout(timeout: {
  current: ReturnType<typeof setTimeout> | null
}) {
  if (timeout.current) clearTimeout(timeout.current)
}

function useCountdown({
  calibration,
  clock,
  counter,
  language,
  lastFaceAt,
  locale,
  phase,
  planSoundEnabled,
  readySince,
  setCountdown,
  setPhase,
  topScale,
}: {
  calibration: { current: Calibration }
  clock: ReturnType<typeof useSessionClock>["clock"]
  counter: { current: CounterState }
  language: Parameters<typeof translate>[0]
  lastFaceAt: { current: number }
  locale: string
  phase: SessionPhase
  planSoundEnabled: boolean
  readySince: { current: number | null }
  setCountdown: (value: number) => void
  setPhase: (phase: SessionPhase) => void
  topScale: { current: number | null }
}) {
  useEffect(() => {
    if (phase !== "countdown") return undefined

    let current = 3
    void speak(String(current), planSoundEnabled, locale)
    const interval = setInterval(() => {
      if (
        readySince.current === null ||
        Date.now() - lastFaceAt.current > COUNTDOWN_TRACKING_GRACE_MS
      ) {
        clearInterval(interval)
        void stopSpeech()
        calibration.current = { count: 0, total: 0 }
        readySince.current = null
        topScale.current = null
        setCountdown(3)
        setPhase("positioning")
        return
      }

      current -= 1
      if (current > 0) {
        setCountdown(current)
        void speak(String(current), planSoundEnabled, locale)
        return
      }

      clearInterval(interval)
      void speak(translate(language, "feedback.go"), planSoundEnabled, locale)
      counter.current = createCounterState()
      clock.start()
      setPhase("active")
    }, 1000)

    return () => clearInterval(interval)
  }, [
    calibration,
    clock,
    counter,
    language,
    lastFaceAt,
    locale,
    phase,
    planSoundEnabled,
    readySince,
    setCountdown,
    setPhase,
    topScale,
  ])
}

function toggleSessionPause({
  clock,
  lastFaceAt,
  phase,
  setPhase,
}: {
  clock: ReturnType<typeof useSessionClock>["clock"]
  lastFaceAt: { current: number }
  phase: SessionPhase
  setPhase: (phase: SessionPhase) => void
}) {
  if (phase === "active") {
    clock.pause()
    setPhase("paused")
    void stopSpeech()
    return
  }

  if (phase === "paused") {
    clock.resume()
    lastFaceAt.current = Date.now()
    setPhase("active")
  }
}

function showGuidanceToast({
  lastGuidanceToast,
  lastGuidanceToastAt,
  message,
  now,
  showToast,
}: {
  lastGuidanceToast: { current: string | null }
  lastGuidanceToastAt: { current: number }
  message: string
  now: number
  showToast: (message: string) => void
}) {
  if (
    lastGuidanceToast.current === message &&
    now - lastGuidanceToastAt.current < GUIDANCE_TOAST_INTERVAL_MS
  ) {
    return
  }

  lastGuidanceToast.current = message
  lastGuidanceToastAt.current = now
  showToast(message)
}

function processActiveFrame({
  counter,
  elapsedMs,
  faceScale,
  onCompleted,
  topScale,
}: {
  counter: { current: CounterState }
  elapsedMs: number
  faceScale: number
  onCompleted: (attempt: WorkoutAttempt, state: CounterState) => void
  topScale: number
}) {
  const result = processFaceScale(
    counter.current,
    faceScale,
    topScale,
    elapsedMs
  )
  counter.current = result.state

  if (result.event.type === "attempt-completed") {
    onCompleted(result.event.attempt, result.state)
  }
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

  const { language, locale, t } = useI18n()
  const syncSession = useMutation(api.workoutSessions.sync)
  const [countdown, setCountdown] = useState(3)
  const [error, setError] = useState<string | null>(null)
  const [faceTracked, setFaceTracked] = useState(false)
  const [phase, setPhase] = useState<SessionPhase>("positioning")
  const [setupFraming, setSetupFraming] = useState<SetupFraming>("unknown")
  const [toast, setToast] = useState<string | null>(null)
  const [validReps, setValidReps] = useState(0)
  const phoneInclination = usePhoneInclination(
    phase === "positioning" || phase === "countdown"
  )
  const { clock, elapsedMs } = useSessionClock(phase === "active")
  const calibration = useRef<Calibration>({ count: 0, total: 0 })
  const counter = useRef(INITIAL_COUNTER_STATE)
  const finished = useRef(false)
  const lastFaceAt = useRef(0)
  const lastFaceElapsedMs = useRef(0)
  const lastGuidanceToast = useRef<string | null>(null)
  const lastGuidanceToastAt = useRef(0)
  const readySince = useRef<number | null>(null)
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const topScale = useRef<number | null>(null)

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

    notifySessionEnd(
      status,
      plan.soundEnabled,
      t("feedback.goalComplete"),
      locale
    )
    saveSession(session)
    void syncPendingSessions(syncSession)
    onComplete(session)
  }

  function showToast(message: string) {
    setToast(message)
    clearToastTimeout(toastTimeout)
    toastTimeout.current = setTimeout(() => setToast(null), TOAST_DURATION_MS)
  }

  function resetPositioning() {
    calibration.current = { count: 0, total: 0 }
    readySince.current = null
    topScale.current = null
    setCountdown(3)
    setPhase("positioning")
  }

  function handleMissingFace(now: number) {
    setFaceTracked(false)
    readySince.current = null

    if (phase === "countdown") {
      void stopSpeech()
      resetPositioning()
      return
    }

    if (phase !== "active") return

    counter.current = recordTrackingLoss(
      counter.current,
      lastFaceElapsedMs.current
    )
    if (now - lastFaceAt.current > TRACKING_LOSS_GRACE_MS) {
      counter.current = abandonActiveAttempt(counter.current)
    }
    if (now - lastFaceAt.current > TRACKING_TOAST_GRACE_MS) {
      showGuidanceToast({
        lastGuidanceToast,
        lastGuidanceToastAt,
        message: t("hint.faceCamera"),
        now,
        showToast,
      })
    }
  }

  function onFace(face: FaceObservation | null) {
    const now = Date.now()
    const faceScale = getFaceScale(face)
    const faceSetup = getFaceSetupState(face, faceScale)
    const trackedScale = faceSetup.framing === "off-center" ? null : faceScale

    if (trackedScale === null) {
      setSetupFraming(faceSetup.framing)
      handleMissingFace(now)
      return
    }

    setFaceTracked(true)
    lastFaceAt.current = now
    lastGuidanceToast.current = null

    if (phase === "paused") {
      lastFaceElapsedMs.current = clock.getElapsed(now)
      return
    }

    if (phase === "active") {
      const calibratedTopScale = topScale.current
      if (calibratedTopScale === null) return

      const currentElapsedMs = clock.getElapsed(now)
      lastFaceElapsedMs.current = currentElapsedMs
      processActiveFrame({
        counter,
        elapsedMs: currentElapsedMs,
        faceScale: trackedScale,
        onCompleted: (attempt, state) =>
          handleCompletedAttempt({
            attempt,
            complete,
            didNotCount: t("feedback.didNotCount"),
            setValidReps,
            showToast,
            soundEnabled: plan.soundEnabled,
            speechLanguage: locale,
            state,
            targetReps,
          }),
        topScale: calibratedTopScale,
      })
      return
    }

    const setup = requireFlatPhone(faceSetup, phoneInclination.flat.current)
    setSetupFraming(setup.framing)

    if (!setup.valid) {
      if (phase === "countdown") void stopSpeech()
      resetPositioning()
      return
    }

    if (phase === "countdown") return

    if (readySince.current === null) {
      readySince.current = now
      calibration.current = { count: 1, total: trackedScale }
      return
    }

    calibration.current.count += 1
    calibration.current.total += trackedScale
    if (now - readySince.current < CALIBRATION_DURATION_MS) return

    topScale.current = calibration.current.total / calibration.current.count
    setCountdown(3)
    setPhase("countdown")
  }

  function togglePause() {
    toggleSessionPause({ clock, lastFaceAt, phase, setPhase })
  }

  useCountdown({
    calibration,
    clock,
    counter,
    language,
    lastFaceAt,
    locale,
    phase,
    planSoundEnabled: plan.soundEnabled,
    readySince,
    setCountdown,
    setPhase,
    topScale,
  })

  useEffect(() => {
    return () => {
      if (!finished.current) void stopSpeech()
      clearToastTimeout(toastTimeout)
    }
  }, [])

  return {
    countdown,
    elapsedMs,
    error,
    faceTracked,
    onCameraError: setError,
    onFace,
    phase,
    phoneInclination: phoneInclination.display,
    setupFraming,
    stop: () => complete("stopped"),
    toast,
    togglePause,
    validReps,
  }
}
