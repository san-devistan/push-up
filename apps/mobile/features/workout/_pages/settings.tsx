import { EdgeBlur } from "@/components/edge-blur"
import {
  AlertTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CrosshairIcon,
  PlusIcon,
  RepeatIcon,
  SolidBellIcon,
  TrophyIcon,
  Volume2Icon,
  XIcon,
  type IconProps,
} from "@/components/icons"
import {
  NUMERIC_TEXT_SLOT,
  NumericPhrase,
  NumericText,
} from "@/components/numeric-text"
import { Button } from "@/components/ui/button"
import { PreferencesSection } from "@/features/preferences/_components/section"
import { usePreferences } from "@/features/preferences/_hooks/use-preferences"
import { Connect } from "@/features/workout/_components/connect"
import { Overline, Slab } from "@/features/workout/_components/figures"
import WorkoutSectionRail from "@/features/workout/_components/section-rail"
import TimeControl from "@/features/workout/_components/time-control"
import { usePlan } from "@/features/workout/_hooks/use-plan"
import { formatClock } from "@/features/workout/_lib/format"
import {
  goalAtIndex,
  LAST_GOAL_INDEX,
  MAX_TRAINING_TIMES,
  nearestGoalIndex,
  repsPerSession,
} from "@/features/workout/_lib/goal"
import type { ReminderState } from "@/features/workout/_lib/reminders"
import type {
  TrainingPlan,
  TrainingTime,
} from "@/features/workout/_lib/storage"
import { useI18n } from "@/hooks/use-i18n"
import { hapticFeedback, hapticForward, selectionTick } from "@/lib/haptics"
import { FONT_FAMILY } from "@/lib/theme"
import Constants from "expo-constants"
import { Link, Stack, useRouter } from "expo-router"
import { Slider, Switch, Text } from "panelui-native"
import { useScrollSections } from "panelui-native/hooks/use-scroll-sections"
import type { ComponentType } from "react"
import { Pressable, ScrollView, StyleSheet, View } from "react-native"
import { useCSSVariable } from "uniwind"

const APP_NAME = Constants.expoConfig?.name ?? "pumpr."
const APP_VERSION = Constants.expoConfig?.version ?? "dev"
const SETTINGS_SECTION_IDS = ["training", "preferences", "sync"]
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

function nextTrainingTime(times: readonly TrainingTime[]): TrainingTime {
  const last = times.at(-1) ?? { hour: 8, minute: 0 }
  return { hour: (last.hour + 4) % 24, minute: last.minute }
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

function getTimeChange(
  index: number,
  onChange: (index: number, time: TrainingTime) => void
) {
  return (hour: number, minute: number) => onChange(index, { hour, minute })
}

function getTimeRemove(index: number, onRemove: (index: number) => void) {
  return () => onRemove(index)
}

function getChangeTime(
  times: readonly TrainingTime[],
  updatePlan: (patch: Partial<TrainingPlan>) => void
) {
  return (index: number, time: TrainingTime) =>
    updatePlan({
      reminderTimes: times.map((item, at) => (at === index ? time : item)),
    })
}

function getRemoveTime(
  times: readonly TrainingTime[],
  updatePlan: (patch: Partial<TrainingPlan>) => void
) {
  return (index: number) =>
    updatePlan({ reminderTimes: times.filter((_, at) => at !== index) })
}

function getAddTime(
  times: readonly TrainingTime[],
  updatePlan: (patch: Partial<TrainingPlan>) => void
) {
  return () =>
    updatePlan({ reminderTimes: [...times, nextTrainingTime(times)] })
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
    <View className="flex-row items-center justify-between gap-4">
      <SettingIcon size={18} />
      <Text className="flex-1 font-semibold">{label}</Text>
      <Switch onValueChange={onCheckedChange} value={checked} />
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
      <Slider
        formatValue={formatGoalIndex}
        headerClassName="hidden"
        label={t("accessibility.dailyGoal")}
        max={LAST_GOAL_INDEX}
        onValueChange={setTarget}
        step={1}
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

function TimeRow({
  index,
  onChange,
  onRemove,
  time,
}: {
  index: number
  onChange: (index: number, time: TrainingTime) => void
  onRemove: (index: number) => void
  time: TrainingTime
}) {
  const { clockFormat } = usePreferences()
  const { locale, t } = useI18n()
  const change = getTimeChange(index, onChange)
  const remove = getTimeRemove(index, onRemove)

  return (
    <View className="flex-row items-center gap-3">
      <Button
        accessibilityLabel={t("plan.removeSession", {
          time: formatClock(time.hour, time.minute, locale, clockFormat),
        })}
        onPress={remove}
        className="h-10 w-10"
        size="icon"
        variant="ghost"
      >
        <XIcon />
      </Button>
      <View className="flex-1" />
      <TimeControl onChange={change} value={time} />
    </View>
  )
}

function TimesSection() {
  const { t } = useI18n()
  const { plan, updatePlan } = usePlan()
  const times = plan.reminderTimes
  const timeSlots = times.map(
    (time, index) => [`training-${index}`, index, time] as const
  )
  const perSession = repsPerSession(plan.targetReps, times.length)
  const canAdd =
    times.length < MAX_TRAINING_TIMES && times.length < plan.targetReps
  const changeTime = getChangeTime(times, updatePlan)
  const removeTime = getRemoveTime(times, updatePlan)
  const addTime = getAddTime(times, updatePlan)
  const hasMultipleTimes = times.length > 1

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-4">
        <RepeatIcon size={18} />
        <Text className="flex-1 font-semibold">
          {t(hasMultipleTimes ? "plan.trainingTimes" : "plan.trainingTime")}
        </Text>
        {hasMultipleTimes ? (
          <NumericPhrase
            className="text-sm text-muted-foreground"
            containerClassName="shrink-0"
            template={t("plan.repsEach", { count: NUMERIC_TEXT_SLOT })}
            textClassName="text-sm text-muted-foreground"
            value={perSession}
          />
        ) : (
          timeSlots.map(([id, index, time]) => (
            <TimeControl
              key={id}
              onChange={getTimeChange(index, changeTime)}
              value={time}
            />
          ))
        )}
      </View>
      {hasMultipleTimes ? (
        <View className="gap-2">
          {timeSlots.map(([id, index, time]) => (
            <TimeRow
              key={id}
              index={index}
              onChange={changeTime}
              onRemove={removeTime}
              time={time}
            />
          ))}
        </View>
      ) : null}
      {canAdd ? (
        <View className="items-center">
          <Button
            accessibilityLabel={t("plan.addSession")}
            className="w-full rounded-full dark:border-foreground/20 dark:bg-background dark:active:bg-muted"
            onPress={addTime}
            size="sm"
            variant="outline"
          >
            <PlusIcon size={14} />
            {t("plan.addSession")}
          </Button>
        </View>
      ) : null}
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
        className="min-h-11 flex-row items-center gap-4 active:opacity-60"
        onPress={hapticForward}
      >
        <TrophyIcon size={18} />
        <Text className="flex-1 font-semibold capitalize">{label}</Text>
        <ChevronRightIcon size={18} />
      </Pressable>
    </Link>
  )
}

function getReplayOnboarding(router: ReturnType<typeof useRouter>) {
  return () => {
    hapticFeedback("long-press")
    router.push("/onboarding")
  }
}

function AppIdentity() {
  const router = useRouter()
  const replayOnboarding = getReplayOnboarding(router)

  return (
    <Pressable
      accessibilityHint="Long press to replay onboarding"
      accessibilityLabel={`${APP_NAME} version ${APP_VERSION}`}
      accessibilityRole="button"
      className="flex-row items-baseline justify-center gap-1 py-4 active:opacity-60"
      delayLongPress={600}
      onLongPress={replayOnboarding}
    >
      <Text className="font-heading text-xs text-muted-foreground">
        {APP_NAME}
      </Text>
      <Text className="text-xs text-muted-foreground">v{APP_VERSION}</Text>
    </Pressable>
  )
}

export default function SettingsPage() {
  const { locale, t } = useI18n()
  const title = `${t("settings.title").toLocaleLowerCase(locale)}.`
  const {
    active,
    measure,
    ref: scrollRef,
    scrollProps,
    scrollTo,
  } = useScrollSections({
    endThreshold: 0,
    ids: SETTINGS_SECTION_IDS,
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
            <TimesSection />
            <Divider />
            <NotificationRows />
            <Divider />
            <SoundRow />
            <Divider />
            <LevelsRow />
          </Slab>
        </View>

        <View onLayout={measure("preferences")}>
          <Slab>
            <Overline>{t("plan.preferences")}</Overline>
            <PreferencesSection />
          </Slab>
        </View>

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
