import { EdgeBlur } from "@/components/edge-blur"
import { FlameIcon, SettingsIcon } from "@/components/icons"
import { NUMERIC_TEXT_SLOT, NumericPhrase } from "@/components/numeric-text"
import { Button } from "@/components/ui/button"
import { Tabs } from "@/components/ui/tabs"
import WorkoutAvatar from "@/features/workout/_components/avatar.dom"
import { BadgeGrid } from "@/features/workout/_components/badges"
import {
  ActivityHeatmap,
  DailyColumns,
} from "@/features/workout/_components/charts"
import { DailyGoal } from "@/features/workout/_components/daily-goal"
import ExpressionGallery from "@/features/workout/_components/expression-gallery.dom"
import { Meter, Slab } from "@/features/workout/_components/figures"
import WorkoutSectionRail from "@/features/workout/_components/section-rail"
import StartButton from "@/features/workout/_components/start-button"
import { TodayStats } from "@/features/workout/_components/today-stats"
import { useActivity } from "@/features/workout/_hooks/use-activity"
import { usePlan } from "@/features/workout/_hooks/use-plan"
import type { Activity } from "@/features/workout/_lib/activity"
import { getCurrentWeekActivity } from "@/features/workout/_lib/activity-window"
import { getLevel } from "@/features/workout/_lib/gamification"
import { useI18n } from "@/hooks/use-i18n"
import { hapticHard } from "@/lib/haptics"
import { FONT_FAMILY } from "@/lib/theme"
import { Link, Stack } from "expo-router"
import { Text } from "panelui-native"
import { useScrollSections } from "panelui-native/hooks/use-scroll-sections"
import { useState } from "react"
import { Pressable, StyleSheet, View } from "react-native"
import Animated, { FadeInUp } from "react-native-reanimated"
import { useCSSVariable } from "uniwind"

const EMPTY_ACTIVITY_DAYS = [] as const
const HOME_SECTION_IDS = ["overview", "goal", "level", "activity", "stats"]
const NUMBER_ENTERING = FadeInUp.duration(240)
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
  expressionGallery: { height: 2540, width: "100%" },
  headerTitle: {
    height: 44,
    justifyContent: "center",
    width: 100,
  },
  levelValue: { marginStart: -14, transform: [{ translateY: 0 }] },
  totalHero: {
    alignItems: "stretch",
    alignSelf: "stretch",
    flexDirection: "row",
  },
  totalHeroAvatar: {
    backgroundColor: "transparent",
    flex: 1,
  },
  screen: { flex: 1 },
  totalHeroNumber: {
    fontSize: 72,
    lineHeight: 88,
    marginBottom: -16,
  },
})

const TOTAL_HERO_AVATAR_DOM_PROPS = {
  scrollEnabled: false,
  style: styles.totalHeroAvatar,
}
const EXPRESSION_GALLERY_DOM_PROPS = {
  contentInsetAdjustmentBehavior: "never" as const,
  scrollEnabled: false,
  style: styles.expressionGallery,
}
const SHOW_LEVEL_CARD = false

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

function Streak() {
  const { activity } = useActivity()
  const { formatNumber, t } = useI18n()
  const foregroundValue = useCSSVariable("--color-foreground")
  const foreground =
    typeof foregroundValue === "string" ? foregroundValue : undefined
  const days = activity?.currentStreak ?? 0

  return (
    <View className="flex-row items-center">
      <FlameIcon color={foreground} fill={foreground} size={24} />
      <Text
        accessibilityLabel={`${formatNumber(days)} ${t(days === 1 ? "common.day" : "common.days")}`}
        className="pt-1 font-heading text-2xl"
      >
        {formatNumber(days)}
      </Text>
    </View>
  )
}

function TotalHero({ activity }: { activity: Activity | undefined }) {
  const { formatNumber, t } = useI18n()
  const { plan } = usePlan()
  const goalCompleted = (activity?.todayReps ?? 0) >= plan.targetReps

  return (
    <View style={styles.totalHero}>
      <View className="my-4 ml-2 flex-1 items-start">
        <Text
          className="font-heading text-foreground"
          style={styles.totalHeroNumber}
        >
          {formatNumber(activity?.totalPushups ?? 0)}
        </Text>
        <Text className="font-heading text-base text-foreground">
          {t("today.totalPushups")}
        </Text>
      </View>
      <WorkoutAvatar
        animation={goalCompleted ? "celebrate" : "idle"}
        dom={TOTAL_HERO_AVATAR_DOM_PROPS}
      />
    </View>
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
    <Link asChild href="/levels">
      <Pressable
        accessibilityLabel={t("today.openLevels")}
        onPress={hapticHard}
      >
        <Slab>
          <View className="flex-row items-center gap-4">
            <Animated.View
              className="shrink-0 items-start"
              entering={NUMBER_ENTERING}
              key={level}
            >
              <NumericPhrase
                className="font-heading text-2xl"
                containerClassName="items-end"
                style={styles.levelValue}
                template={t("today.level", { level: NUMERIC_TEXT_SLOT })}
                textClassName="font-heading text-2xl"
                value={level}
              />
            </Animated.View>
            <Meter className="flex-1" percent={percent} />
          </View>
          <BadgeGrid badges={milestones} />
        </Slab>
      </Pressable>
    </Link>
  )
}

function ActivitySection({ activity }: { activity: Activity | undefined }) {
  const { t } = useI18n()
  const [today] = useState(Date.now)
  const recentDays = activity?.recentDays ?? EMPTY_ACTIVITY_DAYS
  const dailyDays = getCurrentWeekActivity(today, recentDays)

  return (
    <Slab className="gap-4 pt-3 pr-3 pb-5 pl-5">
      <Tabs className="gap-4" defaultValue="week" onValueChange={hapticHard}>
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
          <DailyColumns days={dailyDays} />
        </Tabs.Content>
        <Tabs.Content value="month">
          <ActivityHeatmap recentDays={recentDays} today={today} />
        </Tabs.Content>
      </Tabs>
    </Slab>
  )
}

export default function TodayPage() {
  const { activity } = useActivity()
  const {
    active,
    measure,
    ref: scrollRef,
    scrollProps,
    scrollTo,
  } = useScrollSections({ ids: HOME_SECTION_IDS })

  return (
    <View style={styles.screen}>
      <Animated.ScrollView
        ref={scrollRef}
        {...scrollProps}
        className="flex-1"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
      >
        <View onLayout={measure("overview")}>
          <TotalHero activity={activity} />
        </View>
        <View onLayout={measure("goal")}>
          <DailyGoal activity={activity} />
        </View>
        <View onLayout={measure("level")}>
          {SHOW_LEVEL_CARD ? <LevelCard activity={activity} /> : null}
        </View>
        <View onLayout={measure("activity")}>
          <ActivitySection activity={activity} />
        </View>
        <View onLayout={measure("stats")}>
          <TodayStats activity={activity} />
        </View>
        <ExpressionGallery dom={EXPRESSION_GALLERY_DOM_PROPS} />
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
          <Streak />
        </Stack.Toolbar.View>
        <Stack.Toolbar.View>
          <SettingsButton />
        </Stack.Toolbar.View>
      </Stack.Toolbar>
      <StartButton />
    </View>
  )
}
