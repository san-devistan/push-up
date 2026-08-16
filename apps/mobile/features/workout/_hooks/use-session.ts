import {
  abandonActiveAttempt,
  createCounterState,
  finishActiveAttempt,
  getDepthGuideY,
  getPoseMetrics,
  isDepthReached,
  isReadyPosition,
  processPoseMetrics,
  type CounterState,
  type PoseLandmark,
  type PoseMetrics,
} from "@/features/workout/_lib/counter"
import {
  createSessionId,
  getLocalDate,
  saveSession,
  type TrainingPlan,
  type WorkoutSession,
  type WorkoutStatus,
} from "@/features/workout/_lib/storage"
import { syncPendingSessions } from "@/features/workout/_lib/sync"
import { api } from "@workspace/backend/api"
import { useMutation } from "convex/react"
import * as Haptics from "expo-haptics"
import * as Speech from "expo-speech"
import { useEffect, useRef, useState } from "react"

export type SessionPhase = "active" | "countdown" | "positioning"

const INITIAL_COUNTER_STATE = createCounterState()
const TRACKING_LOSS_GRACE_MS = 1500

function calibrateDepthGuide(
  currentDepthGuideY: number | null,
  landmarks: readonly PoseLandmark[],
  ready: boolean
) {
  return ready
    ? (getDepthGuideY(landmarks) ?? currentDepthGuideY)
    : currentDepthGuideY
}

function shouldAbandonAttempt(
  phase: SessionPhase,
  now: number,
  lastPoseAt: number
) {
  return phase === "active" && now - lastPoseAt > TRACKING_LOSS_GRACE_MS
}

async function speak(value: string, enabled: boolean) {
  if (!enabled) {
    return
  }

  await Speech.stop()
  Speech.speak(value, {
    rate: 1.05,
    useApplicationAudioSession: false,
    volume: 1,
  })
}

function buildSession({
  counterState,
  endedAt,
  plan,
  startedAt,
  status,
  targetReps,
}: {
  counterState: CounterState
  endedAt: number
  plan: TrainingPlan
  startedAt: number
  status: WorkoutStatus
  targetReps: number
}): WorkoutSession {
  const finalState =
    status === "stopped"
      ? finishActiveAttempt(counterState, endedAt - startedAt)
      : counterState

  return {
    activeRepetitionTimeMs: finalState.attempts.reduce(
      (total, attempt) => total + attempt.durationMs,
      0
    ),
    attempts: finalState.attempts,
    endedAt,
    id: createSessionId(),
    localDate: getLocalDate(startedAt),
    soundEnabled: plan.soundEnabled,
    startedAt,
    status,
    targetReps,
    timezoneOffsetMinutes: -new Date(startedAt).getTimezoneOffset(),
    totalDurationMs: endedAt - startedAt,
    validReps: finalState.validReps,
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
  const [positionReady, setPositionReady] = useState(false)
  const [trackingPose, setTrackingPose] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [validReps, setValidReps] = useState(0)
  const counter = useRef(INITIAL_COUNTER_STATE)
  const depthGuideY = useRef<number | null>(null)
  const finished = useRef(false)
  const lastPoseAt = useRef(0)
  const readySince = useRef<number | null>(null)
  const sessionStartedAt = useRef(0)
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  function complete(status: WorkoutStatus, counterState?: CounterState) {
    if (finished.current) {
      return
    }

    finished.current = true
    const endedAt = Date.now()
    const startedAt = sessionStartedAt.current || endedAt
    const session = buildSession({
      counterState: counterState ?? counter.current,
      endedAt,
      plan,
      startedAt,
      status,
      targetReps,
    })

    if (status === "completed") {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      void speak("Goal complete", plan.soundEnabled)
    } else {
      void Speech.stop()
    }
    saveSession(session)
    void syncPendingSessions(syncSession)
    onComplete(session)
  }

  function showInvalidToast() {
    setToast("Did not count")
    if (toastTimeout.current) {
      clearTimeout(toastTimeout.current)
    }
    toastTimeout.current = setTimeout(() => setToast(null), 1200)
  }

  function handleActivePose(
    metrics: PoseMetrics,
    depthReached: boolean,
    now: number
  ) {
    const elapsedMs = now - sessionStartedAt.current
    const result = processPoseMetrics(
      counter.current,
      metrics,
      elapsedMs,
      depthReached
    )
    counter.current = result.state

    if (result.event.type !== "attempt-completed") {
      return
    }

    if (!result.event.attempt.valid) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
      showInvalidToast()
      return
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setValidReps(result.state.validReps)

    if (result.state.validReps >= targetReps) {
      complete("completed", result.state)
      return
    }

    void speak(String(result.state.validReps), plan.soundEnabled)
  }

  function onLandmarks(landmarks: readonly PoseLandmark[]) {
    const now = Date.now()

    const metrics = getPoseMetrics(landmarks)
    const ready = isReadyPosition(metrics)
    depthGuideY.current = calibrateDepthGuide(
      depthGuideY.current,
      landmarks,
      ready
    )

    const depthReached = isDepthReached(landmarks, depthGuideY.current)

    setPositionReady(ready)
    setTrackingPose(metrics !== null)

    if (!metrics) {
      readySince.current = null
      if (shouldAbandonAttempt(phase, now, lastPoseAt.current)) {
        counter.current = abandonActiveAttempt(counter.current)
      }
      return
    }

    lastPoseAt.current = now

    if (phase === "positioning") {
      if (!ready) {
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
      if (!ready) {
        void Speech.stop()
        readySince.current = null
        setPhase("positioning")
      }
      return
    }

    handleActivePose(metrics, depthReached, now)
  }

  useEffect(() => {
    if (phase !== "countdown") {
      return undefined
    }

    let current = 3
    void speak(String(current), plan.soundEnabled)
    const interval = setInterval(() => {
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
        void Speech.stop()
      }
      if (toastTimeout.current) {
        clearTimeout(toastTimeout.current)
      }
    }
  }, [])

  function stop() {
    complete("stopped")
  }

  return {
    countdown,
    error,
    onCameraError: setError,
    onLandmarks,
    phase,
    positionReady,
    stop,
    toast,
    trackingPose,
    validReps,
  }
}
