import { formatCompact } from "./format.ts"

const MAX_LEVEL = 100
const RECENT_AVERAGE_DAYS = 30

type ActivityDay = { reps: number }

export type LevelInput = {
  bestStreak: number
  dailyGoal: number
  recentDays: readonly ActivityDay[]
  totalReps: number
}

export type LevelRequirement = {
  level: number
  recentDailyAverage: number
  streak: number
  totalReps: number
}

type LevelAnchor = LevelRequirement & {
  streakAtLastLevel: number
  totalRepsPerLevel: number
}

export type LevelMilestone = {
  earned: boolean
  id: "recentDailyAverage" | "streak" | "totalReps"
  label: string
  target: number
  value: number
}

type LevelStats = {
  dailyPace: number
  streak: number
  totalReps: number
}

const LEVEL_ANCHORS = [
  {
    level: 0,
    recentDailyAverage: 0,
    streak: 0,
    streakAtLastLevel: 0,
    totalReps: 0,
    totalRepsPerLevel: 0,
  },
  {
    level: 1,
    recentDailyAverage: 3,
    streak: 1,
    streakAtLastLevel: 9,
    totalReps: 10,
    totalRepsPerLevel: 10,
  },
  {
    level: 10,
    recentDailyAverage: 5,
    streak: 10,
    streakAtLastLevel: 19,
    totalReps: 100,
    totalRepsPerLevel: 10,
  },
  {
    level: 20,
    recentDailyAverage: 7,
    streak: 20,
    streakAtLastLevel: 30,
    totalReps: 200,
    totalRepsPerLevel: 10,
  },
  {
    level: 30,
    recentDailyAverage: 10,
    streak: 30,
    streakAtLastLevel: 45,
    totalReps: 300,
    totalRepsPerLevel: 20,
  },
  {
    level: 40,
    recentDailyAverage: 15,
    streak: 45,
    streakAtLastLevel: 60,
    totalReps: 500,
    totalRepsPerLevel: 50,
  },
  {
    level: 50,
    recentDailyAverage: 20,
    streak: 60,
    streakAtLastLevel: 75,
    totalReps: 1000,
    totalRepsPerLevel: 50,
  },
  {
    level: 60,
    recentDailyAverage: 25,
    streak: 75,
    streakAtLastLevel: 90,
    totalReps: 2000,
    totalRepsPerLevel: 100,
  },
  {
    level: 70,
    recentDailyAverage: 30,
    streak: 90,
    streakAtLastLevel: 120,
    totalReps: 3000,
    totalRepsPerLevel: 200,
  },
  {
    level: 80,
    recentDailyAverage: 40,
    streak: 120,
    streakAtLastLevel: 150,
    totalReps: 5000,
    totalRepsPerLevel: 250,
  },
  {
    level: 90,
    recentDailyAverage: 50,
    streak: 150,
    streakAtLastLevel: 180,
    totalReps: 7500,
    totalRepsPerLevel: 250,
  },
  {
    level: 100,
    recentDailyAverage: 100,
    streak: 365,
    streakAtLastLevel: 365,
    totalReps: 50_000,
    totalRepsPerLevel: 0,
  },
] as const satisfies readonly LevelAnchor[]

function clean(value: number) {
  return Math.max(0, Math.floor(value))
}

function interpolate(start: number, end: number, progress: number) {
  return Math.ceil(start + (end - start) * progress)
}

function requirementOf(anchor: LevelAnchor): LevelRequirement {
  return {
    level: anchor.level,
    recentDailyAverage: anchor.recentDailyAverage,
    streak: anchor.streak,
    totalReps: anchor.totalReps,
  }
}

function getRequirement(level: number): LevelRequirement {
  const targetLevel = Math.min(MAX_LEVEL, Math.max(0, Math.floor(level)))
  let previous: LevelAnchor = LEVEL_ANCHORS[0]

  for (const anchor of LEVEL_ANCHORS) {
    if (targetLevel > anchor.level) {
      previous = anchor
      continue
    }

    if (targetLevel === anchor.level || previous.level === anchor.level) {
      return requirementOf(anchor)
    }

    const streakProgress =
      (targetLevel - previous.level) / (anchor.level - 1 - previous.level)

    return {
      level: targetLevel,
      recentDailyAverage: previous.recentDailyAverage,
      streak: interpolate(
        previous.streak,
        previous.streakAtLastLevel,
        streakProgress
      ),
      totalReps:
        previous.totalReps +
        (targetLevel - previous.level) * previous.totalRepsPerLevel,
    }
  }

  return requirementOf(LEVEL_ANCHORS.at(-1) ?? LEVEL_ANCHORS[0])
}

function getRecentDailyAverage(days: readonly ActivityDay[]) {
  const total = days
    .slice(-RECENT_AVERAGE_DAYS)
    .reduce((sum, day) => sum + clean(day.reps), 0)

  return Math.floor(total / RECENT_AVERAGE_DAYS)
}

function getStats(input: LevelInput) {
  return {
    dailyPace: Math.max(
      getRecentDailyAverage(input.recentDays),
      clean(input.dailyGoal)
    ),
    streak: clean(input.bestStreak),
    totalReps: clean(input.totalReps),
  }
}

function meetsRequirement(stats: LevelStats, requirement: LevelRequirement) {
  return (
    stats.totalReps >= requirement.totalReps &&
    stats.streak >= requirement.streak &&
    stats.dailyPace >= requirement.recentDailyAverage
  )
}

function getMilestonePercent(milestone: LevelMilestone) {
  if (milestone.target === 0) {
    return 100
  }

  return Math.min(100, (milestone.value / milestone.target) * 100)
}

function getMilestones(
  stats: LevelStats,
  requirement: LevelRequirement
): LevelMilestone[] {
  const milestones: LevelMilestone[] = [
    {
      earned: stats.totalReps >= requirement.totalReps,
      id: "totalReps",
      label: `${formatCompact(requirement.totalReps)} total`,
      target: requirement.totalReps,
      value: stats.totalReps,
    },
  ]

  if (requirement.streak > 0) {
    milestones.push({
      earned: stats.streak >= requirement.streak,
      id: "streak",
      label: `${requirement.streak}d streak`,
      target: requirement.streak,
      value: stats.streak,
    })
  }

  if (requirement.recentDailyAverage > 0) {
    milestones.push({
      earned: stats.dailyPace >= requirement.recentDailyAverage,
      id: "recentDailyAverage",
      label: `${requirement.recentDailyAverage}/day`,
      target: requirement.recentDailyAverage,
      value: stats.dailyPace,
    })
  }

  return milestones
}

export function getLevel(input: LevelInput) {
  const stats = getStats(input)
  let level = 0

  for (let next = 1; next <= MAX_LEVEL; next++) {
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

export function getLevelRequirements() {
  return Array.from({ length: MAX_LEVEL }, (_, index) =>
    getRequirement(index + 1)
  )
}

export function formatMilestoneRemaining(milestone: LevelMilestone) {
  const remaining = Math.max(0, milestone.target - milestone.value)

  if (milestone.id === "recentDailyAverage") {
    return `${remaining}/day average`
  }

  const unit = milestone.id === "totalReps" ? "rep" : "day"
  const value =
    milestone.id === "totalReps"
      ? formatCompact(remaining)
      : remaining.toLocaleString()

  return `${value} ${unit}${remaining === 1 ? "" : "s"}`
}
