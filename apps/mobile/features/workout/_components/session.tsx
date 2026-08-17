import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import {
  useSession,
  type SessionPhase,
} from "@/features/workout/_hooks/use-session"
import type {
  TrainingPlan,
  WorkoutSession,
} from "@/features/workout/_lib/storage"
import PoseCamera from "@/features/workout/camera"
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const TOP_EDGE = ["top"] as const
const BOTTOM_EDGE = ["bottom"] as const
const styles = StyleSheet.create({
  activeCount: {
    color: "#ffffff",
    fontSize: 68,
    fontVariant: ["tabular-nums"],
    lineHeight: 72,
  },
  activeTarget: { color: "rgba(255, 255, 255, 0.5)", fontSize: 28 },
  countdown: {
    color: "#ffffff",
    fontSize: 144,
    fontVariant: ["tabular-nums"],
    lineHeight: 156,
  },
  countdownOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  hudPanel: {
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    borderCurve: "continuous",
    borderRadius: 24,
  },
  hudTrack: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 999,
    height: 6,
    overflow: "hidden",
  },
  invalidToast: {
    alignSelf: "center",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  invalidToastLabel: { color: "#09090b" },
  positioningTitle: { color: "#ffffff" },
  stopButton: {
    backgroundColor: "#e11d48",
    borderCurve: "continuous",
    borderRadius: 18,
    height: 60,
    width: "100%",
  },
  stopLabel: { color: "#ffffff" },
  surface: { backgroundColor: "#000000" },
})

function CenterOverlay({
  countdown,
  phase,
}: {
  countdown: number
  phase: SessionPhase
}) {
  if (phase !== "countdown") {
    return null
  }

  return (
    <View className="pointer-events-none" style={styles.countdownOverlay}>
      <Text
        className="font-heading font-extrabold text-white"
        style={styles.countdown}
      >
        {countdown}
      </Text>
    </View>
  )
}

function ErrorBanner({ message }: { message: string | null }) {
  return message ? (
    <View className="absolute inset-x-6 top-24 rounded-2xl bg-destructive p-4">
      <Text selectable className="text-center text-destructive-foreground">
        {message}
      </Text>
    </View>
  ) : null
}

function getHudFillStyle(percent: number): StyleProp<ViewStyle> {
  return { width: `${Math.min(100, percent)}%` }
}

function HudBar({ percent }: { percent: number }) {
  const fillStyle = getHudFillStyle(percent)

  return (
    <View style={styles.hudTrack}>
      <View className="h-full bg-primary" style={fillStyle} />
    </View>
  )
}

function ActiveScore({
  targetReps,
  validReps,
}: {
  targetReps: number
  validReps: number
}) {
  return (
    <View className="gap-2 px-5 py-3" style={styles.hudPanel}>
      <Text
        selectable
        className="font-heading font-extrabold text-white"
        style={styles.activeCount}
      >
        {validReps}
        <Text style={styles.activeTarget}>/{targetReps}</Text>
      </Text>
      <HudBar percent={(validReps / Math.max(1, targetReps)) * 100} />
    </View>
  )
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
  const session = useSession({ onComplete, plan, targetReps })

  return (
    <View className="flex-1" style={styles.surface}>
      <PoseCamera
        isActive
        onError={session.onCameraError}
        onLandmarks={session.onLandmarks}
        showDepthGuide={session.phase === "active"}
        showSetupGuides={session.phase !== "active"}
      />

      <SafeAreaView className="absolute left-0 right-0 top-0" edges={TOP_EDGE}>
        <View
          className={
            session.phase === "active" ? "px-5 pt-3" : "items-end px-5 pt-3"
          }
        >
          {session.phase === "active" ? (
            <ActiveScore
              targetReps={targetReps}
              validReps={session.validReps}
            />
          ) : (
            <View className="self-end px-5 py-3" style={styles.hudPanel}>
              <Text
                className="text-lg font-semibold leading-6"
                style={styles.positioningTitle}
              >
                {session.setupHint}
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>

      <CenterOverlay countdown={session.countdown} phase={session.phase} />
      <ErrorBanner message={session.error} />

      <SafeAreaView
        className="absolute bottom-0 left-0 right-0"
        edges={BOTTOM_EDGE}
      >
        <View className="items-center gap-3 px-5 pb-4">
          <InvalidToast message={session.toast} />
          <Button
            className="max-w-sm bg-destructive"
            onPress={session.stop}
            style={styles.stopButton}
          >
            <Text
              className="font-heading text-lg font-bold"
              style={styles.stopLabel}
            >
              Stop
            </Text>
          </Button>
        </View>
      </SafeAreaView>
    </View>
  )
}
