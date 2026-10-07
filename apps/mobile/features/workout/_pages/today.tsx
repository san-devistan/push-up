import { EdgeBlur } from "@/components/edge-blur"
import { SettingsIcon } from "@/components/icons"
import { NumericText } from "@/components/numeric-text"
import { Button } from "@/components/ui/button"
import { Surface } from "@/components/ui/surface"
import { Tabs } from "@/components/ui/tabs"
import WorkoutAvatar from "@/features/workout/_components/avatar"
import {
  ActivityHeatmap,
  DailyColumns,
} from "@/features/workout/_components/charts"
import { DailyGoal } from "@/features/workout/_components/daily-goal"
import { Slab } from "@/features/workout/_components/figures"
import { ScreenGlow } from "@/features/workout/_components/screen-glow"
import WorkoutSectionRail from "@/features/workout/_components/section-rail"
import StartButton from "@/features/workout/_components/start-button"
import { Streak } from "@/features/workout/_components/streak"
import SummaryOverlay from "@/features/workout/_components/summary"
import { TodayStats } from "@/features/workout/_components/today-stats"
import { useActivity } from "@/features/workout/_hooks/use-activity"
import { useDelayedValue } from "@/features/workout/_hooks/use-delayed-value"
import { usePlan } from "@/features/workout/_hooks/use-plan"
import { useRecap } from "@/features/workout/_hooks/use-recap"
import type { Activity } from "@/features/workout/_lib/activity"
import { getCurrentWeekActivity } from "@/features/workout/_lib/activity-window"
import { useI18n } from "@/hooks/use-i18n"
import { selectionTick } from "@/lib/haptics"
import { FONT_FAMILY } from "@/lib/theme"
import { Link, Stack } from "expo-router"
import { Text } from "panelui-native"
import { useScrollSections } from "panelui-native/hooks/use-scroll-sections"
import { useEffect, useState } from "react"
import { StyleSheet, View } from "react-native"
import Animated, { FadeInDown, ReduceMotion } from "react-native-reanimated"
import { useCSSVariable } from "uniwind"

const EMPTY_ACTIVITY_DAYS = [] as const
const HOME_SECTION_IDS = ["overview", "goal", "activity", "stats"]
const HOME_VALUE_ANIMATION_DURATION_MS = 1000
const HOME_UPDATE_DELAYS = {
  activity: 1000,
  level: 750,
  reps: 500,
  total: 250,
} as const
const SECTION_ENTERING = HOME_SECTION_IDS.map((_, index) =>
  FadeInDown.duration(260)
    .delay(index * 70)
    .reduceMotion(ReduceMotion.System)
)
const HEADER_FONT_FAMILY =
  process.env.EXPO_OS === "ios" ? "Anton-Regular" : FONT_FAMILY.heading
const HOME_SCREEN_OPTIONS = {
  headerLargeTitleShadowVisible: false,
  headerShadowVisible: false,
  headerShown: true,
  headerTransparent: true,
  scrollEdgeEffects: { top: "hidden" },
  title: "",
} as const
const HOME_TITLE_STYLE = {
  fontFamily: HEADER_FONT_FAMILY,
  fontSize: 32,
  lineHeight: 40,
} as const

const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingBottom: 104,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerTitle: {
    height: 44,
    justifyContent: "center",
    width: 100,
  },
  totalHero: {
    alignItems: "stretch",
    alignSelf: "stretch",
    borderCurve: "continuous",
    borderRadius: 28,
    flexDirection: "row",
    marginHorizontal: 8,
    overflow: "hidden",
    paddingLeft: 16,
    paddingVertical: 16,
  },
  totalHeroAvatar: {
    backgroundColor: "transparent",
    flex: 1,
    transform: [{ scale: 1.15 }],
  },
  totalHeroAvatarLayer: {
    bottom: 0,
    position: "absolute",
    right: 0,
    top: 0,
    width: "60%",
    zIndex: 1,
  },
  totalHeroGradient: {
    bottom: 0,
    experimental_backgroundImage:
      "linear-gradient(to left, rgba(49,159,93,0.36) 0%, rgba(49,159,93,0) 65%)",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  screen: { flex: 1 },
  totalHeroNumber: {
    flexShrink: 0,
    fontSize: 72,
    lineHeight: 88,
    textAlign: "left",
    transform: [{ translateY: -4 }],
  },
  totalHeroNumberLayout: { marginBottom: -16 },
})

const TOTAL_HERO_AVATAR_DOM_PROPS = {
  scrollEnabled: false,
  style: styles.totalHeroAvatar,
}

function SettingsButton() {
  const { t } = useI18n()
  const foregroundValue = useCSSVariable("--color-foreground")
  const foreground =
    typeof foregroundValue === "string" ? foregroundValue : undefined

  return (
    <Link asChild href="/settings">
      <Button
        accessibilityLabel={t("settings.title")}
        className="h-9 w-9 rounded-full"
        size="icon"
        sfx={false}
        variant="ghost"
      >
        <View className="h-6 w-6 items-center justify-center">
          <SettingsIcon color={foreground} fill={foreground} size={24} />
          <View
            className="absolute top-2.5 left-2.5 h-1 w-1 rounded-full bg-background"
            pointerEvents="none"
          />
        </View>
      </Button>
    </Link>
  )
}

function HomeHeaderLeft() {
  return (
    <View style={styles.headerTitle}>
      <Text accessibilityRole="header" style={HOME_TITLE_STYLE}>
        pumpr.
      </Text>
    </View>
  )
}

function TotalHero({ activity }: { activity: Activity | undefined }) {
  const { formatNumber, t } = useI18n()
  const { plan } = usePlan()
  const totalPushups = useDelayedValue(
    activity?.totalPushups ?? 0,
    HOME_UPDATE_DELAYS.total
  )
  const goalCompleted = (activity?.todayReps ?? 0) >= plan.targetReps

  return (
    <Surface
      bordered={false}
      padding="none"
      style={styles.totalHero}
      variant="transparent"
    >
      <View pointerEvents="none" style={styles.totalHeroGradient} />
      <View className="w-full items-start justify-center">
        <NumericText
          align="start"
          animationDuration={HOME_VALUE_ANIMATION_DURATION_MS}
          className="font-heading text-foreground"
          containerStyle={styles.totalHeroNumberLayout}
          direction="up"
          layoutStyle={styles.totalHeroNumber}
          layoutText={formatNumber(totalPushups)}
          reduceMotion="system"
          style={styles.totalHeroNumber}
          value={totalPushups}
        />
        <Text className="font-heading text-base text-foreground">
          {t("today.totalPushups")}
        </Text>
      </View>
      <View pointerEvents="none" style={styles.totalHeroAvatarLayer}>
        <WorkoutAvatar
          animation={goalCompleted ? "celebrate" : "idle"}
          dom={TOTAL_HERO_AVATAR_DOM_PROPS}
        />
      </View>
    </Surface>
  )
}

function ActivitySection({ activity }: { activity: Activity | undefined }) {
  const { t } = useI18n()
  const [today] = useState(Date.now)
  const recentDays = activity?.recentDays ?? EMPTY_ACTIVITY_DAYS
  const dailyDays = getCurrentWeekActivity(today, recentDays)

  return (
    <Slab className="gap-4 pt-3 pr-3 pb-5 pl-5">
      <Tabs className="gap-1" defaultValue="week" onValueChange={selectionTick}>
        <View className="flex-row items-center justify-between gap-4">
          <Text className="font-mono text-xs text-muted-foreground">
            {t("today.activity")}
          </Text>
          <Tabs.List className="w-32">
            <Tabs.Trigger value="week">{t("today.week")}</Tabs.Trigger>
            <Tabs.Trigger value="month">{t("today.month")}</Tabs.Trigger>
          </Tabs.List>
        </View>
        <Tabs.Content value="week">
          <DailyColumns
            animationDuration={HOME_VALUE_ANIMATION_DURATION_MS}
            days={dailyDays}
          />
        </Tabs.Content>
        <Tabs.Content value="month">
          <ActivityHeatmap
            animationDuration={HOME_VALUE_ANIMATION_DURATION_MS}
            recentDays={recentDays}
            today={today}
          />
        </Tabs.Content>
      </Tabs>
    </Slab>
  )
}

export default function TodayPage() {
  const { activity: liveActivity } = useActivity()
  const { settle, state: recap } = useRecap()
  const activity =
    recap.type === "presenting"
      ? recap.before
      : recap.type === "revealed"
        ? recap.activity
        : liveActivity
  const activityGraph = useDelayedValue(activity, HOME_UPDATE_DELAYS.activity)
  const {
    active,
    measure,
    ref: scrollRef,
    scrollProps,
    scrollTo,
  } = useScrollSections({ ids: HOME_SECTION_IDS })

  useEffect(() => {
    if (
      recap.type === "revealed" &&
      liveActivity &&
      liveActivity.totalPushups >= recap.activity.totalPushups
    ) {
      settle()
    }
  }, [liveActivity, recap, settle])

  return (
    <View className="bg-background" style={styles.screen}>
      <ScreenGlow />
      <Animated.ScrollView
        ref={scrollRef}
        {...scrollProps}
        className="flex-1"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
      >
        <Animated.View
          entering={SECTION_ENTERING[0]}
          onLayout={measure("overview")}
        >
          <TotalHero activity={activity} />
        </Animated.View>
        <Animated.View
          entering={SECTION_ENTERING[1]}
          onLayout={measure("goal")}
        >
          <DailyGoal
            activity={activity}
            animationDuration={HOME_VALUE_ANIMATION_DURATION_MS}
            levelUpdateDelay={HOME_UPDATE_DELAYS.level}
            repsUpdateDelay={HOME_UPDATE_DELAYS.reps}
          />
        </Animated.View>
        <Animated.View
          entering={SECTION_ENTERING[2]}
          onLayout={measure("activity")}
        >
          <ActivitySection activity={activityGraph} />
        </Animated.View>
        <Animated.View
          entering={SECTION_ENTERING[3]}
          onLayout={measure("stats")}
        >
          <TodayStats activity={activity} />
        </Animated.View>
      </Animated.ScrollView>
      <EdgeBlur />
      <WorkoutSectionRail
        active={active}
        onValueChange={scrollTo}
        screen="home"
      />
      <Stack.Screen options={HOME_SCREEN_OPTIONS} />
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.View hidesSharedBackground>
          <HomeHeaderLeft />
        </Stack.Toolbar.View>
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.View hidesSharedBackground>
          <View className="flex-row items-center gap-2">
            <Streak
              animationDuration={HOME_VALUE_ANIMATION_DURATION_MS}
              days={activity?.currentStreak ?? 0}
            />
          </View>
        </Stack.Toolbar.View>
        <Stack.Toolbar.View>
          <SettingsButton />
        </Stack.Toolbar.View>
      </Stack.Toolbar>
      <StartButton />
      <SummaryOverlay activity={liveActivity} />
    </View>
  )
}
