import type {
  CounterState,
  WorkoutAttempt,
} from "@/features/workout/_lib/counter"
import type { WorkoutStatus } from "@/features/workout/_lib/storage"
import { hapticFeedback } from "@/lib/haptics"
import { playSfx } from "@/lib/sfx"

export function notifySessionEnd(status: WorkoutStatus, soundEnabled: boolean) {
  if (status === "stopped") {
    playSfx("error", soundEnabled)
    return
  }

  hapticFeedback("achievement", soundEnabled)
}

export function handleCompletedAttempt({
  attempt,
  complete,
  didNotCount,
  setValidReps,
  showToast,
  soundEnabled,
  state,
  targetReps,
}: {
  attempt: WorkoutAttempt
  complete: (status: WorkoutStatus, counterState?: CounterState) => void
  didNotCount: string
  setValidReps: (reps: number) => void
  showToast: (message: string) => void
  soundEnabled: boolean
  state: CounterState
  targetReps: number
}) {
  if (!attempt.valid) {
    hapticFeedback("delete", soundEnabled)
    showToast(didNotCount)
    return
  }

  setValidReps(state.validReps)

  if (state.validReps >= targetReps) {
    complete("completed", state)
    return
  }

  hapticFeedback("expand", soundEnabled)
}
