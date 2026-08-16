const DAY_MS = 24 * 60 * 60 * 1000
const CHART_WEEKS = 8

export type ActivitySession = {
  activeRepetitionTimeMs: number
  invalidReps: number
  localDate: string
  validReps: number
}

export type ActivityDay = { date: string; reps: number }

function parseDate(date: string) {
  return Date.parse(`${date}T00:00:00.000Z`)
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 10)
}

function addDays(date: string, days: number) {
  return formatDate(parseDate(date) + days * DAY_MS)
}

export function isDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    return false
  }

  const timestamp = parseDate(value)
  return Number.isFinite(timestamp) && formatDate(timestamp) === value
}

function totalsOf(sessions: readonly ActivitySession[]) {
  let activeMs = 0
  let attempts = 0
  let bestSessionReps = 0
  let pushups = 0

  for (const session of sessions) {
    activeMs += session.activeRepetitionTimeMs
    attempts += session.validReps + session.invalidReps
    bestSessionReps = Math.max(bestSessionReps, session.validReps)
    pushups += session.validReps
  }

  return {
    averageRepMs: attempts === 0 ? 0 : Math.round(activeMs / attempts),
    bestSessionReps,
    successRate: attempts === 0 ? 0 : Math.round((pushups / attempts) * 100),
    totalAttempts: attempts,
    totalPushups: pushups,
    totalSessions: sessions.length,
  }
}

function streaksOf(repsByDay: ReadonlyMap<string, number>, today: string) {
  const activeDates = [...repsByDay]
    .filter(([, reps]) => reps > 0)
    .map(([date]) => date)
  activeDates.sort()
  const activeDateSet = new Set(activeDates)
  let bestStreak = 0
  let runningStreak = 0
  let previousDate: string | undefined

  for (const date of activeDates) {
    runningStreak =
      previousDate && addDays(previousDate, 1) === date ? runningStreak + 1 : 1
    bestStreak = Math.max(bestStreak, runningStreak)
    previousDate = date
  }

  let cursor = activeDateSet.has(today) ? today : addDays(today, -1)
  let currentStreak = 0

  while (activeDateSet.has(cursor)) {
    currentStreak += 1
    cursor = addDays(cursor, -1)
  }

  return { bestStreak, currentStreak }
}

function weeksOf(days: readonly ActivityDay[]) {
  const tail = days.slice(Math.max(0, days.length - CHART_WEEKS * 7))

  return Array.from({ length: Math.ceil(tail.length / 7) }, (_, index) => {
    const week = tail.slice(index * 7, index * 7 + 7)

    return {
      reps: week.reduce((total, day) => total + day.reps, 0),
      start: week[0]?.date ?? "",
    }
  })
}

export function summarizeActivity(
  sessions: readonly ActivitySession[],
  today: string,
  visibleDays = 16 * 7
) {
  const repsByDay = new Map<string, number>()

  for (const session of sessions) {
    repsByDay.set(
      session.localDate,
      (repsByDay.get(session.localDate) ?? 0) + session.validReps
    )
  }

  const recentDays = Array.from({ length: visibleDays }, (_, index) => {
    const date = addDays(today, index - visibleDays + 1)
    return { date, reps: repsByDay.get(date) ?? 0 }
  })

  return {
    ...totalsOf(sessions),
    ...streaksOf(repsByDay, today),
    bestDayReps: Math.max(0, ...repsByDay.values()),
    recentDays,
    todayReps: repsByDay.get(today) ?? 0,
    weeks: weeksOf(recentDays),
  }
}
