const MAX_LEVEL = 100
const RECENT_AVERAGE_DAYS = 30

type ActivityDay = { reps: number }

export type LevelInput = {
  bestStreak: number
  recentDays: readonly ActivityDay[]
  totalReps: number
}

export type LevelRequirement = {
  level: number
  recentDailyAverage: number
  streak: number
  totalReps: number
}

export type LevelMilestone = {
  earned: boolean
  id: "recentDailyAverage" | "streak" | "totalReps"
  label: string
  target: number
  value: number
}

const LEVEL_ANCHORS = [
  { level: 1, recentDailyAverage: 0, streak: 0, totalReps: 0 },
  { level: 10, recentDailyAverage: 0, streak: 2, totalReps: 50 },
  { level: 20, recentDailyAverage: 0, streak: 4, totalReps: 200 },
  { level: 30, recentDailyAverage: 0, streak: 7, totalReps: 600 },
  { level: 40, recentDailyAverage: 0, streak: 14, totalReps: 1500 },
  { level: 50, recentDailyAverage: 0, streak: 30, totalReps: 3000 },
  { level: 60, recentDailyAverage: 0, streak: 45, totalReps: 6000 },
  { level: 70, recentDailyAverage: 0, streak: 75, totalReps: 11_000 },
  { level: 79, recentDailyAverage: 0, streak: 105, totalReps: 18_000 },
  { level: 80, recentDailyAverage: 50, streak: 120, totalReps: 20_000 },
  { level: 90, recentDailyAverage: 75, streak: 180, totalReps: 35_000 },
  { level: 100, recentDailyAverage: 100, streak: 365, totalReps: 60_000 },
] as const satisfies readonly LevelRequirement[]

function clean(value: number) {
  return Math.max(0, Math.floor(value))
}

function interpolate(start: number, end: number, progress: number) {
  return Math.ceil(start + (end - start) * progress)
}

function getRequirement(level: number): LevelRequirement {
  const targetLevel = Math.min(MAX_LEVEL, Math.max(1, Math.floor(level)))
  let previous: LevelRequirement = LEVEL_ANCHORS[0]

  for (const anchor of LEVEL_ANCHORS) {
    if (targetLevel > anchor.level) {
      previous = anchor
      continue
    }

    if (targetLevel === anchor.level || previous.level === anchor.level) {
      return anchor
    }

    const progress =
      (targetLevel - previous.level) / (anchor.level - previous.level)

    return {
      level: targetLevel,
      recentDailyAverage: interpolate(
        previous.recentDailyAverage,
        anchor.recentDailyAverage,
        progress
      ),
      streak: interpolate(previous.streak, anchor.streak, progress),
      totalReps: interpolate(previous.totalReps, anchor.totalReps, progress),
    }
  }

  return LEVEL_ANCHORS.at(-1) ?? LEVEL_ANCHORS[0]
}

function getRecentDailyAverage(days: readonly ActivityDay[]) {
  const total = days
    .slice(-RECENT_AVERAGE_DAYS)
    .reduce((sum, day) => sum + clean(day.reps), 0)

  return Math.floor(total / RECENT_AVERAGE_DAYS)
}

function getStats(input: LevelInput) {
  return {
    recentDailyAverage: getRecentDailyAverage(input.recentDays),
    streak: clean(input.bestStreak),
    totalReps: clean(input.totalReps),
  }
}

function meetsRequirement(
  stats: Omit<LevelRequirement, "level">,
  requirement: LevelRequirement
) {
  return (
    stats.totalReps >= requirement.totalReps &&
    stats.streak >= requirement.streak &&
    stats.recentDailyAverage >= requirement.recentDailyAverage
  )
}

function getMilestonePercent(milestone: LevelMilestone) {
  if (milestone.target === 0) {
    return 100
  }

  return Math.min(100, (milestone.value / milestone.target) * 100)
}

function getMilestones(
  stats: Omit<LevelRequirement, "level">,
  requirement: LevelRequirement
): LevelMilestone[] {
  const milestones: LevelMilestone[] = [
    {
      earned: stats.totalReps >= requirement.totalReps,
      id: "totalReps",
      label: `${requirement.totalReps.toLocaleString()} total reps`,
      target: requirement.totalReps,
      value: stats.totalReps,
    },
    {
      earned: stats.streak >= requirement.streak,
      id: "streak",
      label: `${requirement.streak}-day streak`,
      target: requirement.streak,
      value: stats.streak,
    },
  ]

  if (requirement.recentDailyAverage > 0) {
    milestones.push({
      earned: stats.recentDailyAverage >= requirement.recentDailyAverage,
      id: "recentDailyAverage",
      label: `${requirement.recentDailyAverage}/day for 30 days`,
      target: requirement.recentDailyAverage,
      value: stats.recentDailyAverage,
    })
  }

  return milestones
}

export function getLevel(input: LevelInput) {
  const stats = getStats(input)
  let level = 1

  for (let next = 2; next <= MAX_LEVEL; next++) {
    if (!meetsRequirement(stats, getRequirement(next))) {
      break
    }

    level = next
  }

  const nextLevel = Math.min(MAX_LEVEL, level + 1)
  const nextRequirement = level === MAX_LEVEL ? null : getRequirement(nextLevel)
  const milestones = nextRequirement
    ? getMilestones(stats, nextRequirement)
    : []
  const percent =
    milestones.length === 0
      ? 100
      : Math.round(
          milestones.reduce(
            (total, milestone) => total + getMilestonePercent(milestone),
            0
          ) / milestones.length
        )

  return {
    level,
    milestones,
    nextLevel,
    nextRequirement,
    percent,
  }
}

export function formatMilestoneRemaining(milestone: LevelMilestone) {
  const remaining = Math.max(0, milestone.target - milestone.value)

  if (milestone.id === "recentDailyAverage") {
    return `${remaining}/day average`
  }

  const unit = milestone.id === "totalReps" ? "rep" : "day"

  return `${remaining.toLocaleString()} ${unit}${remaining === 1 ? "" : "s"}`
}
