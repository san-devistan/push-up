import {
  NUMERIC_TEXT_SLOT,
  NumericPhrase,
  NumericText,
} from "@/components/numeric-text"
import { PreferencesSection } from "@/features/preferences/_components/section"
import { usePreferences } from "@/features/preferences/_hooks/use-preferences"
import { Connect } from "@/features/workout/_components/connect"
import { Overline, Slab } from "@/features/workout/_components/figures"
import GoalSlider from "@/features/workout/_components/goal-slider"
import TimeControl from "@/features/workout/_components/time-control"
import { usePlan } from "@/features/workout/_hooks/use-plan"
import { formatClock } from "@/features/workout/_lib/format"
import {
  MAX_TRAINING_TIMES,
  repsPerSession,
} from "@/features/workout/_lib/goal"
import type { ReminderState } from "@/features/workout/_lib/reminders"
import type {
  TrainingPlan,
  TrainingTime,
} from "@/features/workout/_lib/storage"
import { useI18n } from "@/hooks/use-i18n"
import { hapticHard } from "@/lib/haptics"
import Constants from "expo-constants"
import { useRouter } from "expo-router"
import {
  AlertTriangleIcon,
  BellIcon,
  Button,
  ChevronLeftIcon,
  CrosshairIcon,
  MicIcon,
  PlusIcon,
  RepeatIcon,
  ShieldCheckIcon,
  Switch,
  Text,
  XIcon,
  type IconProps,
} from "panelui-native"
import type { ComponentType } from "react"
import { Pressable, StyleSheet, View } from "react-native"
import Animated from "react-native-reanimated"
import { SafeAreaView } from "react-native-safe-area-context"
import { useCSSVariable } from "uniwind"

const SCREEN_EDGES = ["top", "bottom"] as const
const APP_NAME = Constants.expoConfig?.name ?? "PUMPRS"
const APP_VERSION = Constants.expoConfig?.version ?? "dev"
const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  screen: { flex: 1 },
})

function nextTrainingTime(times: readonly TrainingTime[]): TrainingTime {
  const last = times.at(-1) ?? { hour: 8, minute: 0 }
  return { hour: (last.hour + 4) % 24, minute: last.minute }
}

function Divider() {
  return <View className="h-px bg-border" />
}

function SettingsHeader() {
  const { t } = useI18n()
  const router = useRouter()

  return (
    <View className="flex-row items-center">
      <Button
        accessibilityLabel={t("levels.goBack")}
        className="h-10 w-10 rounded-full bg-muted"
        onPress={router.back}
        size="icon"
        variant="ghost"
      >
        <ChevronLeftIcon />
      </Button>
      <Text
        accessibilityRole="header"
        className="flex-1 text-center font-bold text-lg tracking-[2px]"
      >
        {t("settings.title")}
      </Text>
      <View className="size-10" />
    </View>
  )
}

function getSetTarget(updatePlan: (patch: Partial<TrainingPlan>) => void) {
  return (targetReps: number) => updatePlan({ targetReps })
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
  return (value: boolean) => updatePlan({ [key]: value })
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
      <Switch haptics onValueChange={onCheckedChange} value={checked} />
    </View>
  )
}

function GoalFields() {
  const { t } = useI18n()
  const { plan, updatePlan } = usePlan()
  const setTarget = getSetTarget(updatePlan)

  return (
    <>
      <View className="flex-row items-center gap-4">
        <CrosshairIcon size={18} />
        <Text className="flex-1 font-semibold">{t("plan.dailyGoal")}</Text>
        <NumericText className="text-xl" value={plan.targetReps} />
      </View>
      <GoalSlider onChange={setTarget} value={plan.targetReps} />
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
        <BellIcon />
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
      <TimeControl hour={time.hour} minute={time.minute} onChange={change} />
    </View>
  )
}

function TimesSection() {
  const { t } = useI18n()
  const { plan, updatePlan } = usePlan()
  const times = plan.reminderTimes
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
          times.map((time, index) => (
            <TimeControl
              key={`${time.hour}:${time.minute}`}
              hour={time.hour}
              minute={time.minute}
              onChange={getTimeChange(index, changeTime)}
            />
          ))
        )}
      </View>
      {hasMultipleTimes ? (
        <View className="gap-2">
          {times.map((time, index) => (
            <TimeRow
              key={`${time.hour}:${time.minute}`}
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
            <PlusIcon />
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
        icon={BellIcon}
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
      icon={MicIcon}
      label={t("plan.soundFeedback")}
      onCheckedChange={setSound}
    />
  )
}

function getReplayOnboarding(router: ReturnType<typeof useRouter>) {
  return () => {
    hapticHard()
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
      className="items-center gap-1 py-4 active:opacity-60"
      delayLongPress={600}
      onLongPress={replayOnboarding}
    >
      <Text className="font-medium font-mono text-xs tracking-[2px] text-muted-foreground">
        {APP_NAME}
      </Text>
      <Text className="text-xs text-muted-foreground">v{APP_VERSION}</Text>
    </Pressable>
  )
}

export default function SettingsPage() {
  const { t } = useI18n()

  return (
    <SafeAreaView edges={SCREEN_EDGES} style={styles.screen}>
      <Animated.ScrollView
        className="flex-1"
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <SettingsHeader />
        <Slab>
          <Overline>{t("plan.trainingSettings")}</Overline>
          <GoalFields />
          <Divider />
          <TimesSection />
          <Divider />
          <NotificationRows />
          <Divider />
          <SoundRow />
        </Slab>

        <Slab>
          <Overline>{t("plan.preferences")}</Overline>
          <PreferencesSection />
        </Slab>

        <Connect />

        <View className="flex-row items-center gap-3 rounded-2xl bg-muted p-4">
          <ShieldCheckIcon />
          <Text className="flex-1" muted>
            {t("plan.privacy")}
          </Text>
        </View>

        <AppIdentity />
      </Animated.ScrollView>
    </SafeAreaView>
  )
}
