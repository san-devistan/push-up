import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Text } from "@/components/ui/text"
import { BadgeGrid } from "@/features/workout/_components/badges"
import {
  ActivityHeatmap,
  DailyColumns,
} from "@/features/workout/_components/charts"
import {
  Hero,
  Meter,
  Overline,
  Slab,
  StatsDivider,
  StatsList,
  StatsListRow,
} from "@/features/workout/_components/figures"
import { useActivity } from "@/features/workout/_hooks/use-activity"
import { usePlan } from "@/features/workout/_hooks/use-plan"
import type { Activity } from "@/features/workout/_lib/activity"
import {
  formatCalories,
  getEstimatedCalories,
} from "@/features/workout/_lib/calories"
import { formatSeconds } from "@/features/workout/_lib/format"
import { getLevel } from "@/features/workout/_lib/gamification"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { useMinimizeOnScroll } from "expo-glass-tabs"
import { Link, useRouter } from "expo-router"
import {
  CheckIcon,
  DumbbellIcon,
  FlameIcon,
  InfoIcon,
  TimerIcon,
  TrendingUpIcon,
  ZapIcon,
} from "lucide-react-native"
import { useState } from "react"
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native"
import Animated from "react-native-reanimated"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"

const SCREEN_EDGES = ["top"] as const
const THREE_MONTH_DAYS = 13 * 7
type ActivityRange = "week" | "quarter"

const ACTIVITY_RANGES = ["week", "quarter"] as const
const EMPTY_WEEK_DAYS = Array.from({ length: 7 }, (_, index) => ({
  date: `placeholder-week-${index}`,
  reps: 0,
}))
const EMPTY_THREE_MONTH_DAYS = Array.from(
  { length: THREE_MONTH_DAYS },
  (_, index) => ({
    date: `placeholder-month-${index}`,
    reps: 0,
  })
)

const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingBottom: 152,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  dailyGoalNumber: { fontSize: 44, lineHeight: 50 },
  dailyGoalSuffix: { fontSize: 22, lineHeight: 28 },
  floatingAction: {
    borderCurve: "continuous",
    borderRadius: 999,
    height: 56,
    position: "absolute",
    right: 20,
    width: 56,
    zIndex: 10,
  },
})

function getStartSession(router: ReturnType<typeof useRouter>) {
  return () => router.push("/session")
}

function getFloatingActionStyle(bottom: number): StyleProp<ViewStyle> {
  return [styles.floatingAction, { bottom }]
}

function formatDays(days: number) {
  return `${days} ${days === 1 ? "day" : "days"}`
}

function StreakChip({ days }: { days: number }) {
  return (
    <View className="flex-row items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1.5">
      <Icon as={FlameIcon} className="text-primary" />
      <Text className="font-heading text-sm font-bold">{formatDays(days)}</Text>
    </View>
  )
}

function GoalCompleteMark() {
  return (
    <View
      accessibilityLabel="Daily goal completed"
      className="flex-row items-center gap-1"
    >
      <Icon as={CheckIcon} className="text-primary" size={14} />
      <Text className="font-heading text-xs uppercase tracking-[3px]">
        Done
      </Text>
    </View>
  )
}

function TotalHero({ activity }: { activity: Activity | undefined }) {
  const colorScheme = useColorScheme()

  return (
    <Hero
      label="Total push-ups"
      tone={colorScheme === "dark" ? "light" : "dark"}
      value={activity ? activity.totalPushups.toLocaleString() : "-"}
    />
  )
}

function DailyGoalCard({ activity }: { activity: Activity | undefined }) {
  const { plan } = usePlan()
  const todayReps = activity?.todayReps ?? 0
  const goalCompleted = todayReps >= plan.targetReps

  return (
    <Slab className="gap-3">
      <View className="flex-row items-stretch justify-between gap-3">
        <View className="gap-3">
          <Overline>Daily goal</Overline>
          <Text
            selectable
            className="font-heading font-extrabold tabular-nums"
            style={styles.dailyGoalNumber}
          >
            {todayReps.toLocaleString()}
            <Text
              className="text-muted-foreground"
              style={styles.dailyGoalSuffix}
            >
              /{plan.targetReps.toLocaleString()}
            </Text>
          </Text>
        </View>
        <View className="-mr-2 -mt-2 items-end justify-between">
          <StreakChip days={activity?.currentStreak ?? 0} />
          {goalCompleted ? <GoalCompleteMark /> : null}
        </View>
      </View>
      <Meter percent={(todayReps / Math.max(1, plan.targetReps)) * 100} />
    </Slab>
  )
}

function LevelInfoButton() {
  return (
    <Link asChild href="/levels">
      <Pressable
        accessibilityLabel="Open level milestones"
        accessibilityRole="button"
        className="size-9 items-center justify-center rounded-full bg-background active:opacity-70 dark:bg-muted"
      >
        <Icon as={InfoIcon} className="text-muted-foreground" />
      </Pressable>
    </Link>
  )
}

function LevelCard({ activity }: { activity: Activity | undefined }) {
  const { level, milestones, percent } = getLevel({
    bestStreak: activity?.bestStreak ?? 0,
    recentDays: activity?.recentDays ?? [],
    totalReps: activity?.totalPushups ?? 0,
  })

  return (
    <Slab>
      <View className="flex-row items-start justify-between gap-3">
        <Text className="flex-1 font-heading text-2xl font-bold">
          Level {level}
        </Text>
        <LevelInfoButton />
      </View>
      <Meter percent={percent} />
      <BadgeGrid badges={milestones} />
    </Slab>
  )
}

function setActivityRange(
  setRange: (range: ActivityRange) => void,
  range: ActivityRange
) {
  return () => setRange(range)
}

function ActivityRangeToggle({
  range,
  setRange,
}: {
  range: ActivityRange
  setRange: (range: ActivityRange) => void
}) {
  return (
    <View className="flex-row rounded-full bg-background p-1 dark:bg-muted">
      {ACTIVITY_RANGES.map((item) => (
        <Pressable
          accessibilityRole="button"
          className={
            range === item
              ? "rounded-full bg-border px-3 py-1.5 dark:bg-background"
              : "rounded-full px-3 py-1.5"
          }
          key={item}
          onPress={setActivityRange(setRange, item)}
        >
          <Text className="text-xs font-semibold">
            {item === "week" ? "Week" : "3 months"}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}

function ActivitySection({ activity }: { activity: Activity | undefined }) {
  const [range, setRange] = useState<ActivityRange>("week")
  const dailyDays = activity?.recentDays.slice(-7) ?? EMPTY_WEEK_DAYS
  const heatmapDays =
    activity?.recentDays.slice(-THREE_MONTH_DAYS) ?? EMPTY_THREE_MONTH_DAYS

  return (
    <Slab>
      <View className="flex-row items-center justify-between gap-4">
        <Overline>Activity</Overline>
        <ActivityRangeToggle range={range} setRange={setRange} />
      </View>
      {range === "week" ? (
        <DailyColumns days={dailyDays} />
      ) : (
        <ActivityHeatmap days={heatmapDays} />
      )}
    </Slab>
  )
}

function StatsSection({ activity }: { activity: Activity | undefined }) {
  const successRate = activity ? `${activity.successRate}%` : "-"
  const averageRep = activity ? formatSeconds(activity.averageRepMs) : "-"
  const sessions = activity ? String(activity.totalSessions) : "-"
  const bestStreak = activity ? formatDays(activity.bestStreak) : "-"
  const calories = activity
    ? formatCalories(getEstimatedCalories(activity.totalAttempts))
    : "-"

  return (
    <StatsList>
      <StatsListRow
        icon={TrendingUpIcon}
        label="Success rate"
        value={successRate}
      />
      <StatsDivider />
      <StatsListRow icon={TimerIcon} label="Avg rep" value={averageRep} />
      <StatsDivider />
      <StatsListRow icon={DumbbellIcon} label="Sessions" value={sessions} />
      <StatsDivider />
      <StatsListRow icon={FlameIcon} label="Best streak" value={bestStreak} />
      <StatsDivider />
      <StatsListRow icon={ZapIcon} label="Calories" value={calories} />
    </StatsList>
  )
}

function StartButton() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const startSession = getStartSession(router)
  const floatingActionStyle = getFloatingActionStyle(
    Math.max(insets.bottom - 16, 12) + 72
  )

  return (
    <Button
      accessibilityLabel="Start session"
      onPress={startSession}
      size="icon-lg"
      style={floatingActionStyle}
    >
      <Icon as={DumbbellIcon} size={26} />
    </Button>
  )
}

export default function TodayPage() {
  const onScroll = useMinimizeOnScroll()
  const { activity } = useActivity()

  return (
    <SafeAreaView className="flex-1 bg-background" edges={SCREEN_EDGES}>
      <Animated.ScrollView
        className="flex-1"
        contentContainerStyle={styles.content}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <DailyGoalCard activity={activity} />
        <TotalHero activity={activity} />
        <LevelCard activity={activity} />
        <ActivitySection activity={activity} />
        <StatsSection activity={activity} />
      </Animated.ScrollView>
      <StartButton />
    </SafeAreaView>
  )
}
