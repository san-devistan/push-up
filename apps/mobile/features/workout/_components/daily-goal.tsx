import { NumericText } from "@/components/numeric-text"
import { usePlan } from "@/features/workout/_hooks/use-plan"
import type { Activity } from "@/features/workout/_lib/activity"
import {
  getLevel,
  type LevelMilestone,
} from "@/features/workout/_lib/gamification"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { useI18n } from "@/hooks/use-i18n"
import { hapticHard } from "@/lib/haptics"
import { GridItem, RingChart, Text, type RingDatum } from "panelui-native"
import { useCallback, useMemo, useState } from "react"
import { StyleSheet, View } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import { useSharedValue } from "react-native-reanimated"
import { scheduleOnRN } from "react-native-worklets"
import { useCSSVariable } from "uniwind"

const RING_SIZE = 144
const RING_STROKE = 14
const MILESTONE_RING_STROKE = 8
const MILESTONE_RING_GAP = 4
const MILESTONE_HOLD_MS = 180
/** Past this a tick per rep is thinner than the gap between ticks. */
const COUNTABLE_REPS = 30

const styles = StyleSheet.create({
  centerNumber: { fontSize: 40, lineHeight: 52 },
  centerTarget: { fontSize: 16 },
  levelNumber: { fontSize: 32, lineHeight: 40 },
  ringGesture: { height: RING_SIZE, width: RING_SIZE },
})

function useThemeColor(name: string) {
  const value = useCSSVariable(name)
  return typeof value === "string" ? value : undefined
}

function GoalRing({
  done,
  reps,
  target,
}: {
  done: boolean
  reps: number
  target: number
}) {
  const { formatNumber, t } = useI18n()
  const primary = useThemeColor("--color-primary")
  const success = useThemeColor("--color-success")
  const color = done ? success : primary
  const label = t("plan.dailyGoal")
  const data = useMemo(
    () => [{ label, maxValue: target, value: reps }],
    [label, reps, target]
  )
  const renderCenter = useCallback(
    () => (
      <View className="items-center">
        <Text
          className="font-heading text-foreground"
          style={styles.centerNumber}
        >
          {formatNumber(reps)}
          <Text
            className="font-heading text-muted-foreground"
            style={styles.centerTarget}
          >
            /{formatNumber(target)}
          </Text>
        </Text>
        <Text className="-mt-2 font-heading text-[10px] leading-3 tracking-[1px] text-muted-foreground">
          {t("common.reps").toLocaleLowerCase()}
        </Text>
      </View>
    ),
    [formatNumber, reps, t, target]
  )

  return (
    <RingChart
      accessibilityLabel={
        done
          ? t("today.dailyGoalCompleted")
          : t("accessibility.badgeProgress", {
              label,
              percent: Math.round((reps / Math.max(1, target)) * 100),
            })
      }
      className="w-36"
      data={data}
      /* Remounting replays the sweep: the arc closing a little further is the
         payoff for coming back from a session, and Today never unmounts. */
      key={reps}
      size={RING_SIZE}
      strokeWidth={RING_STROKE}
    >
      <RingChart.Ring
        color={color}
        index={0}
        segments={target <= COUNTABLE_REPS ? target : undefined}
      />
      <RingChart.Center>{renderCenter}</RingChart.Center>
    </RingChart>
  )
}

function MilestoneRings({
  level,
  milestones,
}: {
  level: number
  milestones: LevelMilestone[]
}) {
  const { t } = useI18n()
  const isDark = useColorScheme() === "dark"
  const [activeIndex, setActiveIndex] = useState(-1)
  const lastIndex = useSharedValue(-1)
  const data = useMemo(
    () =>
      milestones.map(({ label, target, value }) => ({
        label,
        maxValue: target,
        value,
      })),
    [milestones]
  )
  const renderCenter = useCallback(
    (ring: RingDatum | null) =>
      ring ? (
        <Text className="text-center font-heading text-xs text-foreground">
          {ring.label}
        </Text>
      ) : (
        <View className="items-center">
          <NumericText style={styles.levelNumber} value={level} />
          <Text className="-mt-2 font-heading text-[10px] leading-3 tracking-[1px] text-muted-foreground">
            {t("today.level", { level: "" }).trim().toLocaleLowerCase()}
          </Text>
        </View>
      ),
    [level, t]
  )
  const focus = (index: number) => {
    setActiveIndex(index)
    hapticHard()
  }
  const clear = () => setActiveIndex(-1)
  const focusAt = (x: number, y: number) => {
    "worklet"
    const radius = RING_SIZE / 2 - MILESTONE_RING_STROKE / 2
    const distance = Math.hypot(x - RING_SIZE / 2, y - RING_SIZE / 2)
    const index = Math.max(
      0,
      Math.min(
        milestones.length - 1,
        Math.round(
          (radius - distance) / (MILESTONE_RING_STROKE + MILESTONE_RING_GAP)
        )
      )
    )
    if (index === lastIndex.value) return
    lastIndex.value = index
    scheduleOnRN(focus, index)
  }
  const gesture = Gesture.Pan()
    .minDistance(0)
    .activateAfterLongPress(MILESTONE_HOLD_MS)
    .onStart((event) => {
      "worklet"
      focusAt(event.x, event.y)
    })
    .onUpdate((event) => {
      "worklet"
      focusAt(event.x, event.y)
    })
    .onFinalize(() => {
      "worklet"
      if (lastIndex.value === -1) return
      lastIndex.value = -1
      scheduleOnRN(clear)
    })

  if (milestones.length === 0) {
    return null
  }

  return (
    <GestureDetector gesture={gesture}>
      <View collapsable={false} style={styles.ringGesture}>
        <RingChart
          accessibilityLabel={t("today.level", { level })}
          activeIndex={activeIndex}
          className="w-36"
          data={data}
          ringGap={MILESTONE_RING_GAP}
          size={RING_SIZE}
          strokeWidth={MILESTONE_RING_STROKE}
        >
          <RingChart.Ring colorIndex={isDark ? 1 : 2} index={0} />
          <RingChart.Ring colorIndex={isDark ? 2 : 3} index={1} />
          <RingChart.Ring colorIndex={isDark ? 3 : 4} index={2} />
          <RingChart.Center>{renderCenter}</RingChart.Center>
        </RingChart>
      </View>
    </GestureDetector>
  )
}

export function DailyGoal({ activity }: { activity: Activity | undefined }) {
  const { plan } = usePlan()
  const target = plan.targetReps
  const reps = activity?.todayReps ?? 0
  const done = reps >= target
  const { level, milestones } = getLevel({
    bestStreak: activity?.bestStreak ?? 0,
    dailyGoal: target,
    recentDays: activity?.recentDays ?? [],
    totalReps: activity?.totalPushups ?? 0,
  })

  return (
    <GridItem.Group aspect={1} columns={2} gap={12} size="sm">
      <GridItem
        className="items-center justify-end overflow-visible"
        variant="plain"
      >
        <GoalRing done={done} reps={reps} target={target} />
      </GridItem>
      <GridItem
        className="items-center justify-end overflow-visible"
        variant="plain"
      >
        <MilestoneRings level={level} milestones={milestones} />
      </GridItem>
    </GridItem.Group>
  )
}
