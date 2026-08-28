import { PlusIcon, RepeatIcon, XIcon } from "@/components/icons"
import { NUMERIC_TEXT_SLOT, NumericPhrase } from "@/components/numeric-text"
import { Button } from "@/components/ui/button"
import { Surface } from "@/components/ui/surface"
import { usePreferences } from "@/features/preferences/_hooks/use-preferences"
import TimeControl from "@/features/workout/_components/time-control"
import { usePlan } from "@/features/workout/_hooks/use-plan"
import { formatClock } from "@/features/workout/_lib/format"
import {
  MAX_TRAINING_TIMES,
  repsPerSession,
} from "@/features/workout/_lib/goal"
import type {
  TrainingPlan,
  TrainingTime,
} from "@/features/workout/_lib/storage"
import { useI18n } from "@/hooks/use-i18n"
import { Text } from "panelui-native"
import { StyleSheet, View } from "react-native"

const styles = StyleSheet.create({
  surface: { borderCurve: "circular" },
})

function nextTrainingTime(times: readonly TrainingTime[]): TrainingTime {
  const last = times.at(-1) ?? { hour: 8, minute: 0 }
  return { hour: (last.hour + 4) % 24, minute: last.minute }
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
        className="h-10 w-10"
        onPress={remove}
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

export default function TrainingTimes() {
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
            className="relative w-full rounded-full border-0 bg-transparent"
            onPress={addTime}
            size="sm"
            variant="ghost"
          >
            <Surface
              bordered={false}
              className="absolute inset-0 rounded-full"
              padding="none"
              pointerEvents="none"
              style={styles.surface}
              variant="tertiary"
            />
            <PlusIcon size={14} />
            {t("plan.addSession")}
          </Button>
        </View>
      ) : null}
    </View>
  )
}
