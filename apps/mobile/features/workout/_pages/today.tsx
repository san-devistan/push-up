import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Text } from "@/components/ui/text"
import { WeeklyColumns } from "@/features/workout/_components/charts"
import {
  Hero,
  Meter,
  Overline,
  Slab,
} from "@/features/workout/_components/figures"
import { useActivity } from "@/features/workout/_hooks/use-activity"
import { usePlan } from "@/features/workout/_hooks/use-plan"
import type { Activity } from "@/features/workout/_lib/activity"
import { formatClock, formatDayLabel } from "@/features/workout/_lib/format"
import {
  formatMilestoneRemaining,
  getLevel,
} from "@/features/workout/_lib/gamification"
import { repsPerSession } from "@/features/workout/_lib/goal"
import { useMinimizeOnScroll } from "expo-glass-tabs"
import { useRouter } from "expo-router"
import { BellOffIcon, FlameIcon, PlayIcon } from "lucide-react-native"
import { useState } from "react"
import { Linking, Pressable, StyleSheet, View } from "react-native"
import Animated from "react-native-reanimated"
import { SafeAreaView } from "react-native-safe-area-context"

const SCREEN_EDGES = ["top"] as const
const EMPTY_WEEKS = Array.from({ length: 8 }, (_, index) => ({
  reps: 0,
  start: `placeholder-${index}`,
}))
const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingBottom: 140,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  primaryAction: { borderCurve: "continuous", borderRadius: 18, height: 64 },
})

function StreakChip({ days }: { days: number }) {
  return (
    <View className="flex-row items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1.5">
      <Icon as={FlameIcon} className="text-primary" />
      <Text className="font-heading text-sm font-bold">
        {days} {days === 1 ? "day" : "days"}
      </Text>
    </View>
  )
}

function getStartSession(router: ReturnType<typeof useRouter>) {
  return () => router.push("/session")
}

function openNotificationSettings() {
  void Linking.openSettings()
}

function ReminderNudge({
  onPress,
  state,
}: {
  onPress: () => void
  state: "ask" | "denied"
}) {
  return (
    <Pressable
      accessibilityRole="button"
      className="flex-row items-center gap-3 rounded-2xl bg-muted p-4 active:opacity-70"
      onPress={onPress}
    >
      <Icon as={BellOffIcon} className="text-muted-foreground" />
      <View className="flex-1">
        <Text className="font-semibold">Daily reminder is off</Text>
        <Text variant="muted">
          {state === "ask"
            ? "Turn it on so you never skip a day."
            : "Re-enable notifications for Pushup in Settings."}
        </Text>
      </View>
    </Pressable>
  )
}

function LevelCard({ activity }: { activity: Activity | undefined }) {
  const { level, milestones, nextLevel, percent } = getLevel({
    bestStreak: activity?.bestStreak ?? 0,
    recentDays: activity?.recentDays ?? [],
    totalReps: activity?.totalPushups ?? 0,
  })
  const next = milestones.find((milestone) => !milestone.earned)

  return (
    <Slab>
      <View className="flex-row items-end justify-between">
        <Overline>Level {level}</Overline>
        <Text className="text-sm tabular-nums text-muted-foreground">
          {level === 100 ? "Max" : `Next: ${nextLevel}`}
        </Text>
      </View>
      <Meter percent={percent} />
      <Text variant="muted">
        {next
          ? `${formatMilestoneRemaining(next)} to level ${nextLevel}`
          : "Every level unlocked."}
      </Text>
    </Slab>
  )
}

function TodayHero({ reps }: { reps: number }) {
  const { plan } = usePlan()
  const times = plan.reminderTimes
    .map((time) => formatClock(time.hour, time.minute))
    .join(" · ")
  const perSession = repsPerSession(plan.targetReps, plan.reminderTimes.length)
  const split =
    plan.reminderTimes.length > 1 ? ` · ${perSession} reps each` : ""

  return (
    <Hero
      caption={
        plan.reminderEnabled
          ? `${times}${split}`
          : "No reminder set — you are on your own today."
      }
      label="Today"
      suffix={`/${plan.targetReps}`}
      value={String(reps)}
    >
      <Meter percent={(reps / Math.max(1, plan.targetReps)) * 100} />
    </Hero>
  )
}

function StartButton({ reps }: { reps: number }) {
  const router = useRouter()
  const startSession = getStartSession(router)

  return (
    <Button onPress={startSession} style={styles.primaryAction}>
      <Icon as={PlayIcon} />
      <Text className="font-heading text-lg font-bold">
        {reps > 0 ? "Train again" : "Start session"}
      </Text>
    </Button>
  )
}

function ReminderState() {
  const { enableReminders, plan, reminderState } = usePlan()

  if (
    !plan.reminderEnabled ||
    (reminderState !== "ask" && reminderState !== "denied")
  ) {
    return null
  }

  const onPress =
    reminderState === "ask" ? enableReminders : openNotificationSettings

  return <ReminderNudge onPress={onPress} state={reminderState} />
}

export default function TodayPage() {
  const onScroll = useMinimizeOnScroll()
  const { activity } = useActivity()
  const [heading] = useState(() => formatDayLabel(new Date()))
  const todayReps = activity?.todayReps ?? 0

  return (
    <SafeAreaView className="flex-1 bg-background" edges={SCREEN_EDGES}>
      <Animated.ScrollView
        className="flex-1"
        contentContainerStyle={styles.content}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <View className="flex-row items-center justify-between gap-3 py-2">
          <Text className="font-heading text-base font-semibold">
            {heading}
          </Text>
          <StreakChip days={activity?.currentStreak ?? 0} />
        </View>

        <TodayHero reps={todayReps} />
        <StartButton reps={todayReps} />
        <ReminderState />
        <LevelCard activity={activity} />

        <Slab>
          <Overline>Weekly volume</Overline>
          <WeeklyColumns weeks={activity?.weeks ?? EMPTY_WEEKS} />
        </Slab>
      </Animated.ScrollView>
    </SafeAreaView>
  )
}
