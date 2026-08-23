import { PauseIcon, PlayIcon, XIcon } from "@/components/icons"
import { NumericText } from "@/components/numeric-text"
import { Button } from "@/components/ui/button"
import {
  useSession,
  type SessionPhase,
} from "@/features/workout/_hooks/use-session"
import type {
  TrainingPlan,
  WorkoutSession,
} from "@/features/workout/_lib/storage"
import FaceCamera from "@/features/workout/camera"
import { useI18n } from "@/hooks/use-i18n"
import { Text } from "panelui-native"
import { StyleSheet, View, useWindowDimensions } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import SetupGuide from "./setup-guide"

const TOP_EDGE = ["top"] as const
const BOTTOM_EDGE = ["bottom"] as const
const styles = StyleSheet.create({
  bottomSafeArea: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
  },
  control: {
    backgroundColor: "rgba(45, 47, 46, 0.9)",
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderCurve: "continuous",
    borderRadius: 999,
    borderWidth: 1,
    height: 72,
    width: 72,
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
  errorBanner: {
    left: 24,
    position: "absolute",
    right: 24,
    top: 96,
  },
  goalLabel: {
    fontSize: 18,
    letterSpacing: 1.2,
  },
  invalidToast: {
    alignSelf: "center",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  invalidToastLabel: { color: "#09090b" },
  sessionCenter: {
    alignItems: "center",
    bottom: 180,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 120,
  },
  stopButton: {
    backgroundColor: "#e60000",
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderCurve: "continuous",
    borderRadius: 999,
    borderWidth: 1,
    height: 80,
    width: 80,
  },
  timer: {
    alignItems: "center",
    backgroundColor: "rgba(45, 47, 46, 0.9)",
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderCurve: "continuous",
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    height: 72,
    justifyContent: "center",
  },
  timerLabel: {
    color: "rgba(255, 255, 255, 0.62)",
    fontSize: 24,
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.5,
  },
  topSafeArea: {
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
})

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

function getCountStyle(width: number) {
  return {
    fontSize: Math.min(220, width * 0.5),
    lineHeight: Math.min(232, width * 0.53),
  }
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

function ActiveScore({ count, target }: { count: number; target: number }) {
  const { t } = useI18n()
  const { width } = useWindowDimensions()
  const countStyle = getCountStyle(width)

  return (
    <View style={styles.sessionCenter}>
      <Text className="text-muted-foreground" style={styles.goalLabel}>
        {t("session.goal")} {target}
      </Text>
      <NumericText
        className="text-foreground"
        style={countStyle}
        value={count}
      />
    </View>
  )
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

  return (
    <View className="flex-1 bg-background">
      <FaceCamera
        isActive
        onError={session.onCameraError}
        onFace={session.onFace}
      />

      {running ? (
        <SafeAreaView edges={TOP_EDGE} style={styles.topSafeArea}>
          <View className="items-end px-5 pt-3">
            <View
              className={
                session.faceTracked
                  ? "size-2.5 rounded-full bg-primary"
                  : "size-2.5 rounded-full bg-muted-foreground/30"
              }
            />
          </View>
        </SafeAreaView>
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
              <View style={styles.timer}>
                <Text style={styles.timerLabel}>
                  {formatSessionTime(session.elapsedMs)}
                </Text>
              </View>
              <Button
                accessibilityLabel={t(
                  session.phase === "paused"
                    ? "session.resume"
                    : "session.pause"
                )}
                onPress={session.togglePause}
                size="icon"
                style={styles.control}
                variant="ghost"
              >
                {session.phase === "paused" ? (
                  <PlayIcon color="#ffffff" fill="#ffffff" size={30} />
                ) : (
                  <PauseIcon color="#ffffff" size={30} />
                )}
              </Button>
              <Button
                accessibilityLabel={t("session.stop")}
                onPress={session.stop}
                size="icon"
                style={styles.stopButton}
                variant="ghost"
              >
                <XIcon color="#ffffff" size={36} strokeWidth={3} />
              </Button>
            </View>
          ) : (
            <Button
              className="h-14 w-full max-w-sm rounded-full bg-foreground"
              labelClassName="font-heading lowercase text-lg text-background"
              onPress={session.stop}
              size="lg"
            >
              {t("session.stop")}
            </Button>
          )}
        </View>
      </SafeAreaView>
    </View>
  )
}
