import type { Activity } from "@/features/workout/_lib/activity"

export const DEMO_DATA = process.env.EXPO_PUBLIC_DEMO_DATA === "1"

const DAY_MS = 24 * 60 * 60 * 1000
const VISIBLE_DAYS = 16 * 7
const CHART_WEEKS = 8
const REST_GAPS = [
  { from: 96, to: 89 },
  { from: 47, to: 41 },
]
const STREAK_DAYS = 14

function seeded(seed: number) {
  let state = seed

  return () => {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648
    return state / 2_147_483_648
  }
}

function isResting(daysAgo: number) {
  return REST_GAPS.some((gap) => daysAgo <= gap.from && daysAgo >= gap.to)
}

function repsFor(daysAgo: number, random: () => number) {
  const skipped = random() > 0.78

  if (daysAgo > STREAK_DAYS && (isResting(daysAgo) || skipped)) {
    return 0
  }

  const progress = 1 - daysAgo / VISIBLE_DAYS
  const base = 6 + progress * 28
  const doubled = progress > 0.4 && random() > 0.85 ? 1.9 : 1

  return Math.round(base * doubled * (0.75 + random() * 0.5))
}

export function demoActivity(today: string): Activity {
  const random = seeded(20_260_815)
  const start = Date.parse(`${today}T00:00:00.000Z`)
  const recentDays = Array.from({ length: VISIBLE_DAYS }, (_, index) => {
    const daysAgo = VISIBLE_DAYS - 1 - index

    return {
      date: new Date(start - daysAgo * DAY_MS).toISOString().slice(0, 10),
      reps: daysAgo === 0 ? 6 : repsFor(daysAgo, random),
    }
  })

  const totalPushups = recentDays.reduce((total, day) => total + day.reps, 0)
  const activeDays = recentDays.filter((day) => day.reps > 0)
  const totalAttempts = Math.round(totalPushups / 0.88)
  let currentStreak = 0

  for (let index = recentDays.length - 1; index >= 0; index--) {
    if (!recentDays[index]?.reps) {
      break
    }
    currentStreak += 1
  }

  return {
    averageRepMs: 2380,
    bestDayReps: Math.max(...recentDays.map((day) => day.reps)),
    bestSessionReps: 34,
    bestStreak: Math.max(currentStreak, 19),
    currentStreak,
    recentDays,
    successRate: 88,
    todayReps: 6,
    totalAttempts,
    totalPushups,
    totalSessions: activeDays.length,
    weeks: Array.from({ length: CHART_WEEKS }, (_, index) => {
      const week = recentDays.slice(
        recentDays.length - (CHART_WEEKS - index) * 7,
        recentDays.length - (CHART_WEEKS - index - 1) * 7
      )

      return {
        reps: week.reduce((total, day) => total + day.reps, 0),
        start: week[0]?.date ?? "",
      }
    }),
  }
}
