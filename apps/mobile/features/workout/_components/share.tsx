import { Surface } from "@/components/ui/surface"
import { RepMotionChart } from "@/features/workout/_components/rep-motion"
import { ShareStat } from "@/features/workout/_components/share-metrics"
import { formatTotalDuration } from "@/features/workout/_lib/format"
import {
  saveTransparentCard,
  shareInstagramStory,
  sharePerformanceCard,
} from "@/features/workout/_lib/share"
import type { WorkoutSession } from "@/features/workout/_lib/storage"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { useI18n } from "@/hooks/use-i18n"
import { Text } from "panelui-native"
import { useRef } from "react"
import { Alert, StyleSheet, View } from "react-native"

// The card ink follows Surface's scheme. Since the capture itself is
// transparent, every glyph carries a shadow in the opposite tone to survive
// being laid over a photo.
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
      fontSize: 78,
      fontVariant: ["tabular-nums"],
      lineHeight: 96,
      ...glyphShadow,
    },
    statValue: { color: ink.strong, ...glyphShadow },
  })
}

// Keyed by Surface's resolved tone.
const CARD_STYLES = {
  dark: createCardStyles(INK.onDark),
  light: createCardStyles(INK.onLight),
}
const CARD_GRAPH_COLORS = {
  dark: INK.onDark.strong,
  light: INK.onLight.strong,
}
const DOWNLOAD_CARD_STYLES = createCardStyles({
  line: "rgba(255, 255, 255, 0.22)",
  muted: "#ffffff",
  shadow: "transparent",
  strong: "#ffffff",
})

const styles = StyleSheet.create({
  // Padding keeps the glyph shadows inside the capture bounds.
  card: { padding: 8 },
  graph: { marginBottom: -8 },
  scoreColumn: { alignItems: "flex-start", flex: 44 },
  shareCapture: {
    left: -10_000,
    position: "absolute",
    top: 0,
    width: "100%",
  },
  statsColumn: { flex: 54 },
})

function PerformanceOverview({
  calories,
  cardStyles,
  session,
  streak,
  successRate,
}: {
  calories: number
  cardStyles: ReturnType<typeof createCardStyles>
  session: WorkoutSession
  streak: number
  successRate: number
}) {
  const { formatNumber: formatLocalizedNumber, t } = useI18n()

  return (
    <View className="gap-3">
      <Text className="font-heading text-3xl" style={cardStyles.statValue}>
        pumpr.
      </Text>
      <View className="flex-row items-stretch gap-1">
        <View className="min-w-0 justify-center" style={styles.scoreColumn}>
          <View className="items-start">
            <Text
              adjustsFontSizeToFit
              className="font-heading"
              numberOfLines={1}
              style={cardStyles.scoreNumber}
            >
              {formatLocalizedNumber(session.validReps)}
            </Text>
            <Text
              className="-mt-5 font-heading text-base"
              style={cardStyles.label}
            >
              {t("share.pushups")}
            </Text>
          </View>
        </View>
        <View
          className="min-w-0 justify-center gap-4"
          style={styles.statsColumn}
        >
          <View className="flex-row gap-2">
            <ShareStat
              cardStyles={cardStyles}
              label={t("common.streak")}
              unit={t(streak === 1 ? "common.day" : "common.days")}
              value={formatLocalizedNumber(streak)}
            />
            <ShareStat
              cardStyles={cardStyles}
              label={t("common.calories")}
              unit="kcal"
              value={formatLocalizedNumber(calories, {
                maximumFractionDigits: 1,
                minimumFractionDigits: calories < 10 ? 1 : 0,
              })}
            />
          </View>
          <View className="flex-row gap-2">
            <ShareStat
              cardStyles={cardStyles}
              label={t("common.success")}
              value={formatLocalizedNumber(successRate / 100, {
                maximumFractionDigits: 0,
                style: "percent",
              })}
            />
            <ShareStat
              cardStyles={cardStyles}
              compactUnits
              label={t("common.duration")}
              value={formatTotalDuration(session.totalDurationMs)}
            />
          </View>
        </View>
      </View>
    </View>
  )
}

function PerformanceCardContent({
  calories,
  cardStyles,
  contentRef,
  graphColor,
  session,
  streak,
  successRate,
}: {
  calories: number
  cardStyles: ReturnType<typeof createCardStyles>
  contentRef?: React.RefObject<View | null>
  graphColor: string
  session: WorkoutSession
  streak: number
  successRate: number
}) {
  const { t } = useI18n()

  return (
    <View
      className="gap-3"
      collapsable={false}
      ref={contentRef}
      style={styles.card}
    >
      <PerformanceOverview
        calories={calories}
        cardStyles={cardStyles}
        session={session}
        streak={streak}
        successRate={successRate}
      />

      {session.attempts.length > 0 ? (
        <>
          <View style={cardStyles.rule} />
          <View className="gap-1" style={styles.graph}>
            <Text className="font-mono text-[10px]" style={cardStyles.label}>
              {t("share.repMotion")}
            </Text>
            <RepMotionChart attempts={session.attempts} color={graphColor} />
          </View>
        </>
      ) : null}
    </View>
  )
}

export function useSharePerformance(
  session: WorkoutSession,
  successRate: number
) {
  const { language, t } = useI18n()
  const backgroundRef = useRef<View>(null)
  const downloadRef = useRef<View>(null)
  const sharing = useRef(false)

  function run(action: () => Promise<void>, errorTitle: string) {
    if (sharing.current) return

    sharing.current = true
    void action()
      .catch(() => Alert.alert(errorTitle, t("share.tryAgain")))
      .finally(() => {
        sharing.current = false
      })
  }

  function shareBackground() {
    run(
      () =>
        sharePerformanceCard(
          backgroundRef.current,
          session,
          successRate,
          language
        ),
      t("share.couldNotShare")
    )
  }

  function saveTransparent() {
    run(
      () => saveTransparentCard(downloadRef.current, session, language),
      t("share.couldNotSave")
    )
  }

  function shareInstagram() {
    const appId = process.env.EXPO_PUBLIC_META_APP_ID

    if (!appId) {
      Alert.alert(t("share.couldNotShare"), t("share.tryAgain"))
      return
    }

    run(
      () => shareInstagramStory(downloadRef.current, appId, language),
      t("share.couldNotShare")
    )
  }

  return {
    backgroundRef,
    downloadRef,
    saveTransparent,
    shareBackground,
    shareInstagram,
  }
}

export function PerformanceCard({
  backgroundRef,
  calories,
  downloadRef,
  session,
  streak,
  successRate,
}: {
  backgroundRef: React.RefObject<View | null>
  calories: number
  downloadRef: React.RefObject<View | null>
  session: WorkoutSession
  streak: number
  successRate: number
}) {
  const colorScheme = useColorScheme()
  const cardStyles = CARD_STYLES[colorScheme]
  const graphColor = CARD_GRAPH_COLORS[colorScheme]

  return (
    <View className="w-full">
      <Surface
        className="bg-background"
        collapsable={false}
        padding="sm"
        pointerEvents="none"
        ref={backgroundRef}
        style={styles.shareCapture}
        variant="transparent"
      >
        <PerformanceCardContent
          calories={calories}
          cardStyles={cardStyles}
          graphColor={graphColor}
          session={session}
          streak={streak}
          successRate={successRate}
        />
      </Surface>
      <View
        collapsable={false}
        pointerEvents="none"
        ref={downloadRef}
        style={styles.shareCapture}
      >
        <PerformanceCardContent
          calories={calories}
          cardStyles={DOWNLOAD_CARD_STYLES}
          graphColor="#ffffff"
          session={session}
          streak={streak}
          successRate={successRate}
        />
      </View>
      <Surface padding="sm">
        <PerformanceCardContent
          calories={calories}
          cardStyles={cardStyles}
          graphColor={graphColor}
          session={session}
          streak={streak}
          successRate={successRate}
        />
      </Surface>
    </View>
  )
}
