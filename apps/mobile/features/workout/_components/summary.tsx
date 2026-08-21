import {
  StatNumber,
  StatsDivider,
  StatsList,
  StatsListRow,
} from "@/features/workout/_components/figures"
import {
  PerformanceCard,
  useSharePerformance,
} from "@/features/workout/_components/share"
import { getEstimatedCalories } from "@/features/workout/_lib/calories"
import type { FailureReason } from "@/features/workout/_lib/counter"
import type { WorkoutSession } from "@/features/workout/_lib/storage"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { useI18n } from "@/hooks/use-i18n"
import { GLASS_TINT } from "@/lib/glass"
import type { TranslationKey } from "@/lib/i18n"
import { BlurView } from "expo-blur"
import {
  ArrowUpRightIcon,
  Button,
  CalendarIcon,
  ChevronLeftIcon,
  ClockIcon,
  ShareNodesIcon,
  SparklesIcon,
  Text,
  XIcon,
} from "panelui-native"
import { Fragment } from "react"
import {
  ScrollView,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const FAILURE_REASONS = [
  "body_misalignment",
  "incomplete_lockout",
  "insufficient_depth",
  "tracking_lost",
] as const satisfies readonly FailureReason[]
const SCREEN_EDGES = ["top", "bottom"] as const
const FAILURE_LABEL_KEYS = {
  body_misalignment: "summary.failureAlign",
  incomplete_lockout: "summary.failureLockout",
  insufficient_depth: "summary.failureDepth",
  tracking_lost: "summary.failureTracking",
} satisfies Record<FailureReason, TranslationKey>
const PERCENT_FORMAT = { maximumFractionDigits: 0, style: "percent" } as const
const TWO_DIGIT_FORMAT = { minimumIntegerDigits: 2 } as const
const styles = StyleSheet.create({
  actionBar: {
    bottom: 0,
    flexDirection: "row",
    gap: 12,
    left: 0,
    overflow: "hidden",
    paddingBottom: 28,
    paddingHorizontal: 20,
    paddingTop: 14,
    position: "absolute",
    right: 0,
  },
  content: {
    flexGrow: 1,
    gap: 16,
    paddingBottom: 120,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  homeAction: {
    borderCurve: "continuous",
    borderRadius: 18,
    height: 60,
    width: 60,
  },
  shareAction: {
    borderCurve: "continuous",
    borderRadius: 18,
    flex: 1,
    height: 60,
  },
  screen: { flex: 1 },
})

function getActionBarStyle(backgroundColor: string): StyleProp<ViewStyle> {
  return [styles.actionBar, { backgroundColor }]
}

function getSessionStats(session: WorkoutSession) {
  const successRate = session.attempts.length
    ? Math.round((session.validReps / session.attempts.length) * 100)
    : 0
  const averageRepMs = session.attempts.length
    ? Math.round(session.activeRepetitionTimeMs / session.attempts.length)
    : 0
  const failedReps = session.attempts.filter((attempt) => !attempt.valid).length
  const failureCounts: Record<FailureReason, number> = {
    body_misalignment: 0,
    incomplete_lockout: 0,
    insufficient_depth: 0,
    tracking_lost: 0,
  }

  for (const attempt of session.attempts) {
    for (const reason of attempt.failureReasons) {
      failureCounts[reason] += 1
    }
  }

  return { averageRepMs, failedReps, failureCounts, successRate }
}

function FailedRepSummary({
  failedReps,
  failureCounts,
}: {
  failedReps: number
  failureCounts: Record<FailureReason, number>
}) {
  const { t } = useI18n()
  const failures = FAILURE_REASONS.filter((reason) => failureCounts[reason] > 0)

  if (failures.length === 0) {
    return <StatNumber value={failedReps} />
  }

  return (
    <>
      <StatNumber value={failedReps} />
      <Text className="font-heading text-base"> (</Text>
      {failures.map((reason, index) => (
        <Fragment key={reason}>
          {index > 0 ? (
            <Text className="font-heading text-base">, </Text>
          ) : null}
          <Text className="font-heading text-base">
            {t(FAILURE_LABEL_KEYS[reason])}
          </Text>
          {failureCounts[reason] > 1 ? (
            <>
              <Text className="font-heading text-base"> x</Text>
              <StatNumber value={failureCounts[reason]} />
            </>
          ) : null}
        </Fragment>
      ))}
      <Text className="font-heading text-base">)</Text>
    </>
  )
}

function DurationNumber({ durationMs }: { durationMs: number }) {
  const totalSeconds = Math.round(durationMs / 1000)

  return (
    <>
      <StatNumber value={Math.floor(totalSeconds / 60)} />
      <Text className="font-heading text-base">:</Text>
      <StatNumber format={TWO_DIGIT_FORMAT} value={totalSeconds % 60} />
    </>
  )
}

export default function SummaryScreen({
  onDone,
  session,
}: {
  onDone: () => void
  session: WorkoutSession
}) {
  const { t } = useI18n()
  const { averageRepMs, failedReps, failureCounts, successRate } =
    getSessionStats(session)
  const estimatedCalories = getEstimatedCalories(session.attempts.length)
  const { backgroundRef, share, sharing, transparentRef } = useSharePerformance(
    session,
    successRate
  )
  const colorScheme = useColorScheme()

  return (
    <SafeAreaView edges={SCREEN_EDGES} style={styles.screen}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
      >
        <PerformanceCard
          backgroundRef={backgroundRef}
          calories={estimatedCalories}
          session={session}
          successRate={successRate}
          transparentRef={transparentRef}
        />

        <StatsList>
          <StatsListRow icon={ArrowUpRightIcon} label={t("common.successRate")}>
            <StatNumber format={PERCENT_FORMAT} value={successRate / 100} />
          </StatsListRow>
          <StatsDivider />
          <StatsListRow icon={XIcon} label={t("common.failedReps")}>
            <FailedRepSummary
              failedReps={failedReps}
              failureCounts={failureCounts}
            />
          </StatsListRow>
          <StatsDivider />
          <StatsListRow icon={ClockIcon} label={t("common.avgRep")}>
            <StatNumber
              maximumFractionDigits={1}
              minimumFractionDigits={1}
              suffix={t("time.secondsShort")}
              value={averageRepMs / 1000}
            />
          </StatsListRow>
          <StatsDivider />
          <StatsListRow icon={CalendarIcon} label={t("common.duration")}>
            <DurationNumber durationMs={session.totalDurationMs} />
          </StatsListRow>
          <StatsDivider />
          <StatsListRow icon={SparklesIcon} label={t("common.calories")}>
            <StatNumber
              maximumFractionDigits={1}
              minimumFractionDigits={estimatedCalories < 10 ? 1 : 0}
              suffix=" kcal"
              value={estimatedCalories}
            />
          </StatsListRow>
        </StatsList>
      </ScrollView>

      <BlurView
        intensity={24}
        style={getActionBarStyle(GLASS_TINT[colorScheme])}
        tint={colorScheme}
      >
        <Button
          accessibilityLabel={t("session.backToday")}
          className="bg-muted dark:bg-card"
          onPress={onDone}
          size="icon"
          style={styles.homeAction}
          variant="ghost"
        >
          <ChevronLeftIcon size={24} />
        </Button>
        <Button
          disabled={sharing}
          labelClassName="font-bold text-lg"
          onPress={share}
          style={styles.shareAction}
          variant="primary"
        >
          <ShareNodesIcon size={22} />
          {sharing ? t("session.preparing") : t("session.sharePerformance")}
        </Button>
      </BlurView>
    </SafeAreaView>
  )
}
