import type {
  CounterState,
  WorkoutAttempt,
} from "@/features/workout/_lib/counter"
import type { WorkoutStatus } from "@/features/workout/_lib/storage"
import { hapticFailure, hapticHard, hapticSuccess } from "@/lib/haptics"
import * as Speech from "expo-speech"

export async function speak(
  value: string,
  enabled: boolean,
  language?: string
) {
  if (!enabled) {
    return
  }

  await Speech.stop()
  Speech.speak(value, {
    language,
    rate: 1.05,
    useApplicationAudioSession: false,
    volume: 1,
  })
}

export function stopSpeech() {
  return Speech.stop()
}

export function notifySessionEnd(
  status: WorkoutStatus,
  soundEnabled: boolean,
  message: string,
  language: string
) {
  if (status !== "completed") {
    void stopSpeech()
    return
  }

  hapticSuccess()
  void speak(message, soundEnabled, language)
}

export function handleCompletedAttempt({
  attempt,
  complete,
  didNotCount,
  setValidReps,
  showToast,
  soundEnabled,
  speechLanguage,
  state,
  targetReps,
}: {
  attempt: WorkoutAttempt
  complete: (status: WorkoutStatus, counterState?: CounterState) => void
  didNotCount: string
  setValidReps: (reps: number) => void
  showToast: (message: string) => void
  soundEnabled: boolean
  speechLanguage: string
  state: CounterState
  targetReps: number
}) {
  if (!attempt.valid) {
    hapticFailure()
    showToast(didNotCount)
    return
  }

  hapticHard()
  setValidReps(state.validReps)

  if (state.validReps >= targetReps) {
    complete("completed", state)
    return
  }

  void speak(String(state.validReps), soundEnabled, speechLanguage)
}
