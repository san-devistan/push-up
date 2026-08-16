import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Text } from "@/components/ui/text"
import { Connect } from "@/features/workout/_components/connect"
import {
  Hero,
  Meter,
  Slab,
  StatGrid,
  StatTile,
} from "@/features/workout/_components/figures"
import type { FailureReason } from "@/features/workout/_lib/counter"
import { formatDuration, formatSeconds } from "@/features/workout/_lib/format"
import type { WorkoutSession } from "@/features/workout/_lib/storage"
import {
  CheckIcon,
  ClockIcon,
  HouseIcon,
  TargetIcon,
  TimerIcon,
  ZapIcon,
} from "lucide-react-native"
import { ScrollView, StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const FAILURE_REASONS = [
  "body_misalignment",
  "incomplete_lockout",
  "insufficient_depth",
] as const satisfies readonly FailureReason[]
const SCREEN_EDGES = ["top", "bottom"] as const
const FAILURE_LABELS = {
  body_misalignment: "Body alignment",
  incomplete_lockout: "Incomplete lockout",
  insufficient_depth: "Not deep enough",
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
  const failureCounts: Record<FailureReason, number> = {
    body_misalignment: 0,
    incomplete_lockout: 0,
    insufficient_depth: 0,
  }

  for (const attempt of session.attempts) {
    for (const reason of attempt.failureReasons) {
      failureCounts[reason] += 1
    }
  }

  return { averageRepMs, failureCounts, successRate }
}

function FailureBreakdown({
  failureCounts,
}: {
  failureCounts: Record<FailureReason, number>
}) {
  const failures = FAILURE_REASONS.filter((reason) => failureCounts[reason] > 0)

  if (failures.length === 0) {
    return (
      <View className="flex-row items-center gap-3 rounded-2xl bg-primary/15 p-4">
        <Icon as={CheckIcon} className="text-primary" />
        <Text className="font-semibold">Every attempt counted. Clean set.</Text>
      </View>
    )
  }

  return (
    <Slab>
      <Text className="font-semibold">Why attempts did not count</Text>
      {failures.map((reason) => (
        <View
          key={reason}
          className="flex-row items-center justify-between gap-4"
        >
          <Text variant="muted">{FAILURE_LABELS[reason]}</Text>
          <Text selectable className="font-heading font-bold">
            {failureCounts[reason]}
          </Text>
        </View>
      ))}
    </Slab>
  )
}

export default function SummaryScreen({
  onDone,
  session,
}: {
  onDone: () => void
  session: WorkoutSession
}) {
  const { averageRepMs, failureCounts, successRate } = getSessionStats(session)
  const completed = session.status === "completed"

  return (
    <SafeAreaView className="flex-1 bg-background" edges={SCREEN_EDGES}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Hero
          caption={
            completed
              ? "Target hit. Come back tomorrow to keep the streak."
              : "Logged anyway — partial sets still count toward your total."
          }
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

        <StatGrid>
          <StatTile
            icon={TargetIcon}
            label="Attempts"
            value={String(session.attempts.length)}
          />
          <StatTile icon={ZapIcon} label="Success" value={`${successRate}%`} />
          <StatTile
            icon={ClockIcon}
            label="Duration"
            value={formatDuration(session.totalDurationMs)}
          />
          <StatTile
            icon={TimerIcon}
            label="Avg. rep"
            value={formatSeconds(averageRepMs)}
          />
        </StatGrid>

        <FailureBreakdown failureCounts={failureCounts} />
        <Connect />

        <View className="flex-1" />
        <Button onPress={onDone} style={styles.primaryAction}>
          <Icon as={HouseIcon} />
          <Text className="font-heading text-lg font-bold">Back to today</Text>
        </Button>
      </ScrollView>
    </SafeAreaView>
  )
}
