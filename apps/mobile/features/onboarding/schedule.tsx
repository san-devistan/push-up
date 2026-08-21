import {
  NUMERIC_TEXT_SLOT,
  NumericPhrase,
  NumericText,
} from "@/components/numeric-text"
import { usePreferences } from "@/features/preferences/_hooks/use-preferences"
import { Slab } from "@/features/workout/_components/figures"
import TimeControl from "@/features/workout/_components/time-control"
import { usePlan } from "@/features/workout/_hooks/use-plan"
import {
  MAX_TRAINING_TIMES,
  repsPerSession,
} from "@/features/workout/_lib/goal"
import type {
  TrainingPlan,
  TrainingTime,
} from "@/features/workout/_lib/storage"
import {
  BellIcon,
  Button,
  ClockIcon,
  PlusIcon,
  Text,
  XIcon,
} from "panelui-native"
import { View } from "react-native"
import Animated, {
  FadeInDown,
  FadeOutUp,
  ReduceMotion,
} from "react-native-reanimated"
import { useCSSVariable } from "uniwind"

const LIST_ENTER = FadeInDown.duration(180).reduceMotion(ReduceMotion.System)
const LIST_EXIT = FadeOutUp.duration(140).reduceMotion(ReduceMotion.System)

function nextTrainingTime(times: readonly TrainingTime[]): TrainingTime {
  const last = times.at(-1) ?? { hour: 8, minute: 0 }
  return { hour: (last.hour + 4) % 24, minute: last.minute }
}

function getSetClockFormat(
  format: "12" | "24",
  setClockFormat: (format: "12" | "24") => void
) {
  return () => setClockFormat(format)
}

function getChangeTime(
  index: number,
  plan: TrainingPlan,
  updatePlan: (patch: Partial<TrainingPlan>) => void
) {
  return (hour: number, minute: number) =>
    updatePlan({
      reminderTimes: plan.reminderTimes.map((item, at) =>
        at === index ? { hour, minute } : item
      ),
    })
}

function getRemoveTime(
  index: number,
  plan: TrainingPlan,
  updatePlan: (patch: Partial<TrainingPlan>) => void
) {
  return () =>
    updatePlan({
      reminderTimes: plan.reminderTimes.filter((_, at) => at !== index),
    })
}

function getAddTime(
  plan: TrainingPlan,
  updatePlan: (patch: Partial<TrainingPlan>) => void
) {
  return () =>
    updatePlan({
      reminderTimes: [
        ...plan.reminderTimes,
        nextTrainingTime(plan.reminderTimes),
      ],
    })
}

export default function ScheduleStep() {
  const { clockFormat, setClockFormat } = usePreferences()
  const { enableReminders, plan, reminderState, updatePlan } = usePlan()
  const canAdd =
    plan.reminderTimes.length < MAX_TRAINING_TIMES &&
    plan.reminderTimes.length < plan.targetReps
  const perSession = repsPerSession(plan.targetReps, plan.reminderTimes.length)
  const mutedForeground = useCSSVariable("--color-muted-foreground")
  const primary = useCSSVariable("--color-primary")

  return (
    <View className="flex-1 gap-6">
      <View className="gap-3">
        <Text className="font-heading text-4xl leading-[44px]">
          Decide when the reps happen.
        </Text>
        <NumericPhrase
          className="text-lg text-muted-foreground"
          containerClassName="flex-wrap"
          template={`Add sessions and we will split your ${NUMERIC_TEXT_SLOT} reps between them.`}
          textClassName="text-lg text-muted-foreground"
          value={plan.targetReps}
        />
      </View>

      <Slab>
        <View className="flex-row items-center gap-3">
          <ClockIcon />
          <Text className="flex-1 font-semibold">Clock</Text>
          <View className="flex-row rounded-xl bg-background p-1">
            {(["12", "24"] as const).map((format) => (
              <Button
                key={format}
                onPress={getSetClockFormat(format, setClockFormat)}
                size="sm"
                variant={clockFormat === format ? "primary" : "ghost"}
              >
                <NumericText
                  className={
                    clockFormat === format
                      ? "text-sm text-primary-foreground"
                      : "text-sm text-foreground"
                  }
                  value={Number(format)}
                />
                <Text
                  className={
                    clockFormat === format
                      ? "font-semibold text-sm text-primary-foreground"
                      : "font-semibold text-sm text-foreground"
                  }
                >
                  h
                </Text>
              </Button>
            ))}
          </View>
        </View>

        <View className="h-px bg-border" />

        <View className="gap-3">
          {plan.reminderTimes.map((time, index) => (
            <Animated.View
              className="flex-row items-center gap-3"
              entering={LIST_ENTER}
              exiting={LIST_EXIT}
              key={`${time.hour}:${time.minute}`}
            >
              <View className="size-9 items-center justify-center rounded-full bg-primary/15">
                <NumericText
                  className="text-xs text-primary"
                  value={index + 1}
                />
              </View>
              <NumericPhrase
                className="text-sm text-muted-foreground"
                containerClassName="flex-1"
                template={`${NUMERIC_TEXT_SLOT} reps`}
                textClassName="text-sm text-muted-foreground"
                value={perSession}
              />
              <TimeControl
                hour={time.hour}
                minute={time.minute}
                onChange={getChangeTime(index, plan, updatePlan)}
              />
              {plan.reminderTimes.length > 1 ? (
                <Button
                  accessibilityLabel={`Remove session ${index + 1}`}
                  className="h-9 w-9"
                  onPress={getRemoveTime(index, plan, updatePlan)}
                  size="icon"
                  variant="ghost"
                >
                  <XIcon
                    color={
                      typeof mutedForeground === "string"
                        ? mutedForeground
                        : undefined
                    }
                  />
                </Button>
              ) : null}
            </Animated.View>
          ))}
          {canAdd ? (
            <Button
              onPress={getAddTime(plan, updatePlan)}
              size="sm"
              variant="outline"
            >
              <PlusIcon />
              Add session
            </Button>
          ) : null}
        </View>
      </Slab>

      <Slab className="gap-3">
        <View className="flex-row items-center gap-3">
          <BellIcon color={typeof primary === "string" ? primary : undefined} />
          <View className="flex-1 gap-1">
            <Text className="font-semibold">Training reminders</Text>
            <Text className="text-sm text-muted-foreground">
              {reminderState === "on"
                ? "Reminders are ready."
                : "Get a nudge at each training time."}
            </Text>
          </View>
        </View>
        {reminderState !== "on" ? (
          <Button onPress={enableReminders} variant="outline">
            Allow notifications
          </Button>
        ) : null}
      </Slab>
    </View>
  )
}
