import { NumericText } from "@/components/numeric-text"
import { HeroSurface } from "@/features/workout/_components/figures"
import { RepMotionChart } from "@/features/workout/_components/rep-motion"
import {
  ShareDuration,
  SharePercent,
  ShareScore,
  ShareStat,
} from "@/features/workout/_components/share-metrics"
import { formatDuration } from "@/features/workout/_lib/format"
import type { WorkoutSession } from "@/features/workout/_lib/storage"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { useI18n } from "@/hooks/use-i18n"
import { formatNumber, translate, type Language } from "@/lib/i18n"
import { THEME } from "@/lib/theme"
import * as MediaLibrary from "expo-media-library"
import * as Sharing from "expo-sharing"
import { Text } from "panelui-native"
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
    goalDone: { color: THEME.dark.primary, ...glyphShadow },
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

// Keyed by surface tone: the app's dark
// scheme gets the light surface, so the ink flips with it.
const CARD_STYLES = {
  dark: createCardStyles(INK.onDark),
  light: createCardStyles(INK.onLight),
}

const styles = StyleSheet.create({
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

function getShareMessage(
  session: WorkoutSession,
  successRate: number,
  language: Language
) {
  const reps = `${formatNumber(language, session.validReps)}/${formatNumber(
    language,
    session.targetReps
  )}`
  const success = formatNumber(language, successRate / 100, {
    maximumFractionDigits: 0,
    style: "percent",
  })

  return `${reps} ${translate(language, "share.pushups")} · ${success} ${translate(language, "common.success")} · ${formatDuration(session.totalDurationMs)} · PUMPRS`
}

async function capturePerformanceCard(
  card: View | null,
  session: WorkoutSession,
  suffix: string,
  language: Language
) {
  if (!card) {
    throw new Error(translate(language, "share.cardUnavailable"))
  }

  return captureRef(card, {
    fileName: `pumprs-${session.localDate}${suffix}`,
    format: "png",
    result: "tmpfile",
  })
}

async function sharePerformanceCard(
  card: View | null,
  session: WorkoutSession,
  successRate: number,
  language: Language
) {
  if (!card || !(await Sharing.isAvailableAsync())) {
    await NativeShare.share({
      message: getShareMessage(session, successRate, language),
      title: `PUMPRS — ${translate(language, "share.share")}`,
    })
    return
  }

  const captureUri = await capturePerformanceCard(card, session, "", language)

  try {
    await Sharing.shareAsync(captureUri, {
      UTI: "public.png",
      dialogTitle: translate(language, "share.share"),
      mimeType: "image/png",
    })
  } finally {
    releaseCapture(captureUri)
  }
}

async function saveTransparentPerformanceCard(
  card: View | null,
  session: WorkoutSession,
  language: Language
) {
  const permission = await MediaLibrary.requestPermissionsAsync(true, ["photo"])

  if (!permission.granted) {
    Alert.alert(
      translate(language, "share.photosTitle"),
      translate(language, "share.photosBody")
    )
    return
  }

  const captureUri = await capturePerformanceCard(
    card,
    session,
    "-transparent",
    language
  )

  try {
    await MediaLibrary.Asset.create(captureUri)
  } finally {
    releaseCapture(captureUri)
  }

  Alert.alert(
    translate(language, "share.pngTitle"),
    translate(language, "share.pngBody")
  )
}

export function useSharePerformance(
  session: WorkoutSession,
  successRate: number
) {
  const { language, t } = useI18n()
  const backgroundRef = useRef<View>(null)
  const [sharing, setSharing] = useState(false)
  const transparentRef = useRef<View>(null)

  function run(action: () => Promise<void>, errorTitle: string) {
    if (sharing) return

    setSharing(true)
    void action()
      .catch(() => Alert.alert(errorTitle, t("share.tryAgain")))
      .finally(() => setSharing(false))
  }

  function share() {
    if (sharing) return

    Alert.alert(t("share.share"), t("share.choose"), [
      {
        onPress: () =>
          run(
            () =>
              sharePerformanceCard(
                backgroundRef.current,
                session,
                successRate,
                language
              ),
            t("share.couldNotShare")
          ),
        text: t("share.shareBackground"),
      },
      {
        onPress: () =>
          run(
            () =>
              saveTransparentPerformanceCard(
                transparentRef.current,
                session,
                language
              ),
            t("share.couldNotSave")
          ),
        text: t("share.saveTransparent"),
      },
      { style: "cancel", text: t("common.cancel") },
    ])
  }

  return { backgroundRef, share, sharing, transparentRef }
}

export function PerformanceCard({
  backgroundRef,
  calories,
  session,
  successRate,
  transparentRef,
}: {
  backgroundRef: React.RefObject<View | null>
  calories: number
  session: WorkoutSession
  successRate: number
  transparentRef: React.RefObject<View | null>
}) {
  const { t } = useI18n()
  const tone = useColorScheme() === "dark" ? "light" : "dark"
  const cardStyles = CARD_STYLES[tone]
  const percent = Math.min(
    100,
    (session.validReps / Math.max(1, session.targetReps)) * 100
  )

  return (
    <HeroSurface className="p-2" ref={backgroundRef} tone={tone}>
      <View
        className="gap-5"
        collapsable={false}
        ref={transparentRef}
        style={styles.card}
      >
        <View>
          <View className="-mb-1 flex-row justify-end">
            <Text
              className="font-heading text-[11px]"
              style={cardStyles.statValue}
            >
              pumpr.
            </Text>
          </View>
          <ShareScore
            cardStyles={cardStyles}
            percent={percent}
            reps={session.validReps}
          />
          <View style={cardStyles.track}>
            <View style={getTrackFillStyle(percent)} />
          </View>
        </View>

        <View style={cardStyles.rule} />

        {session.attempts.length > 0 ? (
          <>
            <View className="gap-2">
              <Text
                className="font-mono text-[10px] tracking-[2px] uppercase"
                style={cardStyles.label}
              >
                {t("share.repMotion")}
              </Text>
              <RepMotionChart attempts={session.attempts} />
            </View>
            <View style={cardStyles.rule} />
          </>
        ) : null}

        <View className="flex-row gap-4">
          <ShareStat cardStyles={cardStyles} label={t("common.duration")}>
            <ShareDuration
              cardStyles={cardStyles}
              durationMs={session.totalDurationMs}
            />
          </ShareStat>
          <View style={cardStyles.statDivider} />
          <ShareStat cardStyles={cardStyles} label={t("common.success")}>
            <SharePercent cardStyles={cardStyles} value={successRate / 100} />
          </ShareStat>
          <View style={cardStyles.statDivider} />
          <ShareStat cardStyles={cardStyles} label={t("common.calories")}>
            <NumericText
              className="text-base"
              maximumFractionDigits={1}
              minimumFractionDigits={calories < 10 ? 1 : 0}
              style={cardStyles.statValue}
              value={calories}
            />
            <Text
              className="font-heading text-base"
              style={cardStyles.statValue}
            >
              {" kcal"}
            </Text>
          </ShareStat>
        </View>
      </View>
    </HeroSurface>
  )
}
