/* eslint-disable react-perf/jsx-no-new-function-as-prop -- React Compiler stabilizes the debug-only handlers. */
import { EdgeBlur } from "@/components/edge-blur"
import { Button } from "@/components/ui/button"
import { AchievementOverlay } from "@/features/workout/_components/summary"
import { usePlan } from "@/features/workout/_hooks/use-plan"
import type { Activity } from "@/features/workout/_lib/activity"
import {
  getStartButtonBottom,
  START_BUTTON_HEIGHT,
} from "@/features/workout/_lib/floating-controls"
import { useI18n } from "@/hooks/use-i18n"
import { useRouter } from "expo-router"
import { useState } from "react"
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const DEBUG_BUTTON_GAP = 8
const DEBUG_RECENT_DAYS = Array.from({ length: 30 }, (_, index) => ({
  date: `debug-${index}`,
  reps: 3,
}))

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
  return [
    styles.debugFloating,
    { bottom: bottom + START_BUTTON_HEIGHT + DEBUG_BUTTON_GAP },
  ]
}

function getDebugAchievement(targetReps: number) {
  const goal = Math.max(1, targetReps)
  const todayReps = Math.max(0, goal - 1)
  const totalPushups = Math.max(9, todayReps)
  const before = {
    averageRepMs: 2000,
    bestDayReps: todayReps,
    bestSessionReps: todayReps,
    bestStreak: 0,
    currentStreak: 0,
    recentDays: DEBUG_RECENT_DAYS,
    successRate: 100,
    todayAttempts: todayReps,
    todayReps,
    totalActiveMs: totalPushups * 2000,
    totalAttempts: totalPushups,
    totalDurationMs: totalPushups * 2500,
    totalPushups,
    totalSessions: 1,
    weeks: [{ reps: totalPushups, start: "debug" }],
  } satisfies Activity
  const after = {
    ...before,
    bestDayReps: goal,
    bestSessionReps: goal,
    bestStreak: 1,
    currentStreak: 1,
    todayAttempts: goal,
    todayReps: goal,
    totalAttempts: totalPushups + 1,
    totalPushups: totalPushups + 1,
    weeks: [{ reps: totalPushups + 1, start: "debug" }],
  } satisfies Activity

  return { after, before }
}

function DebugAchievementButton({ bottom }: { bottom: number }) {
  const { plan } = usePlan()
  const [open, setOpen] = useState(false)
  const { after, before } = getDebugAchievement(plan.targetReps)

  return (
    <>
      <Button
        accessibilityLabel="Preview all achievements"
        className="rounded-full"
        labelClassName="font-heading lowercase text-sm"
        onPress={() => setOpen(true)}
        sfx={false}
        size="sm"
        style={getDebugFloatingStyle(bottom)}
        variant="secondary"
      >
        debug achievements
      </Button>
      {open ? (
        <AchievementOverlay
          after={after}
          before={before}
          onDone={() => setOpen(false)}
          soundEnabled={plan.soundEnabled}
        />
      ) : null}
    </>
  )
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
      {__DEV__ ? (
        <DebugAchievementButton bottom={getStartButtonBottom(insets.bottom)} />
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
