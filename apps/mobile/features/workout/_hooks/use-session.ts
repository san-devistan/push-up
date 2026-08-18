import {
  abandonActiveAttempt,
  createCounterState,
  getDepthGuideY,
  getPoseMetrics,
  getSetupState,
  isDepthReached,
  isReadyPosition,
  processPoseMetrics,
  recordTrackingLoss,
  type CounterState,
  type PoseLandmark,
  type PoseMetrics,
  type WorkoutAttempt,
} from "@/features/workout/_lib/counter"
import {
  handleCompletedAttempt,
  notifySessionEnd,
  speak,
  stopSpeech,
} from "@/features/workout/_lib/feedback"
import {
  createWorkoutSession,
  saveSession,
  type TrainingPlan,
  type WorkoutSession,
  type WorkoutStatus,
} from "@/features/workout/_lib/storage"
import { syncPendingSessions } from "@/features/workout/_lib/sync"
import { api } from "@workspace/backend/api"
import { useMutation } from "convex/react"
import { useEffect, useRef, useState } from "react"

export type SessionPhase = "active" | "countdown" | "positioning"

const INITIAL_COUNTER_STATE = createCounterState()
const COUNTDOWN_TRACKING_GRACE_MS = 500
const GUIDANCE_TOAST_INTERVAL_MS = 1800
const TRACKING_LOSS_GRACE_MS = 1500
const TRACKING_TOAST_GRACE_MS = 2200
const TOAST_DURATION_MS = 1200

function calibrateDepthGuide(
  currentDepthGuideY: number | null,
  landmarks: readonly PoseLandmark[],
  setupValid: boolean
) {
  return setupValid
    ? (getDepthGuideY(landmarks) ?? currentDepthGuideY)
    : currentDepthGuideY
}

function getDepthOffset(
  metrics: PoseMetrics | null,
  depthGuideY: number | null
) {
  return metrics && depthGuideY !== null
    ? metrics.shoulderY - depthGuideY
    : null
}

function shouldAbandonAttempt(
  phase: SessionPhase,
  now: number,
  lastPoseAt: number
) {
  return phase === "active" && now - lastPoseAt > TRACKING_LOSS_GRACE_MS
}

function shouldShowTrackingToast({
  lastPoseAt,
  metrics,
  now,
  phase,
}: {
  lastPoseAt: number
  metrics: PoseMetrics | null
  now: number
  phase: SessionPhase
}) {
  return (
    phase === "active" && !metrics && now - lastPoseAt > TRACKING_TOAST_GRACE_MS
  )
}

function clearToastTimeout(timeout: {
  current: ReturnType<typeof setTimeout> | null
}) {
  if (timeout.current) {
    clearTimeout(timeout.current)
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

function handleTrackingGuidance({
  lastGuidanceToast,
  lastGuidanceToastAt,
  lastPoseAt,
  metrics,
  now,
  phase,
  setupHint,
  showToast,
}: {
  lastGuidanceToast: { current: string | null }
  lastGuidanceToastAt: { current: number }
  lastPoseAt: number
  metrics: PoseMetrics | null
  now: number
  phase: SessionPhase
  setupHint: string
  showToast: (message: string) => void
}) {
  if (shouldShowTrackingToast({ lastPoseAt, metrics, now, phase })) {
    showGuidanceToast({
      lastGuidanceToast,
      lastGuidanceToastAt,
      message: setupHint,
      now,
      showToast,
    })
    return
  }

  if (metrics) {
    lastGuidanceToast.current = null
  }
}

function processActiveFrame({
  counter,
  depthOffset,
  depthReached,
  metrics,
  now,
  onCompleted,
  sessionStartedAt,
}: {
  counter: { current: CounterState }
  depthOffset: number | null
  depthReached: boolean
  metrics: PoseMetrics
  now: number
  onCompleted: (attempt: WorkoutAttempt, state: CounterState) => void
  sessionStartedAt: number
}) {
  const result = processPoseMetrics(
    counter.current,
    metrics,
    now - sessionStartedAt,
    depthReached,
    depthOffset
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
  const syncSession = useMutation(api.workoutSessions.sync)
  const [countdown, setCountdown] = useState(3)
  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState<SessionPhase>("positioning")
  const [setupHint, setSetupHint] = useState("Fit body in frame")
  const [toast, setToast] = useState<string | null>(null)
  const [validReps, setValidReps] = useState(0)
  const counter = useRef(INITIAL_COUNTER_STATE)
  const depthGuideY = useRef<number | null>(null)
  const finished = useRef(false)
  const lastGuidanceToast = useRef<string | null>(null)
  const lastGuidanceToastAt = useRef(0)
  const lastPoseAt = useRef(0)
  const readySince = useRef<number | null>(null)
  const sessionStartedAt = useRef(0)
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  function complete(status: WorkoutStatus, counterState?: CounterState) {
    if (finished.current) return

    finished.current = true
    const endedAt = Date.now()
    const startedAt = sessionStartedAt.current || endedAt
    const session = createWorkoutSession({
      counterState: counterState ?? counter.current,
      endedAt,
      plan,
      startedAt,
      status,
      targetReps,
    })

    notifySessionEnd(status, plan.soundEnabled)
    saveSession(session)
    void syncPendingSessions(syncSession)
    onComplete(session)
  }

  function showToast(message: string) {
    setToast(message)
    clearToastTimeout(toastTimeout)
    toastTimeout.current = setTimeout(() => setToast(null), TOAST_DURATION_MS)
  }

  function onLandmarks(landmarks: readonly PoseLandmark[]) {
    const now = Date.now()

    const metrics = getPoseMetrics(landmarks)
    const ready = isReadyPosition(metrics)
    const setup = getSetupState(landmarks, metrics, ready)
    depthGuideY.current = calibrateDepthGuide(
      depthGuideY.current,
      landmarks,
      setup.valid
    )

    const depthReached = isDepthReached(landmarks, depthGuideY.current)
    const depthOffset = getDepthOffset(metrics, depthGuideY.current)
    const nextSetupHint = setup.hint

    setSetupHint(nextSetupHint)
    handleTrackingGuidance({
      lastGuidanceToast,
      lastGuidanceToastAt,
      lastPoseAt: lastPoseAt.current,
      metrics,
      now,
      phase,
      setupHint: nextSetupHint,
      showToast,
    })

    if (phase === "countdown" && !setup.valid) {
      void stopSpeech()
      readySince.current = null
      setCountdown(3)
      setPhase("positioning")
      return
    }

    if (!metrics) {
      readySince.current = null
      if (phase === "active") {
        counter.current = recordTrackingLoss(
          counter.current,
          Math.max(0, lastPoseAt.current - sessionStartedAt.current),
          depthReached
        )
      }
      if (shouldAbandonAttempt(phase, now, lastPoseAt.current)) {
        counter.current = abandonActiveAttempt(counter.current)
      }
      return
    }

    lastPoseAt.current = now

    if (phase === "positioning") {
      if (!setup.valid) {
        readySince.current = null
        return
      }

      if (readySince.current === null) {
        readySince.current = now
      }
      if (now - readySince.current >= 1000) {
        setCountdown(3)
        setPhase("countdown")
      }
      return
    }

    if (phase === "countdown") {
      return
    }

    processActiveFrame({
      counter,
      depthOffset,
      depthReached,
      metrics,
      now,
      onCompleted: (attempt, state) =>
        handleCompletedAttempt({
          attempt,
          complete,
          setValidReps,
          showToast,
          soundEnabled: plan.soundEnabled,
          state,
          targetReps,
        }),
      sessionStartedAt: sessionStartedAt.current,
    })
  }

  useEffect(() => {
    if (phase !== "countdown") {
      return undefined
    }

    let current = 3
    void speak(String(current), plan.soundEnabled)
    const interval = setInterval(() => {
      if (
        readySince.current === null ||
        Date.now() - lastPoseAt.current > COUNTDOWN_TRACKING_GRACE_MS
      ) {
        clearInterval(interval)
        void stopSpeech()
        setCountdown(3)
        setPhase("positioning")
        return
      }

      current -= 1
      if (current > 0) {
        setCountdown(current)
        void speak(String(current), plan.soundEnabled)
        return
      }

      clearInterval(interval)
      void speak("Go", plan.soundEnabled)
      counter.current = createCounterState()
      sessionStartedAt.current = Date.now()
      setPhase("active")
    }, 1000)

    return () => clearInterval(interval)
  }, [phase, plan.soundEnabled])

  useEffect(() => {
    return () => {
      if (!finished.current) {
        void stopSpeech()
      }
      clearToastTimeout(toastTimeout)
    }
  }, [])

  return {
    countdown,
    error,
    onCameraError: setError,
    onLandmarks,
    phase,
    setupHint,
    stop: () => complete("stopped"),
    toast,
    validReps,
  }
}
