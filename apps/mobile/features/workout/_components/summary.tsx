/* eslint-disable react-perf/jsx-no-new-function-as-prop -- React Compiler stabilizes the local recap-stage handlers. */
import {
  FlameIcon,
  InstagramIcon,
  ShareNodesIcon,
  TrophyIcon,
  type IconProps,
} from "@/components/icons"
import { NumericText } from "@/components/numeric-text"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { Surface } from "@/components/ui/surface"
import {
  PerformanceCard,
  useSharePerformance,
} from "@/features/workout/_components/share"
import { usePlan } from "@/features/workout/_hooks/use-plan"
import { useRecap } from "@/features/workout/_hooks/use-recap"
import {
  getActivityAfterSession,
  type Activity,
} from "@/features/workout/_lib/activity"
import { getEstimatedCalories } from "@/features/workout/_lib/calories"
import { getLevel } from "@/features/workout/_lib/gamification"
import type { WorkoutSession } from "@/features/workout/_lib/storage"
import { useI18n } from "@/hooks/use-i18n"
import { playSfx } from "@/lib/sfx"
import { Text } from "panelui-native"
import { useEffect, useState, type ComponentType } from "react"
import { StyleSheet, View } from "react-native"
import Animated, { FadeInDown, ReduceMotion } from "react-native-reanimated"
import { useCSSVariable } from "uniwind"

const styles = StyleSheet.create({
  action: {
    flex: 1,
    height: 60,
  },
  progressValue: { fontSize: 36, lineHeight: 44 },
})

function getOpenChange(onDone: () => void) {
  return (open: boolean) => {
    if (!open) onDone()
  }
}

function RecapCard({
  onDone,
  session,
  streak,
}: {
  onDone: () => void
  session: WorkoutSession
  streak: number
}) {
  const { t } = useI18n()
  const foregroundValue = useCSSVariable("--color-foreground")
  const foreground =
    typeof foregroundValue === "string" ? foregroundValue : undefined
  const successRate = session.attempts.length
    ? Math.round((session.validReps / session.attempts.length) * 100)
    : 0
  const {
    backgroundRef,
    shareBackground,
    shareInstagram,
    sharing,
    transparentRef,
  } = useSharePerformance(session, successRate)
  const handleOpenChange = getOpenChange(onDone)

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <Dialog.Content
        accessibilityLabel={t("session.sharePerformance")}
        blur
        className="gap-3 border-0 bg-transparent p-0 shadow-none"
        dismissSfx={false}
      >
        <PerformanceCard
          backgroundRef={backgroundRef}
          calories={getEstimatedCalories(session.attempts.length)}
          session={session}
          streak={streak}
          successRate={successRate}
          transparentRef={transparentRef}
        />
        <View className="w-full flex-row gap-3">
          <Button
            accessibilityLabel={t("share.shareBackground")}
            className="rounded-full border-0 bg-transparent"
            disabled={sharing !== null}
            onPress={shareBackground}
            size="icon"
            style={styles.action}
            variant="ghost"
          >
            <Surface
              className="absolute inset-0 rounded-full"
              padding="none"
              pointerEvents="none"
            />
            <ShareNodesIcon color={foreground} size={24} />
          </Button>
          <Button
            accessibilityLabel="Instagram Stories"
            className="rounded-full border-0 bg-transparent"
            disabled={sharing !== null}
            onPress={shareInstagram}
            size="icon"
            style={styles.action}
            variant="ghost"
          >
            <Surface
              className="absolute inset-0 rounded-full"
              padding="none"
              pointerEvents="none"
            />
            <InstagramIcon color={foreground} size={24} />
          </Button>
        </View>
      </Dialog.Content>
    </Dialog>
  )
}

function levelOf(activity: Activity, dailyGoal: number) {
  return getLevel({
    bestStreak: activity.bestStreak,
    dailyGoal,
    recentDays: activity.recentDays,
    totalReps: activity.totalPushups,
  }).level
}

function ProgressionStat({
  delay,
  icon: Icon,
  label,
  value,
}: {
  delay: number
  icon: ComponentType<IconProps>
  label: string
  value: number
}) {
  const foregroundValue = useCSSVariable("--color-foreground")
  const foreground =
    typeof foregroundValue === "string" ? foregroundValue : undefined

  return (
    <Animated.View
      className="flex-1 items-center gap-1"
      entering={FadeInDown.duration(220)
        .delay(delay)
        .reduceMotion(ReduceMotion.System)}
    >
      <Icon color={foreground} size={22} />
      <NumericText
        align="center"
        direction="up"
        reduceMotion="system"
        style={styles.progressValue}
        value={value}
      />
      <Text className="font-mono text-xs text-muted-foreground">{label}</Text>
    </Animated.View>
  )
}

function ProgressionCard({
  after,
  before,
  onDone,
  session,
}: {
  after: Activity
  before: Activity
  onDone: () => void
  session: WorkoutSession
}) {
  const { plan } = usePlan()
  const { t } = useI18n()
  const beforeLevel = levelOf(before, plan.targetReps)
  const afterLevel = levelOf(after, plan.targetReps)
  const levelIncreased = afterLevel > beforeLevel
  const streakIncreased = after.currentStreak > before.currentStreak
  const [revealed, setRevealed] = useState(false)
  const handleOpenChange = getOpenChange(onDone)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setRevealed(true)
      if (levelIncreased) playSfx("achievement", session.soundEnabled)
    }, 240)

    return () => clearTimeout(timeout)
  }, [levelIncreased, session.soundEnabled])

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <Dialog.Content
        accessibilityLabel={t("session.backToday")}
        blur
        className="gap-3 border-0 bg-transparent p-0 shadow-none"
        dismissSfx={false}
      >
        <Surface className="w-full" elevated padding="lg">
          <View className="w-full flex-row gap-4">
            {streakIncreased ? (
              <ProgressionStat
                delay={80}
                icon={FlameIcon}
                label={t("common.streak")}
                value={revealed ? after.currentStreak : before.currentStreak}
              />
            ) : null}
            {levelIncreased ? (
              <ProgressionStat
                delay={160}
                icon={TrophyIcon}
                label={t("today.level", { level: "" }).trim()}
                value={revealed ? afterLevel : beforeLevel}
              />
            ) : null}
          </View>
        </Surface>
        <Button className="rounded-full" onPress={onDone} size="lg">
          {t("session.backToday")}
        </Button>
      </Dialog.Content>
    </Dialog>
  )
}

function RecapFlow({
  activity,
  before,
  onReveal,
  onSettle,
  session,
}: {
  activity: Activity | undefined
  before: Activity | undefined
  onReveal: (activity: Activity) => void
  onSettle: () => void
  session: WorkoutSession
}) {
  const { plan } = usePlan()
  const [stage, setStage] = useState<"progression" | "share">("share")
  const after = getActivityAfterSession(before, activity, session)
  const hasAchievement =
    before &&
    after &&
    (after.currentStreak > before.currentStreak ||
      levelOf(after, plan.targetReps) > levelOf(before, plan.targetReps))
  const finish = () => (after ? onReveal(after) : onSettle())
  const finishShare = () => {
    if (
      session.status === "completed" &&
      session.validReps > 0 &&
      hasAchievement
    ) {
      setStage("progression")
      return
    }

    finish()
  }

  return stage === "share" ? (
    <RecapCard
      onDone={finishShare}
      session={session}
      streak={after?.currentStreak ?? before?.currentStreak ?? 0}
    />
  ) : before && after ? (
    <ProgressionCard
      after={after}
      before={before}
      onDone={finish}
      session={session}
    />
  ) : null
}

export default function SummaryOverlay({
  activity,
}: {
  activity: Activity | undefined
}) {
  const { reveal, settle, state } = useRecap()

  if (state.type !== "presenting") return null

  return (
    <RecapFlow
      activity={activity}
      before={state.before}
      key={state.session.id}
      onReveal={reveal}
      onSettle={settle}
      session={state.session}
    />
  )
}
