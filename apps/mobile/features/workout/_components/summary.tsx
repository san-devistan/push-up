import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Text } from "@/components/ui/text"
import {
  Hero,
  Meter,
  StatsDivider,
  StatsList,
  StatsListRow,
} from "@/features/workout/_components/figures"
import {
  formatCalories,
  getEstimatedCalories,
} from "@/features/workout/_lib/calories"
import type { FailureReason } from "@/features/workout/_lib/counter"
import { formatDuration, formatSeconds } from "@/features/workout/_lib/format"
import type { WorkoutSession } from "@/features/workout/_lib/storage"
import {
  ClockIcon,
  HouseIcon,
  TimerIcon,
  TrendingUpIcon,
  XCircleIcon,
  ZapIcon,
} from "lucide-react-native"
import { ScrollView, StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const FAILURE_REASONS = [
  "body_misalignment",
  "incomplete_lockout",
  "insufficient_depth",
  "tracking_lost",
] as const satisfies readonly FailureReason[]
const SCREEN_EDGES = ["top", "bottom"] as const
const FAILURE_LABELS = {
  body_misalignment: "align",
  incomplete_lockout: "lockout",
  insufficient_depth: "depth",
  tracking_lost: "tracking",
} satisfies Record<FailureReason, string>
const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: 16,
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  primaryAction: { borderCurve: "continuous", borderRadius: 18, height: 60 },
})

function getSessionStats(session: WorkoutSession) {
  const successRate = session.attempts.length
    ? Math.round((session.validReps / session.attempts.length) * 100)
    : 0
  const averageRepMs = session.attempts.length
    ? Math.round(session.activeRepetitionTimeMs / session.attempts.length)
    : 0
  const failedReps = session.attempts.filter((attempt) => !attempt.valid).length
  const failureCounts: Record<FailureReason, number> = {
    body_misalignment: 0,
    incomplete_lockout: 0,
    insufficient_depth: 0,
    tracking_lost: 0,
  }

  for (const attempt of session.attempts) {
    for (const reason of attempt.failureReasons) {
      failureCounts[reason] += 1
    }
  }

  return { averageRepMs, failedReps, failureCounts, successRate }
}

function formatFailedReps({
  failedReps,
  failureCounts,
}: {
  failedReps: number
  failureCounts: Record<FailureReason, number>
}) {
  if (failedReps === 0) {
    return "0"
  }

  const failures = FAILURE_REASONS.filter((reason) => failureCounts[reason] > 0)

  if (failures.length === 0) {
    return String(failedReps)
  }

  const reasons = failures
    .map((reason) => {
      const count = failureCounts[reason]
      const label = FAILURE_LABELS[reason]
      return count === 1 ? label : `${label} x${count}`
    })
    .join(", ")

  return `${failedReps} (${reasons})`
}

export default function SummaryScreen({
  onDone,
  session,
}: {
  onDone: () => void
  session: WorkoutSession
}) {
  const { averageRepMs, failedReps, failureCounts, successRate } =
    getSessionStats(session)
  const completed = session.status === "completed"
  const failedRepSummary = formatFailedReps({ failedReps, failureCounts })
  const calories = formatCalories(getEstimatedCalories(session.attempts.length))

  return (
    <SafeAreaView className="flex-1 bg-background" edges={SCREEN_EDGES}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Hero
          label={completed ? "Goal complete" : "Session stopped"}
          suffix={`/${session.targetReps}`}
          value={String(session.validReps)}
        >
          <Meter
            percent={
              (session.validReps / Math.max(1, session.targetReps)) * 100
            }
          />
        </Hero>

        <StatsList>
          <StatsListRow
            icon={TrendingUpIcon}
            label="Success rate"
            value={`${successRate}%`}
          />
          <StatsDivider />
          <StatsListRow
            icon={XCircleIcon}
            label="Failed reps"
            value={failedRepSummary}
          />
          <StatsDivider />
          <StatsListRow
            icon={TimerIcon}
            label="Avg rep"
            value={formatSeconds(averageRepMs)}
          />
          <StatsDivider />
          <StatsListRow
            icon={ClockIcon}
            label="Duration"
            value={formatDuration(session.totalDurationMs)}
          />
          <StatsDivider />
          <StatsListRow icon={ZapIcon} label="Calories" value={calories} />
        </StatsList>

        <View className="flex-1" />
        <Button onPress={onDone} style={styles.primaryAction}>
          <Icon as={HouseIcon} />
          <Text className="font-heading text-lg font-bold">Back to today</Text>
        </Button>
      </ScrollView>
    </SafeAreaView>
  )
}
