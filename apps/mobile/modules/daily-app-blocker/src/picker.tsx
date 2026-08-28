import { requireNativeView } from "expo"
import type { ViewProps } from "react-native"

type DailyAppBlockerPickerProps = ViewProps & {
  footerText?: string
  headerText?: string
  onSelectionChange?: (event: {
    nativeEvent: { selectedCount: number }
  }) => void
}

const NativePicker =
  process.env.EXPO_OS === "ios"
    ? requireNativeView<DailyAppBlockerPickerProps>(
        "PumprDailyAppBlocker",
        "DailyAppBlockerPickerView"
      )
    : null

export default function DailyAppBlockerPicker(
  props: DailyAppBlockerPickerProps
) {
  return NativePicker ? <NativePicker {...props} /> : null
}
