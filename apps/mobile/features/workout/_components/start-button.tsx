import { EdgeBlur } from "@/components/edge-blur"
import { Button } from "@/components/ui/button"
import { useRecap } from "@/features/workout/_hooks/use-recap"
import { demoSession } from "@/features/workout/_lib/demo"
import {
  getStartButtonBottom,
  START_BUTTON_HEIGHT,
} from "@/features/workout/_lib/floating-controls"
import { getLocalDate } from "@/features/workout/_lib/storage"
import { useI18n } from "@/hooks/use-i18n"
import { useRouter } from "expo-router"
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const styles = StyleSheet.create({
  debugFloating: {
    height: 44,
    left: 48,
    position: "absolute",
    right: 48,
    zIndex: 10,
  },
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

function getDebugFloatingStyle(bottom: number): StyleProp<ViewStyle> {
  return [styles.debugFloating, { bottom: bottom + START_BUTTON_HEIGHT + 8 }]
}

function getOpenFinalDebug(show: ReturnType<typeof useRecap>["show"]) {
  return () => show(demoSession(getLocalDate(Date.now())), undefined)
}

export default function StartButton() {
  const { locale, t } = useI18n()
  const router = useRouter()
  const { show } = useRecap()
  const insets = useSafeAreaInsets()
  const bottom = getStartButtonBottom(insets.bottom)
  const debugFloatingStyle = getDebugFloatingStyle(bottom)
  const label = t("today.startSession").toLocaleLowerCase(locale)
  const openFinalDebug = getOpenFinalDebug(show)
  const startSession = getStartSession(router)
  const floatingStyle = getFloatingStyle(bottom)

  return (
    <>
      <EdgeBlur edge="bottom" />
      {__DEV__ ? (
        <Button
          accessibilityLabel="Open final screen debug"
          className="rounded-full"
          labelClassName="font-heading lowercase text-sm"
          onPress={openFinalDebug}
          sfx={false}
          size="sm"
          style={debugFloatingStyle}
          variant="secondary"
        >
          final screen debug
        </Button>
      ) : null}
      <Button
        accessibilityLabel={t("today.startSession")}
        className="rounded-full bg-foreground"
        labelClassName="font-heading lowercase text-lg text-background"
        onPress={startSession}
        sfx={false}
        style={floatingStyle}
      >
        {label}
      </Button>
    </>
  )
}
