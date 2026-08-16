import type { TimeControlProps } from "@/features/workout/_components/time-control.types"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { THEME } from "@/lib/theme"
import { DatePicker, Host, type DatePickerComponent } from "@expo/ui/swift-ui"
import { StyleSheet } from "react-native"

const HOUR_AND_MINUTE: DatePickerComponent[] = ["hourAndMinute"]
const styles = StyleSheet.create({
  host: { height: 40, width: 104 },
})

function getChangeDate(onChange: TimeControlProps["onChange"]) {
  return (date: Date) => onChange(date.getHours(), date.getMinutes())
}

export default function TimeControl({
  hour,
  minute,
  onChange,
}: TimeControlProps) {
  const scheme = useColorScheme() === "dark" ? "dark" : "light"
  const selection = new Date()
  selection.setHours(hour, minute, 0, 0)
  const changeDate = getChangeDate(onChange)

  return (
    <Host
      colorScheme={scheme}
      seedColor={THEME[scheme].primary}
      style={styles.host}
    >
      <DatePicker
        displayedComponents={HOUR_AND_MINUTE}
        onDateChange={changeDate}
        selection={selection}
        title=""
      />
    </Host>
  )
}
