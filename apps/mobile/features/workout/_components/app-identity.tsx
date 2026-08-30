import { usePreferences } from "@/features/preferences/_hooks/use-preferences"
import { hapticFeedback } from "@/lib/haptics"
import Constants from "expo-constants"
import { Text } from "panelui-native"
import { Pressable } from "react-native"

const APP_NAME = Constants.expoConfig?.name ?? "pumpr."
const APP_VERSION = Constants.expoConfig?.version ?? "dev"

function getToggleDebugMode(toggleDebugMode: () => void) {
  return () => {
    hapticFeedback("long-press")
    toggleDebugMode()
  }
}

export default function AppIdentity() {
  const { debugMode, toggleDebugMode } = usePreferences()
  const toggleDebug = getToggleDebugMode(toggleDebugMode)

  return (
    <Pressable
      accessibilityHint={`Long press to ${debugMode ? "disable" : "enable"} debug mode`}
      accessibilityLabel={`${APP_NAME} version ${APP_VERSION}`}
      accessibilityRole="button"
      className="flex-row items-baseline justify-center gap-1 py-4 active:opacity-60"
      delayLongPress={600}
      onLongPress={toggleDebug}
    >
      <Text className="font-heading text-xs text-muted-foreground">
        {APP_NAME}
      </Text>
      <Text className="text-xs text-muted-foreground">v{APP_VERSION}</Text>
    </Pressable>
  )
}
