import { NumericText } from "@/components/numeric-text"
import { usePreferences } from "@/features/preferences/_hooks/use-preferences"
import type { TimeControlProps } from "@/features/workout/_components/time-control.types"
import { useI18n } from "@/hooks/use-i18n"
import { Button, ChevronDownIcon, ChevronUpIcon, Text } from "panelui-native"
import { StyleSheet, View } from "react-native"

const styles = StyleSheet.create({
  part: { minWidth: 44 },
})
const TWO_DIGIT_FORMAT = { minimumIntegerDigits: 2 } as const

function getStep(
  onStep: (next: number) => void,
  value: number,
  step: number,
  wrap: number
) {
  return () => onStep((value + step) % wrap)
}

function getReverseStep(
  onStep: (next: number) => void,
  value: number,
  step: number,
  wrap: number
) {
  return () => onStep((value - step + wrap) % wrap)
}

function getSetHour(onChange: TimeControlProps["onChange"], minute: number) {
  return (next: number) => onChange(next, minute)
}

function getSetMinute(onChange: TimeControlProps["onChange"], hour: number) {
  return (next: number) => onChange(hour, next)
}

function getTogglePeriod(
  onChange: TimeControlProps["onChange"],
  hour: number,
  minute: number
) {
  return () => onChange((hour + 12) % 24, minute)
}

function Part({
  label,
  onStep,
  step,
  value,
  displayValue,
  wrap,
}: {
  displayValue?: number
  label: string
  onStep: (next: number) => void
  step: number
  value: number
  wrap: number
}) {
  const { t } = useI18n()
  const increment = getStep(onStep, value, step, wrap)
  const decrement = getReverseStep(onStep, value, step, wrap)

  return (
    <View className="items-center">
      <Button
        accessibilityLabel={t("accessibility.increase", { label })}
        className="h-9 w-9"
        onPress={increment}
        size="icon"
        variant="ghost"
      >
        <ChevronUpIcon />
      </Button>
      <NumericText
        className="text-center text-2xl"
        format={TWO_DIGIT_FORMAT}
        style={styles.part}
        value={displayValue ?? value}
      />
      <Button
        accessibilityLabel={t("accessibility.decrease", { label })}
        className="h-9 w-9"
        onPress={decrement}
        size="icon"
        variant="ghost"
      >
        <ChevronDownIcon />
      </Button>
    </View>
  )
}

export default function TimeControl({
  hour,
  minute,
  onChange,
}: TimeControlProps) {
  const { clockFormat } = usePreferences()
  const { t } = useI18n()
  const setHour = getSetHour(onChange, minute)
  const setMinute = getSetMinute(onChange, hour)
  const togglePeriod = getTogglePeriod(onChange, hour, minute)

  return (
    <View className="flex-row items-center">
      <Part
        label={t("time.hour")}
        onStep={setHour}
        step={1}
        value={hour}
        displayValue={clockFormat === "12" ? hour % 12 || 12 : undefined}
        wrap={24}
      />
      <Text className="font-heading text-2xl">:</Text>
      <Part
        label={t("time.minutes")}
        onStep={setMinute}
        step={5}
        value={minute}
        wrap={60}
      />
      {clockFormat === "12" ? (
        <Button
          accessibilityLabel={t("time.switchPeriod")}
          className="ml-1 min-w-14"
          onPress={togglePeriod}
          size="sm"
          variant="outline"
        >
          <Text className="font-bold">{hour < 12 ? "AM" : "PM"}</Text>
        </Button>
      ) : null}
    </View>
  )
}
