import { Text } from "@/components/ui/text"
import { HeroSurface } from "@/features/workout/_components/figures"
import { RepMotionChart } from "@/features/workout/_components/rep-motion"
import { formatDuration } from "@/features/workout/_lib/format"
import type { WorkoutSession } from "@/features/workout/_lib/storage"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { THEME } from "@/lib/theme"
import * as Sharing from "expo-sharing"
import { useRef, useState } from "react"
import {
  Alert,
  Share as NativeShare,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native"
import { captureRef, releaseCapture } from "react-native-view-shot"

// The preview backdrop inverts the app scheme, so the ink has to invert with
// it — and since the capture itself is transparent, every glyph carries a
// shadow in the opposite tone to survive being laid over a photo.
const INK = {
  onDark: {
    line: "rgba(255, 255, 255, 0.22)",
    muted: "rgba(255, 255, 255, 0.6)",
    shadow: "rgba(0, 0, 0, 0.55)",
    strong: "#ffffff",
  },
  onLight: {
    line: "rgba(9, 9, 11, 0.18)",
    muted: "rgba(9, 9, 11, 0.6)",
    shadow: "rgba(255, 255, 255, 0.7)",
    strong: "#09090b",
  },
} satisfies Record<string, Record<string, string>>

function createCardStyles(ink: (typeof INK)["onDark"]) {
  const glyphShadow = {
    textShadowColor: ink.shadow,
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 8,
  }

  return StyleSheet.create({
    label: { color: ink.muted, ...glyphShadow },
    rule: { backgroundColor: ink.line, height: 1 },
    scoreNumber: {
      color: ink.strong,
      fontSize: 76,
      fontVariant: ["tabular-nums"],
      lineHeight: 80,
      ...glyphShadow,
    },
    statDivider: { backgroundColor: ink.line, width: 1 },
    statValue: { color: ink.strong, ...glyphShadow },
    track: { backgroundColor: ink.line, borderRadius: 5, height: 10 },
  })
}

// Keyed by surface tone, matching the Hero on the training tab: the app's dark
// scheme gets the light surface, so the ink flips with it.
const CARD_STYLES = {
  dark: createCardStyles(INK.onDark),
  light: createCardStyles(INK.onLight),
}

type CardStyles = ReturnType<typeof createCardStyles>

const styles = StyleSheet.create({
  accentBar: {
    backgroundColor: THEME.dark.primary,
    borderRadius: 3,
    width: 5,
  },
  // Padding keeps the glyph shadows inside the capture bounds.
  card: { padding: 14 },
  trackFill: {
    backgroundColor: THEME.dark.primary,
    borderRadius: 5,
    height: 10,
  },
})

function getTrackFillStyle(percent: number): StyleProp<ViewStyle> {
  return StyleSheet.compose(styles.trackFill, { width: `${percent}%` })
}

function ShareStat({
  cardStyles,
  label,
  value,
}: {
  cardStyles: CardStyles
  label: string
  value: string
}) {
  return (
    <View className="flex-1 gap-1">
      <Text
        className="font-heading text-[10px] uppercase tracking-[1.5px]"
        style={cardStyles.label}
      >
        {label}
      </Text>
      <Text
        className="font-heading text-base font-bold tabular-nums"
        style={cardStyles.statValue}
      >
        {value}
      </Text>
    </View>
  )
}

function Score({
  cardStyles,
  reps,
  targetReps,
}: {
  cardStyles: CardStyles
  reps: number
  targetReps: number
}) {
  return (
    <View className="-mb-3 flex-row items-baseline justify-between">
      <Text
        selectable
        className="font-heading font-extrabold"
        style={cardStyles.scoreNumber}
      >
        {reps}
      </Text>
      <Text
        selectable
        className="text-right font-heading text-[10px] font-bold uppercase tracking-[2px]"
        style={cardStyles.label}
      >
        {`of ${targetReps} reps`}
      </Text>
    </View>
  )
}

function getShareMessage(session: WorkoutSession, successRate: number) {
  return `${session.validReps}/${session.targetReps} push-ups · ${successRate}% success · ${formatDuration(session.totalDurationMs)}`
}

async function sharePerformanceCard(
  card: View | null,
  session: WorkoutSession,
  successRate: number
) {
  if (!card || !(await Sharing.isAvailableAsync())) {
    await NativeShare.share({
      message: getShareMessage(session, successRate),
      title: "Push-up performance",
    })
    return
  }

  const captureUri = await captureRef(card, {
    fileName: `pushup-${session.localDate}`,
    format: "png",
    result: "tmpfile",
  })

  try {
    await Sharing.shareAsync(captureUri, {
      UTI: "public.png",
      dialogTitle: "Share your performance",
      mimeType: "image/png",
    })
  } finally {
    releaseCapture(captureUri)
  }
}

export function useSharePerformance(
  session: WorkoutSession,
  successRate: number
) {
  const cardRef = useRef<View>(null)
  const [sharing, setSharing] = useState(false)

  function share() {
    if (sharing) return

    setSharing(true)
    void sharePerformanceCard(cardRef.current, session, successRate).then(
      () => setSharing(false),
      () => {
        Alert.alert("Couldn't share performance", "Please try again.")
        setSharing(false)
      }
    )
  }

  return { cardRef, share, sharing }
}

export function PerformanceCard({
  calories,
  cardRef,
  session,
  successRate,
}: {
  calories: string
  cardRef: React.RefObject<View | null>
  session: WorkoutSession
  successRate: number
}) {
  const tone = useColorScheme() === "dark" ? "light" : "dark"
  const cardStyles = CARD_STYLES[tone]
  const percent = Math.min(
    100,
    (session.validReps / Math.max(1, session.targetReps)) * 100
  )

  return (
    <HeroSurface className="p-2" tone={tone}>
      <View
        className="gap-5"
        collapsable={false}
        ref={cardRef}
        style={styles.card}
      >
        <View className="flex-row items-stretch gap-4">
          <View style={styles.accentBar} />
          <View className="flex-1">
            <Score
              cardStyles={cardStyles}
              reps={session.validReps}
              targetReps={session.targetReps}
            />
            <View style={cardStyles.track}>
              <View style={getTrackFillStyle(percent)} />
            </View>
          </View>
        </View>

        <View style={cardStyles.rule} />

        {session.attempts.length > 0 ? (
          <>
            <View className="gap-2">
              <Text
                className="font-heading text-[10px] uppercase tracking-[2px]"
                style={cardStyles.label}
              >
                Rep motion
              </Text>
              <RepMotionChart attempts={session.attempts} />
            </View>
            <View style={cardStyles.rule} />
          </>
        ) : null}

        <View className="flex-row gap-4">
          <ShareStat
            cardStyles={cardStyles}
            label="Duration"
            value={formatDuration(session.totalDurationMs)}
          />
          <View style={cardStyles.statDivider} />
          <ShareStat
            cardStyles={cardStyles}
            label="Success"
            value={`${successRate}%`}
          />
          <View style={cardStyles.statDivider} />
          <ShareStat
            cardStyles={cardStyles}
            label="Calories"
            value={calories}
          />
        </View>
      </View>
    </HeroSurface>
  )
}
