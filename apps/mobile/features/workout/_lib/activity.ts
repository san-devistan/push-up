import type { WorkoutSession } from "@/features/workout/_lib/storage"
import type { api } from "@workspace/backend/api"
import type { FunctionReturnType } from "convex/server"

export type Activity = FunctionReturnType<typeof api.workoutSessions.activity>

function addSession(activity: Activity, session: WorkoutSession): Activity {
  const validReps = session.validReps
  const attempts = session.attempts.length
  const totalAttempts = activity.totalAttempts + attempts
  const totalPushups = activity.totalPushups + validReps
  const totalActiveMs = activity.totalActiveMs + session.activeRepetitionTimeMs
  const totalDurationMs = activity.totalDurationMs + session.totalDurationMs
  const isToday = activity.recentDays.at(-1)?.date === session.localDate
  let sessionDayReps = 0
  const recentDays = activity.recentDays.map((day) => {
    if (day.date !== session.localDate) return day

    sessionDayReps = day.reps + validReps
    return { ...day, reps: sessionDayReps }
  })
  const currentStreak =
    isToday && validReps > 0 && activity.todayReps === 0
      ? activity.currentStreak + 1
      : activity.currentStreak
  const lastWeek = activity.weeks.length - 1

  return {
    ...activity,
    averageRepMs:
      totalPushups === 0 ? 0 : Math.round(totalActiveMs / totalPushups),
    bestDayReps: Math.max(activity.bestDayReps, sessionDayReps),
    bestSessionReps: Math.max(activity.bestSessionReps, validReps),
    bestStreak: Math.max(activity.bestStreak, currentStreak),
    currentStreak,
    recentDays,
    successRate:
      totalAttempts === 0
        ? 0
        : Math.round((totalPushups / totalAttempts) * 100),
    todayAttempts: activity.todayAttempts + (isToday ? attempts : 0),
    todayReps: activity.todayReps + (isToday ? validReps : 0),
    totalActiveMs,
    totalAttempts,
    totalDurationMs,
    totalPushups,
    totalSessions: activity.totalSessions + (validReps > 0 ? 1 : 0),
    weeks: activity.weeks.map((week, index) =>
      isToday && index === lastWeek
        ? { ...week, reps: week.reps + validReps }
        : week
    ),
  }
}

export function getActivityAfterSession(
  before: Activity | undefined,
  live: Activity | undefined,
  session: WorkoutSession
) {
  if (!before) return live

  const expectedTotal = before.totalPushups + session.validReps
  return live && live.totalPushups >= expectedTotal
    ? live
    : addSession(before, session)
}
