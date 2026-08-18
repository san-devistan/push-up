import type { WorkoutAttempt } from "@/features/workout/_lib/counter"
import {
  listPendingSessions,
  markSessionSynced,
} from "@/features/workout/_lib/storage"

type PendingSession = ReturnType<typeof listPendingSessions>[number]

// The pose trace stays on device: the Convex attempt validator is a strict
// object, so an extra field would make every sync fail.
function toSyncedAttempt(attempt: WorkoutAttempt) {
  return {
    durationMs: attempt.durationMs,
    failureReasons: attempt.failureReasons,
    minBodyAngle: attempt.minBodyAngle,
    minElbowAngle: attempt.minElbowAngle,
    startedAtOffsetMs: attempt.startedAtOffsetMs,
    valid: attempt.valid,
  }
}

type SyncSession = (args: {
  activeRepetitionTimeMs: number
  attempts: ReturnType<typeof toSyncedAttempt>[]
  clientSessionId: string
  endedAt: number
  localDate: string
  soundEnabled: boolean
  startedAt: number
  status: PendingSession["status"]
  targetReps: number
  timezoneOffsetMinutes: number
  totalDurationMs: number
  validReps: number
}) => Promise<unknown>

export async function syncPendingSessions(syncSession: SyncSession) {
  await Promise.all(
    listPendingSessions().map(async (session) => {
      try {
        await syncSession({
          activeRepetitionTimeMs: session.activeRepetitionTimeMs,
          attempts: session.attempts.map(toSyncedAttempt),
          clientSessionId: session.id,
          endedAt: session.endedAt,
          localDate: session.localDate,
          soundEnabled: session.soundEnabled,
          startedAt: session.startedAt,
          status: session.status,
          targetReps: session.targetReps,
          timezoneOffsetMinutes: session.timezoneOffsetMinutes,
          totalDurationMs: session.totalDurationMs,
          validReps: session.validReps,
        })
        markSessionSynced(session.id)
      } catch {
        return
      }
    })
  )
}
