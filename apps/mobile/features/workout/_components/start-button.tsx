import { EdgeBlur } from "@/components/edge-blur"
import { Button } from "@/components/ui/button"
import {
  getStartButtonBottom,
  START_BUTTON_HEIGHT,
} from "@/features/workout/_lib/floating-controls"
import { useI18n } from "@/hooks/use-i18n"
import { useRouter } from "expo-router"
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const styles = StyleSheet.create({
  floating: {
    height: START_BUTTON_HEIGHT,
    left: 48,
    position: "absolute",
    right: 48,
    zIndex: 10,
  },
})

function getStartSession(router: ReturnType<typeof useRouter>) {
  return () => router.push("/session")
}

function getFloatingStyle(bottom: number): StyleProp<ViewStyle> {
  return [styles.floating, { bottom }]
}

export default function StartButton() {
  const { locale, t } = useI18n()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const label = t("today.startSession").toLocaleLowerCase(locale)
  const startSession = getStartSession(router)
  const floatingStyle = getFloatingStyle(getStartButtonBottom(insets.bottom))

  return (
    <>
      <EdgeBlur edge="bottom" />
      <Button
        accessibilityLabel={t("today.startSession")}
        className="rounded-full bg-foreground"
        labelClassName="font-heading lowercase text-lg text-background"
        onPress={startSession}
        sfx="success"
        style={floatingStyle}
      >
        {label}
      </Button>
    </>
  )
}
