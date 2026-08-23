import { TimePicker, type TimeValue } from "@/components/ui/time-picker"
import { usePreferences } from "@/features/preferences/_hooks/use-preferences"
import type { TimeControlProps } from "@/features/workout/_components/time-control.types"
import { formatClock } from "@/features/workout/_lib/format"
import { useI18n } from "@/hooks/use-i18n"
import { hapticHard } from "@/lib/haptics"
import { Text } from "panelui-native"
import { Pressable } from "react-native"

function getPickerChange(onChange: TimeControlProps["onChange"]) {
  return (value: TimeValue) => onChange(value.hour, value.minute)
}

export default function TimeControl({ onChange, value }: TimeControlProps) {
  const { clockFormat } = usePreferences()
  const { locale } = useI18n()
  const { hour, minute } = value
  const change = getPickerChange(onChange)
  const label = formatClock(hour, minute, locale, clockFormat)

  return (
    <TimePicker
      hourCycle={clockFormat === "24" ? 24 : 12}
      layout="ruler"
      locale={locale}
      onValueChange={change}
      presentation="bottom-sheet"
      value={value}
    >
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        className="active:opacity-60"
        onPress={hapticHard}
      >
        <Text className="font-heading text-2xl tabular-nums">{label}</Text>
      </Pressable>
    </TimePicker>
  )
}
