import { EdgeBlur } from "@/components/edge-blur"
import {
  AlertTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CrosshairIcon,
  PlayIcon,
  SolidBellIcon,
  TrophyIcon,
  Volume2Icon,
  type IconProps,
} from "@/components/icons"
import { NumericText } from "@/components/numeric-text"
import { Button } from "@/components/ui/button"
import { AppBlockerSettings } from "@/features/app-blocker/_components/settings"
import { PreferencesSection } from "@/features/preferences/_components/section"
import { usePreferences } from "@/features/preferences/_hooks/use-preferences"
import AppIdentity from "@/features/workout/_components/app-identity"
import { Connect } from "@/features/workout/_components/connect"
import { Overline, Slab } from "@/features/workout/_components/figures"
import WorkoutSectionRail from "@/features/workout/_components/section-rail"
import TrainingTimes from "@/features/workout/_components/training-times"
import { usePlan } from "@/features/workout/_hooks/use-plan"
import {
  goalAtIndex,
  LAST_GOAL_INDEX,
  nearestGoalIndex,
} from "@/features/workout/_lib/goal"
import type { ReminderState } from "@/features/workout/_lib/reminders"
import type { TrainingPlan } from "@/features/workout/_lib/storage"
import { useI18n } from "@/hooks/use-i18n"
import { hapticFeedback, selectionTick } from "@/lib/haptics"
import { FONT_FAMILY } from "@/lib/theme"
import { Host, Switch } from "@expo/ui"
import { Link, Stack, useRouter } from "expo-router"
import { Slider, Text } from "panelui-native"
import { useScrollSections } from "panelui-native/hooks/use-scroll-sections"
import type { ComponentType } from "react"
import { Pressable, ScrollView, StyleSheet, View } from "react-native"
import { useCSSVariable } from "uniwind"

const SETTINGS_SECTION_IDS = ["training", "sync"]
const DEBUG_SETTINGS_SECTION_IDS = ["training", "preferences", "sync"]
const SETTINGS_READING_LINE = 320
const HEADER_FONT_FAMILY =
  process.env.EXPO_OS === "ios" ? "Anton-Regular" : FONT_FAMILY.heading
const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingBottom: 104,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  screen: { flex: 1 },
})
const SETTINGS_SCREEN_OPTIONS = {
  headerBackVisible: false,
  headerLargeTitleShadowVisible: false,
  headerLeft: renderSettingsBackButton,
  headerShadowVisible: false,
  headerShown: true,
  headerTransparent: true,
  scrollEdgeEffects: { top: "soft" },
} as const
const SETTINGS_TITLE_STYLE = {
  fontFamily: HEADER_FONT_FAMILY,
  fontSize: 24,
} as const
const SETTINGS_LARGE_TITLE_STYLE = {
  fontFamily: HEADER_FONT_FAMILY,
  fontSize: 44,
} as const
const formatGoalIndex = (index: number) => String(goalAtIndex(index))

function getSettingsRailSections(t: ReturnType<typeof useI18n>["t"]) {
  return [
    { label: t("plan.trainingSettings"), value: "training" },
    { label: t("connect.account"), value: "sync" },
  ]
}

function Divider() {
  return <View className="h-px bg-border" />
}

function SettingsBackButton() {
  const { t } = useI18n()
  const router = useRouter()

  return (
    <Button
      accessibilityLabel={t("levels.goBack")}
      className="h-10 w-10 rounded-full"
      onPress={router.back}
      size="icon"
      sfx={false}
      variant="ghost"
    >
      <ChevronLeftIcon strokeWidth={3} />
    </Button>
  )
}

function renderSettingsBackButton() {
  return <SettingsBackButton />
}

function getSetTarget(
  updatePlan: (patch: Partial<TrainingPlan>) => void,
  selected: number
) {
  return (index: number) => {
    if (index === selected) return
    selected = index
    selectionTick()
    updatePlan({ targetReps: goalAtIndex(index) })
  }
}

function getSetPlanBoolean(
  key: "reminderEnabled" | "soundEnabled",
  updatePlan: (patch: Partial<TrainingPlan>) => void
) {
  return (value: boolean) => {
    hapticFeedback(
      value ? "toggle-on" : "toggle-off",
      key === "soundEnabled" ? true : undefined
    )
    updatePlan({ [key]: value })
  }
}

function SettingRow({
  checked,
  icon,
  label,
  onCheckedChange,
}: {
  checked: boolean
  icon: ComponentType<IconProps>
  label: string
  onCheckedChange: (checked: boolean) => void
}) {
  const SettingIcon = icon

  return (
    <View
      accessibilityLabel={label}
      className="flex-row items-center justify-between gap-4"
    >
      <SettingIcon size={18} />
      {/* The row owns the label; the native switch would print a second one. */}
      <Text className="flex-1 font-semibold">{label}</Text>
      <Host matchContents>
        <Switch onValueChange={onCheckedChange} value={checked} />
      </Host>
    </View>
  )
}

function GoalFields() {
  const { t } = useI18n()
  const { plan, updatePlan } = usePlan()
  const targetIndex = nearestGoalIndex(plan.targetReps)
  const setTarget = getSetTarget(updatePlan, targetIndex)

  return (
    <>
      <View className="flex-row items-center gap-4">
        <CrosshairIcon size={18} />
        <Text className="flex-1 font-semibold">{t("plan.dailyGoal")}</Text>
        <NumericText align="end" className="text-xl" value={plan.targetReps} />
      </View>
      {/* A darker track: on the card's own surface the default one reads as a
          flat pill, so nothing says the thumb can be dragged. */}
      <Slider
        formatValue={formatGoalIndex}
        headerClassName="hidden"
        label={t("accessibility.dailyGoal")}
        max={LAST_GOAL_INDEX}
        onValueChange={setTarget}
        step={1}
        trackClassName="bg-foreground/15"
        value={targetIndex}
      />
    </>
  )
}

function PermissionNotice({ state }: { state: ReminderState }) {
  const { t } = useI18n()
  const { enableReminders } = usePlan()
  const destructive = useCSSVariable("--color-destructive")

  if (state === "ask") {
    return (
      <Button onPress={enableReminders} variant="outline">
        <SolidBellIcon />
        {t("plan.allowNotifications")}
      </Button>
    )
  }

  if (state !== "denied") {
    return null
  }

  return (
    <View className="flex-row items-center gap-3 rounded-2xl bg-destructive/10 p-3">
      <AlertTriangleIcon
        color={typeof destructive === "string" ? destructive : undefined}
      />
      <Text className="flex-1 text-sm">{t("plan.notificationsOff")}</Text>
    </View>
  )
}

function NotificationRows() {
  const { t } = useI18n()
  const { plan, reminderState, updatePlan } = usePlan()
  const setEnabled = getSetPlanBoolean("reminderEnabled", updatePlan)

  return (
    <>
      <SettingRow
        checked={plan.reminderEnabled}
        icon={SolidBellIcon}
        label={t("plan.notification")}
        onCheckedChange={setEnabled}
      />
      {plan.reminderEnabled ? <PermissionNotice state={reminderState} /> : null}
    </>
  )
}

function SoundRow() {
  const { t } = useI18n()
  const { plan, updatePlan } = usePlan()
  const setSound = getSetPlanBoolean("soundEnabled", updatePlan)

  return (
    <SettingRow
      checked={plan.soundEnabled}
      icon={Volume2Icon}
      label={t("plan.soundEffects")}
      onCheckedChange={setSound}
    />
  )
}

function LevelsRow() {
  const { locale, t } = useI18n()
  const label = t("levels.levels").toLocaleLowerCase(locale)

  return (
    <Link asChild href="/levels">
      <Pressable
        accessibilityLabel={label}
        className="min-h-8 flex-row items-center gap-4 active:opacity-60"
        hitSlop={6}
        onPress={selectionTick}
      >
        <TrophyIcon size={18} />
        <Text className="flex-1 font-semibold capitalize">{label}</Text>
        <ChevronRightIcon size={18} />
      </Pressable>
    </Link>
  )
}

function ReplayOnboardingRow() {
  const { t } = useI18n()
  const label = t("plan.replayOnboarding")

  return (
    <Link asChild href="/onboarding">
      <Pressable
        accessibilityLabel={label}
        className="min-h-8 flex-row items-center gap-4 active:opacity-60"
        hitSlop={6}
        onPress={selectionTick}
      >
        <PlayIcon size={18} />
        <Text className="flex-1 font-semibold">{label}</Text>
        <ChevronRightIcon size={18} />
      </Pressable>
    </Link>
  )
}

export default function SettingsPage() {
  const { debugMode } = usePreferences()
  const { locale, t } = useI18n()
  const title = `${t("settings.title").toLocaleLowerCase(locale)}.`
  const sectionIds = debugMode
    ? DEBUG_SETTINGS_SECTION_IDS
    : SETTINGS_SECTION_IDS
  const sections = debugMode ? undefined : getSettingsRailSections(t)
  const {
    active,
    measure,
    ref: scrollRef,
    scrollProps,
    scrollTo,
  } = useScrollSections({
    endThreshold: 0,
    ids: sectionIds,
    offset: SETTINGS_READING_LINE,
    scrollPadding: SETTINGS_READING_LINE,
  })

  return (
    <>
      <ScrollView
        ref={scrollRef}
        {...scrollProps}
        className="flex-1"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        style={styles.screen}
      >
        <View onLayout={measure("training")}>
          <Slab>
            <Overline>{t("plan.trainingSettings")}</Overline>
            <GoalFields />
            <Divider />
            <TrainingTimes />
            <Divider />
            <NotificationRows />
            <Divider />
            <SoundRow />
            <Divider />
            {process.env.EXPO_OS === "ios" ? <AppBlockerSettings /> : null}
            {process.env.EXPO_OS === "ios" ? <Divider /> : null}
            <LevelsRow />
            <Divider />
            <ReplayOnboardingRow />
          </Slab>
        </View>

        {debugMode ? (
          <View onLayout={measure("preferences")}>
            <Slab>
              <Overline>{t("plan.preferences")}</Overline>
              <PreferencesSection />
            </Slab>
          </View>
        ) : null}

        <View className="gap-4" onLayout={measure("sync")}>
          <Connect />
          <AppIdentity />
        </View>
      </ScrollView>
      <EdgeBlur />
      <WorkoutSectionRail
        active={active}
        onValueChange={scrollTo}
        screen="settings"
        sections={sections}
      />
      <Stack.Screen options={SETTINGS_SCREEN_OPTIONS} />
      <Stack.Title
        large
        largeStyle={SETTINGS_LARGE_TITLE_STYLE}
        style={SETTINGS_TITLE_STYLE}
      >
        {title}
      </Stack.Title>
    </>
  )
}
