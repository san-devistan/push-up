import { PhysicalCameraTrace } from "@/components/camera-trace"
import { PauseIcon, PlayIcon } from "@/components/icons"
import { NumericText } from "@/components/numeric-text"
import { SpeechBubble } from "@/components/speech-bubble"
import { Button } from "@/components/ui/button"
import { Surface } from "@/components/ui/surface"
import {
  useSession,
  type SessionPhase,
} from "@/features/workout/_hooks/use-session"
import {
  getRepExpression,
  getTrackingGuidance,
} from "@/features/workout/_lib/guidance"
import type { TrainingHint } from "@/features/workout/_lib/setup"
import type {
  TrainingPlan,
  WorkoutSession,
} from "@/features/workout/_lib/storage"
import TrackingCamera from "@/features/workout/camera"
import { useI18n } from "@/hooks/use-i18n"
import { Text } from "panelui-native"
import { useEffect } from "react"
import { StyleSheet, View } from "react-native"
import Animated, {
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import { SafeAreaView } from "react-native-safe-area-context"

import WorkoutAvatar from "./avatar"
import { ActiveScore } from "./score"
import SetupGuide from "./setup-guide"
import { StopControl } from "./stop-control"

const TOP_EDGE = ["top"] as const
const BOTTOM_EDGE = ["bottom"] as const
const styles = StyleSheet.create({
  bottomSafeArea: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
  },
  countdown: {
    color: "#ffffff",
    fontSize: 144,
    lineHeight: 156,
  },
  countdownOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  depthGlow: {
    bottom: 0,
    experimental_backgroundImage:
      "radial-gradient(circle at 50% 48%, rgba(49,159,93,0) 0%, rgba(49,159,93,0.12) 46%, rgba(49,159,93,0.68) 100%)",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  errorBanner: {
    left: 24,
    position: "absolute",
    right: 24,
    top: 96,
  },
  invalidToast: {
    alignSelf: "center",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  invalidToastLabel: { color: "#09090b" },
  preparingBorder: { borderCurve: "continuous" },
  timer: {
    alignItems: "center",
    flex: 1,
    height: 72,
    justifyContent: "center",
  },
  timerLabel: {
    fontSize: 24,
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.5,
  },
  topSafeArea: {
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 20,
  },
  trainingAvatar: {
    backgroundColor: "transparent",
    height: 96,
    width: 96,
  },
  trainingAvatarFrame: { height: 96, width: 96 },
})
const TRAINING_AVATAR_DOM_PROPS = {
  scrollEnabled: false,
  style: styles.trainingAvatar,
}

function formatSessionTime(durationMs: number) {
  const totalSeconds = Math.floor(durationMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const hundredths = Math.floor((durationMs % 1000) / 10)

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}.${String(hundredths).padStart(2, "0")}`
}

function DepthGlow({ progress }: { progress: number }) {
  const reducedMotion = useReducedMotion()
  const depth = useSharedValue(0)

  useEffect(() => {
    depth.set(
      reducedMotion ? progress : withTiming(progress, { duration: 120 })
    )
  }, [depth, progress, reducedMotion])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: depth.get() * 0.72,
  }))

  return (
    <Animated.View
      className="absolute inset-0"
      pointerEvents="none"
      style={animatedStyle}
    >
      <View pointerEvents="none" style={styles.depthGlow} />
    </Animated.View>
  )
}

function TrainingAvatar({
  hint,
  validReps,
}: {
  hint: TrainingHint | null
  validReps: number
}) {
  const { t } = useI18n()
  const reducedMotion = useReducedMotion()
  const guidance = getTrackingGuidance(hint)
  const expression = guidance?.expression ?? getRepExpression(validReps)

  return (
    <SafeAreaView
      edges={TOP_EDGE}
      pointerEvents="none"
      style={styles.topSafeArea}
    >
      <View className="w-full flex-row items-center justify-end gap-2 px-5 pt-2">
        {guidance ? (
          <Animated.View
            accessibilityLabel={t(guidance.message)}
            accessibilityLiveRegion="assertive"
            accessible
            className="min-w-0 flex-1 items-end"
            entering={reducedMotion ? undefined : FadeInDown.duration(180)}
            exiting={reducedMotion ? undefined : FadeOutUp.duration(140)}
            key={guidance.message}
          >
            <SpeechBubble
              className="max-w-full"
              tail="right"
              textClassName="text-xl leading-6"
            >
              {t(guidance.message)}
            </SpeechBubble>
          </Animated.View>
        ) : null}
        <View style={styles.trainingAvatarFrame}>
          <WorkoutAvatar
            dom={TRAINING_AVATAR_DOM_PROPS}
            expression={expression}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

function CenterOverlay({
  countdown,
  phase,
}: {
  countdown: number
  phase: SessionPhase
}) {
  if (phase !== "countdown") return null

  return (
    <View className="pointer-events-none" style={styles.countdownOverlay}>
      <NumericText style={styles.countdown} value={countdown} />
    </View>
  )
}

function ErrorBanner({ message }: { message: string | null }) {
  return message ? (
    <View className="rounded-2xl bg-destructive p-4" style={styles.errorBanner}>
      <Text selectable className="text-center text-destructive-foreground">
        {message}
      </Text>
    </View>
  ) : null
}

function InvalidToast({ message }: { message: string | null }) {
  return message ? (
    <View pointerEvents="none" style={styles.invalidToast}>
      <Text className="font-semibold" style={styles.invalidToastLabel}>
        {message}
      </Text>
    </View>
  ) : null
}

export default function SessionScreen({
  onComplete,
  plan,
  targetReps,
}: {
  onComplete: (session: WorkoutSession) => void
  plan: TrainingPlan
  targetReps: number
}) {
  const { t } = useI18n()
  const session = useSession({ onComplete, plan, targetReps })
  const running = session.phase === "active" || session.phase === "paused"
  const trackingHint = session.phase === "active" ? session.trackingHint : null
  const showCameraGuidance =
    session.phase === "positioning" || trackingHint !== null

  return (
    <View className="flex-1 bg-background">
      <TrackingCamera
        isActive
        onError={session.onCameraError}
        onObservation={session.onObservation}
      />
      {showCameraGuidance ? <PhysicalCameraTrace /> : null}

      {running ? (
        <>
          <DepthGlow progress={session.depthProgress} />
          <TrainingAvatar hint={trackingHint} validReps={session.validReps} />
        </>
      ) : (
        <SetupGuide
          framing={session.setupFraming}
          phone={session.phoneInclination}
        />
      )}

      {running ? (
        <ActiveScore count={session.validReps} target={targetReps} />
      ) : null}
      <CenterOverlay countdown={session.countdown} phase={session.phase} />
      <ErrorBanner message={session.error} />

      <SafeAreaView edges={BOTTOM_EDGE} style={styles.bottomSafeArea}>
        <View className="items-center gap-3 px-5 pb-4">
          <InvalidToast message={session.toast} />
          {running ? (
            <View className="w-full max-w-md flex-row items-center gap-3">
              <Surface
                className="rounded-full"
                padding="none"
                style={styles.timer}
              >
                <Text
                  className="text-muted-foreground"
                  style={styles.timerLabel}
                >
                  {formatSessionTime(session.elapsedMs)}
                </Text>
              </Surface>
              <Button
                accessibilityLabel={t(
                  session.phase === "paused"
                    ? "session.resume"
                    : "session.pause"
                )}
                className="h-[72px] w-[72px] shrink-0 rounded-full border-0 bg-transparent"
                onPress={session.togglePause}
                size="icon"
                variant="ghost"
              >
                <Surface
                  className="absolute inset-0 rounded-full"
                  padding="none"
                  pointerEvents="none"
                />
                {session.phase === "paused" ? (
                  <PlayIcon size={30} />
                ) : (
                  <PauseIcon size={30} />
                )}
              </Button>
              <StopControl onPress={session.stop} />
            </View>
          ) : (
            <Button
              className="h-14 w-full max-w-sm rounded-full bg-foreground"
              labelClassName="font-heading lowercase text-lg text-background"
              onPress={session.stop}
              size="lg"
              sfx={false}
            >
              {t("session.stop")}
            </Button>
          )}
        </View>
      </SafeAreaView>
      {showCameraGuidance ? (
        <View
          className="absolute inset-0 rounded-[52px] border-[7px] border-foreground"
          pointerEvents="none"
          style={styles.preparingBorder}
        />
      ) : null}
    </View>
  )
}
