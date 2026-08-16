import {
  listPendingSessions,
  markSessionSynced,
} from "@/features/workout/_lib/storage"

type PendingSession = ReturnType<typeof listPendingSessions>[number]

type SyncSession = (args: {
  activeRepetitionTimeMs: number
  attempts: PendingSession["attempts"]
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
          attempts: session.attempts,
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
