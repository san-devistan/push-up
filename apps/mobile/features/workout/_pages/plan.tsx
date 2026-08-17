import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Switch } from "@/components/ui/switch"
import { Text } from "@/components/ui/text"
import { PreferencesSection } from "@/features/preferences/_components/section"
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
import { useMinimizeOnScroll } from "expo-glass-tabs"
import {
  BellIcon,
  PlusIcon,
  RepeatIcon,
  ShieldCheckIcon,
  TargetIcon,
  TriangleAlertIcon,
  Volume2Icon,
  XIcon,
} from "lucide-react-native"
import { StyleSheet, View } from "react-native"
import Animated from "react-native-reanimated"
import { SafeAreaView } from "react-native-safe-area-context"

const SCREEN_EDGES = ["top"] as const
const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingBottom: 140,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
})

function nextTrainingTime(times: readonly TrainingTime[]): TrainingTime {
  const last = times.at(-1) ?? { hour: 8, minute: 0 }
  return { hour: (last.hour + 4) % 24, minute: last.minute }
}

function Divider() {
  return <View className="h-px bg-border" />
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
  icon: typeof BellIcon
  label: string
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <View className="flex-row items-center justify-between gap-4">
      <Icon as={icon} className="text-foreground" />
      <Text className="flex-1 font-semibold">{label}</Text>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </View>
  )
}

function GoalFields() {
  const { plan, updatePlan } = usePlan()
  const setTarget = getSetTarget(updatePlan)

  return (
    <>
      <View className="flex-row items-center gap-4">
        <Icon as={TargetIcon} className="text-foreground" />
        <Text className="flex-1 font-semibold">Daily goal</Text>
        <Text
          selectable
          className="font-heading text-xl font-bold tabular-nums"
        >
          {plan.targetReps}
        </Text>
      </View>
      <GoalSlider onChange={setTarget} value={plan.targetReps} />
    </>
  )
}

function PermissionNotice({ state }: { state: ReminderState }) {
  const { enableReminders } = usePlan()

  if (state === "ask") {
    return (
      <Button onPress={enableReminders} variant="outline">
        <Icon as={BellIcon} />
        <Text className="font-semibold">Allow notifications</Text>
      </Button>
    )
  }

  if (state !== "denied") {
    return null
  }

  return (
    <View className="flex-row items-center gap-3 rounded-2xl bg-destructive/10 p-3">
      <Icon as={TriangleAlertIcon} className="text-destructive" />
      <Text className="flex-1 text-sm">
        Notifications are turned off for Pushup. Re-enable them in Settings.
      </Text>
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
  const change = getTimeChange(index, onChange)
  const remove = getTimeRemove(index, onRemove)

  return (
    <View className="flex-row items-center gap-3">
      <Button
        accessibilityLabel={`Remove the ${formatClock(time.hour, time.minute)} session`}
        onPress={remove}
        size="icon-sm"
        variant="ghost"
      >
        <Icon as={XIcon} className="text-muted-foreground" />
      </Button>
      <View className="flex-1" />
      <TimeControl hour={time.hour} minute={time.minute} onChange={change} />
    </View>
  )
}

function TimesSection() {
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
        <Icon as={RepeatIcon} className="text-foreground" />
        <Text className="flex-1 font-semibold">
          {hasMultipleTimes ? "Training times" : "Training time"}
        </Text>
        {hasMultipleTimes ? (
          <Text className="shrink-0 text-sm tabular-nums text-muted-foreground">
            {perSession} reps each
          </Text>
        ) : (
          times.map((time, index) => (
            <TimeControl
              key={formatClock(time.hour, time.minute)}
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
              key={formatClock(time.hour, time.minute)}
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
            accessibilityLabel="Add new training session"
            className="w-full rounded-full dark:border-foreground/20 dark:bg-background dark:active:bg-muted"
            onPress={addTime}
            size="sm"
            variant="outline"
          >
            <Icon as={PlusIcon} />
            <Text>Add new training session</Text>
          </Button>
        </View>
      ) : null}
    </View>
  )
}

function NotificationRows() {
  const { plan, reminderState, updatePlan } = usePlan()
  const setEnabled = getSetPlanBoolean("reminderEnabled", updatePlan)

  return (
    <>
      <SettingRow
        checked={plan.reminderEnabled}
        icon={BellIcon}
        label="Notification"
        onCheckedChange={setEnabled}
      />
      {plan.reminderEnabled ? <PermissionNotice state={reminderState} /> : null}
    </>
  )
}

function SoundRow() {
  const { plan, updatePlan } = usePlan()
  const setSound = getSetPlanBoolean("soundEnabled", updatePlan)

  return (
    <SettingRow
      checked={plan.soundEnabled}
      icon={Volume2Icon}
      label="Sound feedback"
      onCheckedChange={setSound}
    />
  )
}

export default function PlanPage() {
  const onScroll = useMinimizeOnScroll()

  return (
    <SafeAreaView className="flex-1 bg-background" edges={SCREEN_EDGES}>
      <Animated.ScrollView
        className="flex-1"
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <Slab>
          <Overline>Training settings</Overline>
          <GoalFields />
          <Divider />
          <TimesSection />
          <Divider />
          <NotificationRows />
          <Divider />
          <SoundRow />
        </Slab>

        <Slab>
          <Overline>Preferences</Overline>
          <PreferencesSection />
        </Slab>

        <Connect />

        <View className="flex-row items-center gap-3 rounded-2xl bg-muted p-4">
          <Icon as={ShieldCheckIcon} className="text-muted-foreground" />
          <Text className="flex-1" variant="muted">
            Video and body landmarks never leave your phone.
          </Text>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  )
}
