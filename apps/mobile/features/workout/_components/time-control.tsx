import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Text } from "@/components/ui/text"
import type { TimeControlProps } from "@/features/workout/_components/time-control.types"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react-native"
import { StyleSheet, View } from "react-native"

const styles = StyleSheet.create({
  part: { minWidth: 44 },
})

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

function Part({
  label,
  onStep,
  step,
  value,
  wrap,
}: {
  label: string
  onStep: (next: number) => void
  step: number
  value: number
  wrap: number
}) {
  const increment = getStep(onStep, value, step, wrap)
  const decrement = getReverseStep(onStep, value, step, wrap)

  return (
    <View className="items-center">
      <Button
        accessibilityLabel={`Increase ${label}`}
        onPress={increment}
        size="icon-xs"
        variant="ghost"
      >
        <Icon as={ChevronUpIcon} />
      </Button>
      <Text
        className="text-center font-heading text-2xl font-bold tabular-nums"
        style={styles.part}
      >
        {String(value).padStart(2, "0")}
      </Text>
      <Button
        accessibilityLabel={`Decrease ${label}`}
        onPress={decrement}
        size="icon-xs"
        variant="ghost"
      >
        <Icon as={ChevronDownIcon} />
      </Button>
    </View>
  )
}

export default function TimeControl({
  hour,
  minute,
  onChange,
}: TimeControlProps) {
  const setHour = getSetHour(onChange, minute)
  const setMinute = getSetMinute(onChange, hour)

  return (
    <View className="flex-row items-center">
      <Part label="hour" onStep={setHour} step={1} value={hour} wrap={24} />
      <Text className="font-heading text-2xl font-bold">:</Text>
      <Part
        label="minutes"
        onStep={setMinute}
        step={5}
        value={minute}
        wrap={60}
      />
    </View>
  )
}
