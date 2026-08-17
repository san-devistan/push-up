import type {
  CounterState,
  WorkoutAttempt,
} from "@/features/workout/_lib/counter"
import { logSessionAttempt } from "@/features/workout/_lib/session-debug"
import type { WorkoutStatus } from "@/features/workout/_lib/storage"
import * as Haptics from "expo-haptics"
import * as Speech from "expo-speech"

export async function speak(value: string, enabled: boolean) {
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

export function stopSpeech() {
  return Speech.stop()
}

export function notifySessionEnd(status: WorkoutStatus, soundEnabled: boolean) {
  if (status !== "completed") {
    void stopSpeech()
    return
  }

  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  void speak("Goal complete", soundEnabled)
}

export function handleCompletedAttempt({
  attempt,
  complete,
  setValidReps,
  showToast,
  soundEnabled,
  state,
  targetReps,
}: {
  attempt: WorkoutAttempt
  complete: (status: WorkoutStatus, counterState?: CounterState) => void
  setValidReps: (reps: number) => void
  showToast: (message: string) => void
  soundEnabled: boolean
  state: CounterState
  targetReps: number
}) {
  logSessionAttempt({ attempt, validReps: state.validReps })

  if (!attempt.valid) {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    showToast("Did not count")
    return
  }

  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  setValidReps(state.validReps)

  if (state.validReps >= targetReps) {
    complete("completed", state)
    return
  }

  void speak(String(state.validReps), soundEnabled)
}
