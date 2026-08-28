/* eslint-disable react-perf/jsx-no-new-function-as-prop, react-perf/jsx-no-new-object-as-prop -- React Compiler stabilizes the local recap handlers and responsive styles. */
import { InstagramIcon, ShareNodesIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { DownloadIcon } from "@/components/ui/icons"
import { Surface } from "@/components/ui/surface"
import {
  LevelRings,
  TodayRepsRing,
} from "@/features/workout/_components/daily-goal"
import {
  PerformanceCard,
  useSharePerformance,
} from "@/features/workout/_components/share"
import { Streak } from "@/features/workout/_components/streak"
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
import { useEffect, useState } from "react"
import { StyleSheet, useWindowDimensions, View } from "react-native"
import { useCSSVariable } from "uniwind"

const DIALOG_HORIZONTAL_PADDING = 48
const DIALOG_MAX_WIDTH = 384
const PROGRESSION_GAP = 8
const PROGRESSION_MAX_ITEM_SIZE = 220
const PROGRESSION_ANIMATION_DURATION_MS = 1000
const PROGRESSION_REVEAL_DELAY_MS = 500
const PROGRESSION_STAGGER_MS = 250

const styles = StyleSheet.create({
  action: {
    flex: 1,
    height: 60,
  },
  actionSurface: { borderCurve: "circular" },
})

function getProgressionItemSize(viewportWidth: number, itemCount: number) {
  const contentWidth = Math.min(
    viewportWidth - DIALOG_HORIZONTAL_PADDING,
    DIALOG_MAX_WIDTH
  )

  return Math.min(
    PROGRESSION_MAX_ITEM_SIZE,
    Math.floor((contentWidth - PROGRESSION_GAP * (itemCount - 1)) / itemCount)
  )
}

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
    saveTransparent,
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
          calories={getEstimatedCalories(session.validReps)}
          session={session}
          streak={streak}
          successRate={successRate}
          transparentRef={transparentRef}
        />
        <View className="w-full flex-row gap-3">
          <Button
            accessibilityLabel={t("share.shareBackground")}
            className="rounded-full border-0 bg-transparent"
            disabled={sharing}
            onPress={shareBackground}
            size="icon"
            style={styles.action}
            variant="ghost"
          >
            <Surface
              bordered={false}
              className="absolute inset-0 rounded-full"
              padding="none"
              pointerEvents="none"
              style={styles.actionSurface}
            />
            <ShareNodesIcon color={foreground} size={24} />
          </Button>
          <Button
            accessibilityLabel={t("share.saveTransparent")}
            className="rounded-full border-0 bg-transparent"
            disabled={sharing}
            onPress={saveTransparent}
            size="icon"
            style={styles.action}
            variant="ghost"
          >
            <Surface
              bordered={false}
              className="absolute inset-0 rounded-full"
              padding="none"
              pointerEvents="none"
              style={styles.actionSurface}
            />
            <DownloadIcon color={foreground} size={24} />
          </Button>
          <Button
            accessibilityLabel="Instagram Stories"
            className="rounded-full border-0 bg-transparent"
            disabled={sharing}
            onPress={shareInstagram}
            size="icon"
            style={styles.action}
            variant="ghost"
          >
            <Surface
              bordered={false}
              className="absolute inset-0 rounded-full"
              padding="none"
              pointerEvents="none"
              style={styles.actionSurface}
            />
            <InstagramIcon color={foreground} size={24} />
          </Button>
        </View>
      </Dialog.Content>
    </Dialog>
  )
}

function progressionOf(activity: Activity, dailyGoal: number) {
  return getLevel({
    bestStreak: activity.bestStreak,
    dailyGoal,
    recentDays: activity.recentDays,
    totalReps: activity.totalPushups,
  })
}

function reachedDailyGoal(before: Activity, after: Activity, target: number) {
  return before.todayReps < target && after.todayReps >= target
}

function hasProgressionAchievement(
  before: Activity | undefined,
  after: Activity | undefined,
  target: number
) {
  if (!before || !after) return false

  return (
    reachedDailyGoal(before, after, target) ||
    after.currentStreak > before.currentStreak ||
    progressionOf(after, target).level > progressionOf(before, target).level
  )
}

export function AchievementOverlay({
  after,
  before,
  onDone,
  soundEnabled,
}: {
  after: Activity
  before: Activity
  onDone: () => void
  soundEnabled: boolean
}) {
  const { width } = useWindowDimensions()
  const { plan } = usePlan()
  const beforeProgression = progressionOf(before, plan.targetReps)
  const afterProgression = progressionOf(after, plan.targetReps)
  const goalReached = reachedDailyGoal(before, after, plan.targetReps)
  const levelIncreased = afterProgression.level > beforeProgression.level
  const streakIncreased = after.currentStreak > before.currentStreak
  const [revealedItems, setRevealedItems] = useState(0)
  const handleOpenChange = getOpenChange(onDone)
  const itemCount =
    Number(streakIncreased) + Number(goalReached) + Number(levelIncreased)
  const lowerItemCount = Number(goalReached) + Number(levelIncreased)
  const streakRevealed = revealedItems > 0
  const goalRevealed = revealedItems > Number(streakIncreased)
  const levelRevealed =
    revealedItems > Number(streakIncreased) + Number(goalReached)
  const progression = levelRevealed ? afterProgression : beforeProgression
  const todayReps = goalRevealed ? after.todayReps : before.todayReps
  const itemSize = getProgressionItemSize(
    width,
    Math.max(Number(streakIncreased), lowerItemCount)
  )
  const itemStyle = { height: itemSize, width: itemSize }

  useEffect(() => {
    playSfx("achievement", soundEnabled)

    const timeouts = Array.from({ length: itemCount }, (_, index) =>
      setTimeout(
        () => setRevealedItems(index + 1),
        PROGRESSION_REVEAL_DELAY_MS + index * PROGRESSION_STAGGER_MS
      )
    )

    return () => timeouts.forEach(clearTimeout)
  }, [itemCount, soundEnabled])

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <Dialog.Content
        blur
        className="border-0 bg-transparent p-0 shadow-none"
        dismissSfx={false}
      >
        <View className="w-full items-center gap-2">
          {streakIncreased ? (
            <View className="items-center justify-center" style={itemStyle}>
              <Streak
                animationDuration={PROGRESSION_ANIMATION_DURATION_MS}
                days={
                  streakRevealed ? after.currentStreak : before.currentStreak
                }
                size={itemSize}
              />
            </View>
          ) : null}
          {lowerItemCount > 0 ? (
            <View className="w-full flex-row items-center justify-center gap-2">
              {goalReached ? (
                <View className="items-center justify-center" style={itemStyle}>
                  <TodayRepsRing
                    animationDuration={PROGRESSION_ANIMATION_DURATION_MS}
                    reps={todayReps}
                    size={itemSize}
                    target={plan.targetReps}
                  />
                </View>
              ) : null}
              {levelIncreased ? (
                <View className="items-center justify-center" style={itemStyle}>
                  <LevelRings
                    animationDuration={PROGRESSION_ANIMATION_DURATION_MS}
                    level={progression.level}
                    milestones={progression.milestones}
                    size={itemSize}
                  />
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
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
  const hasAchievement = hasProgressionAchievement(
    before,
    after,
    plan.targetReps
  )
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
    <AchievementOverlay
      after={after}
      before={before}
      onDone={finish}
      soundEnabled={session.soundEnabled}
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
