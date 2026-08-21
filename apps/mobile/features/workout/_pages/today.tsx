import {
  NUMERIC_TEXT_SLOT,
  NumericPhrase,
  NumericText,
} from "@/components/numeric-text"
import WorkoutAvatar from "@/features/workout/_components/avatar.dom"
import { BadgeGrid } from "@/features/workout/_components/badges"
import {
  ActivityHeatmap,
  DailyColumns,
} from "@/features/workout/_components/charts"
import { Meter, Overline, Slab } from "@/features/workout/_components/figures"
import { TodayStats } from "@/features/workout/_components/today-stats"
import { useActivity } from "@/features/workout/_hooks/use-activity"
import { usePlan } from "@/features/workout/_hooks/use-plan"
import type { Activity } from "@/features/workout/_lib/activity"
import { getCurrentWeekActivity } from "@/features/workout/_lib/activity-window"
import { getLevel } from "@/features/workout/_lib/gamification"
import { useI18n } from "@/hooks/use-i18n"
import { hapticHard } from "@/lib/haptics"
import { Link, useRouter } from "expo-router"
import {
  Button,
  CheckIcon,
  InfoIcon,
  MenuIcon,
  SparklesIcon,
  Text,
} from "panelui-native"
import { useState } from "react"
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native"
import Animated, { FadeInUp } from "react-native-reanimated"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { useCSSVariable } from "uniwind"

const SCREEN_EDGES = ["top"] as const
type ActivityRange = "month" | "week"

const ACTIVITY_RANGES = ["week", "month"] as const
const EMPTY_ACTIVITY_DAYS = [] as const
const NUMBER_ENTERING = FadeInUp.duration(240)

const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingBottom: 104,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  dailyGoalNumber: { fontSize: 44, lineHeight: 50 },
  dailyGoalSuffix: { fontSize: 22, lineHeight: 28 },
  dailyGoalTarget: { fontSize: 22, lineHeight: 28 },
  floatingAction: {
    borderRadius: 999,
    height: 56,
    left: 48,
    position: "absolute",
    right: 48,
    zIndex: 10,
  },
  goalAvatar: {
    backgroundColor: "transparent",
    flexShrink: 0,
    height: 88,
    width: 88,
  },
  screen: { flex: 1 },
  totalHeroNumber: { fontSize: 72, lineHeight: 78 },
})

const GOAL_AVATAR_DOM_PROPS = {
  scrollEnabled: false,
  style: styles.goalAvatar,
}

function getStartSession(router: ReturnType<typeof useRouter>) {
  return () => router.push("/session")
}

function getFloatingActionStyle(bottom: number): StyleProp<ViewStyle> {
  return [styles.floatingAction, { bottom }]
}

function StreakChip({ days }: { days: number }) {
  const { formatNumber, t } = useI18n()
  const primary = useCSSVariable("--color-primary")

  return (
    <View className="flex-row items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1.5">
      <SparklesIcon color={typeof primary === "string" ? primary : undefined} />
      <NumericText
        accessibilityLabel={`${formatNumber(days)} ${t(days === 1 ? "common.day" : "common.days")}`}
        className="text-sm"
        value={days}
      />
    </View>
  )
}

function SettingsButton() {
  const { t } = useI18n()

  return (
    <Link asChild href="/settings">
      <Button
        accessibilityLabel={t("settings.title")}
        className="h-9 w-9 rounded-full bg-muted"
        size="icon"
        variant="ghost"
      >
        <MenuIcon />
      </Button>
    </Link>
  )
}

function GoalCompleteMark() {
  const { t } = useI18n()
  const primary = useCSSVariable("--color-primary")

  return (
    <View
      accessibilityLabel={t("today.dailyGoalCompleted")}
      className="flex-row items-center gap-1"
    >
      <CheckIcon
        color={typeof primary === "string" ? primary : undefined}
        size={14}
      />
      <Text className="font-mono text-xs tracking-[3px] uppercase">
        {t("today.done")}
      </Text>
    </View>
  )
}

function TotalHero({ activity }: { activity: Activity | undefined }) {
  const { t } = useI18n()

  return (
    <View className="gap-1 px-1 py-2">
      <Text className="font-heading text-sm text-foreground">
        {t("today.totalPushups")}
      </Text>
      <NumericText
        className="text-foreground"
        style={styles.totalHeroNumber}
        value={activity?.totalPushups ?? 0}
      />
    </View>
  )
}

function DailyGoalCard({ activity }: { activity: Activity | undefined }) {
  const { t } = useI18n()
  const { plan } = usePlan()
  const todayReps = activity?.todayReps ?? 0
  const goalCompleted = todayReps >= plan.targetReps

  return (
    <Slab className="gap-3">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 gap-3">
          <View className="flex-row items-center justify-between gap-2">
            <Overline>{t("plan.dailyGoal")}</Overline>
            {goalCompleted ? (
              <Animated.View entering={NUMBER_ENTERING} key={todayReps}>
                <GoalCompleteMark />
              </Animated.View>
            ) : null}
          </View>
          <View className="flex-row items-end">
            <NumericText style={styles.dailyGoalNumber} value={todayReps} />
            <Text
              className="text-muted-foreground"
              style={styles.dailyGoalSuffix}
            >
              /
            </Text>
            <NumericText
              className="text-muted-foreground"
              style={styles.dailyGoalTarget}
              value={plan.targetReps}
            />
          </View>
        </View>
        <WorkoutAvatar
          animation={goalCompleted ? "celebrate" : "idle"}
          dom={GOAL_AVATAR_DOM_PROPS}
        />
      </View>
      <Meter percent={(todayReps / Math.max(1, plan.targetReps)) * 100} />
    </Slab>
  )
}

function LevelInfoButton() {
  const { t } = useI18n()
  const mutedForeground = useCSSVariable("--color-muted-foreground")

  return (
    <Link asChild href="/levels">
      <Button
        accessibilityLabel={t("today.openLevels")}
        className="h-9 w-9 rounded-full bg-background dark:bg-muted"
        size="icon"
        variant="ghost"
      >
        <InfoIcon
          color={
            typeof mutedForeground === "string" ? mutedForeground : undefined
          }
        />
      </Button>
    </Link>
  )
}

function LevelCard({ activity }: { activity: Activity | undefined }) {
  const { t } = useI18n()
  const { plan } = usePlan()
  const { level, milestones, percent } = getLevel({
    bestStreak: activity?.bestStreak ?? 0,
    dailyGoal: plan.targetReps,
    recentDays: activity?.recentDays ?? [],
    totalReps: activity?.totalPushups ?? 0,
  })

  return (
    <Slab>
      <View className="flex-row items-start justify-between gap-3">
        <Animated.View
          className="flex-1"
          entering={NUMBER_ENTERING}
          key={level}
        >
          <NumericPhrase
            className="text-2xl"
            template={t("today.level", { level: NUMERIC_TEXT_SLOT })}
            textClassName="text-2xl font-bold"
            value={level}
          />
        </Animated.View>
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
  return () => {
    hapticHard()
    setRange(range)
  }
}

function ActivityRangeToggle({
  range,
  setRange,
}: {
  range: ActivityRange
  setRange: (range: ActivityRange) => void
}) {
  const { t } = useI18n()

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
          <Text className="font-semibold text-xs">
            {t(item === "week" ? "today.week" : "today.oneMonth")}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}

function ActivitySection({ activity }: { activity: Activity | undefined }) {
  const { t } = useI18n()
  const [range, setRange] = useState<ActivityRange>("week")
  const [today] = useState(Date.now)
  const recentDays = activity?.recentDays ?? EMPTY_ACTIVITY_DAYS
  const dailyDays = getCurrentWeekActivity(today, recentDays)

  return (
    <Slab>
      <View className="flex-row items-center justify-between gap-4">
        <Overline>{t("today.activity")}</Overline>
        <ActivityRangeToggle range={range} setRange={setRange} />
      </View>
      {range === "week" ? (
        <DailyColumns days={dailyDays} />
      ) : (
        <ActivityHeatmap recentDays={recentDays} today={today} />
      )}
    </Slab>
  )
}

function StartButton() {
  const { t } = useI18n()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const startSession = getStartSession(router)
  const floatingActionStyle = getFloatingActionStyle(
    Math.max(insets.bottom - 16, 12)
  )

  return (
    <Button
      accessibilityLabel={t("today.startSession")}
      labelClassName="font-heading lowercase"
      onPress={startSession}
      style={floatingActionStyle}
    >
      {t("today.startSession")}
    </Button>
  )
}

export default function TodayPage() {
  const { activity } = useActivity()

  return (
    <SafeAreaView edges={SCREEN_EDGES} style={styles.screen}>
      <Animated.ScrollView
        className="flex-1"
        contentContainerStyle={styles.content}
      >
        <View className="flex-row items-center justify-between gap-3 px-1">
          <Text accessibilityRole="header" className="font-heading text-2xl">
            pumpr.
          </Text>
          <View className="flex-row items-center gap-2">
            <StreakChip days={activity?.currentStreak ?? 0} />
            <SettingsButton />
          </View>
        </View>
        <TotalHero activity={activity} />
        <DailyGoalCard activity={activity} />
        <LevelCard activity={activity} />
        <ActivitySection activity={activity} />
        <TodayStats activity={activity} />
      </Animated.ScrollView>
      <StartButton />
    </SafeAreaView>
  )
}
