import { hapticFeedback } from "@/lib/haptics"
import Constants from "expo-constants"
import { useRouter } from "expo-router"
import { Text } from "panelui-native"
import { Pressable } from "react-native"

const APP_NAME = Constants.expoConfig?.name ?? "pumpr."
const APP_VERSION = Constants.expoConfig?.version ?? "dev"

function getReplayOnboarding(router: ReturnType<typeof useRouter>) {
  return () => {
    hapticFeedback("long-press")
    router.push("/onboarding")
  }
}

export default function AppIdentity() {
  const router = useRouter()
  const replayOnboarding = getReplayOnboarding(router)

  return (
    <Pressable
      accessibilityHint="Long press to replay onboarding"
      accessibilityLabel={`${APP_NAME} version ${APP_VERSION}`}
      accessibilityRole="button"
      className="flex-row items-baseline justify-center gap-1 py-4 active:opacity-60"
      delayLongPress={600}
      onLongPress={replayOnboarding}
    >
      <Text className="font-heading text-xs text-muted-foreground">
        {APP_NAME}
      </Text>
      <Text className="text-xs text-muted-foreground">v{APP_VERSION}</Text>
    </Pressable>
  )
}
