const DAYS_PER_WEEK = 7
const DAY_MS = 24 * 60 * 60 * 1000

type ActivityDay = { date: string; reps: number }

function getLocalDate(date: Date) {
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function getMonday(timestamp: number) {
  const monday = new Date(timestamp)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % DAYS_PER_WEEK))
  return monday
}

function fillActivityDays(
  start: Date,
  dayCount: number,
  recentDays: readonly ActivityDay[]
) {
  const repsByDate = new Map(recentDays.map((day) => [day.date, day.reps]))

  return Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const key = getLocalDate(date)

    return { date: key, reps: repsByDate.get(key) ?? 0 }
  })
}

export function getCurrentWeekActivity(
  today: number,
  recentDays: readonly ActivityDay[]
) {
  return fillActivityDays(getMonday(today), DAYS_PER_WEEK, recentDays)
}

/** Rolling 7-day total and daily shape against the seven days before it. */
export function getWeeklyComparison(recentDays: readonly ActivityDay[]) {
  const currentDays = recentDays.slice(-DAYS_PER_WEEK)
  const previousDays = recentDays.slice(-DAYS_PER_WEEK * 2, -DAYS_PER_WEEK)
  const data = Array.from({ length: DAYS_PER_WEEK }, (_, index) => ({
    current: currentDays[index]?.reps ?? 0,
    day: index + 1,
    previous: previousDays[index]?.reps ?? 0,
  }))
  const current = data.reduce((total, day) => total + day.current, 0)
  const previous = data.reduce((total, day) => total + day.previous, 0)

  return {
    current,
    data,
    percent: previous > 0 ? ((current - previous) / previous) * 100 : null,
  }
}

export function getActivityDaysAgo(date: string, today: number) {
  const value = new Date(`${date}T00:00:00`)
  const current = new Date(today)
  current.setHours(0, 0, 0, 0)

  return Math.round((current.getTime() - value.getTime()) / DAY_MS)
}

export function formatActivityDate(date: string, locale: string) {
  const value = new Date(`${date}T00:00:00`)
  const day = String(value.getDate()).padStart(2, "0")
  const month = value
    .toLocaleDateString(locale, { month: "short" })
    .replace(/\.$/u, "")

  return `${day} ${month}.`
}
