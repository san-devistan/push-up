/* eslint-disable react-perf/jsx-no-new-array-as-prop, react-perf/jsx-no-new-object-as-prop -- React Compiler stabilizes derived chart data and responsive styles. */
import { NumericText } from "@/components/numeric-text"
import { useDelayedValue } from "@/features/workout/_hooks/use-delayed-value"
import { usePlan } from "@/features/workout/_hooks/use-plan"
import type { Activity } from "@/features/workout/_lib/activity"
import {
  getLevel,
  type LevelMilestone,
} from "@/features/workout/_lib/gamification"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { useI18n } from "@/hooks/use-i18n"
import { selectionTick } from "@/lib/haptics"
import {
  GridItem,
  RingChart,
  Text,
  type RingChartHandle,
  type RingDatum,
} from "panelui-native"
import { useEffect, useRef, useState } from "react"
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
  centerNumber: {
    fontSize: 40,
    lineHeight: 52,
    transform: [{ translateY: -3 }, { translateX: 2 }],
  },
  centerTarget: { fontSize: 16, transform: [{ translateY: 6 }] },
  levelNumber: {
    fontSize: 32,
    lineHeight: 40,
    transform: [{ translateY: -2 }],
  },
})

function useThemeColor(name: string) {
  const value = useCSSVariable(name)
  return typeof value === "string" ? value : undefined
}

export function TodayRepsRing({
  animationDuration,
  reps,
  size = RING_SIZE,
  target,
}: {
  animationDuration?: number
  reps: number
  size?: number
  target: number
}) {
  const { formatNumber, t } = useI18n()
  const primary = useThemeColor("--color-primary")
  const success = useThemeColor("--color-success")
  const done = reps >= target
  const color = done ? success : primary
  const label = t("plan.dailyGoal")
  const ringRef = useRef<RingChartHandle>(null)
  const data = [{ label, maxValue: target, value: reps }]
  const scale = size / RING_SIZE
  const centerStyle = { transform: [{ scale: Math.max(1, scale) }] }

  useEffect(() => ringRef.current?.replay(), [reps])

  const renderCenter = () => (
    <View className="items-center" style={centerStyle}>
      <View className="flex-row items-center">
        <NumericText
          align="end"
          animationDuration={animationDuration}
          className="font-heading text-foreground"
          direction="up"
          layoutStyle={styles.centerNumber}
          layoutText={formatNumber(reps)}
          reduceMotion="system"
          style={styles.centerNumber}
          value={reps}
        />
        <Text
          className="font-heading text-muted-foreground"
          style={styles.centerTarget}
        >
          {` /${formatNumber(target)}`}
        </Text>
      </View>
      <Text className="-mt-2 font-heading text-[10px] leading-3 tracking-[1px] text-muted-foreground">
        {t("common.reps").toLocaleLowerCase()}
      </Text>
    </View>
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
      data={data}
      animationDuration={animationDuration}
      ref={ringRef}
      size={size}
      strokeWidth={RING_STROKE * scale}
      style={{ width: size }}
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

export function LevelRings({
  animationDuration,
  level,
  milestones,
  size = RING_SIZE,
}: {
  animationDuration?: number
  level: number
  milestones: LevelMilestone[]
  size?: number
}) {
  const { t } = useI18n()
  const isDark = useColorScheme() === "dark"
  const [activeIndex, setActiveIndex] = useState(-1)
  const lastIndex = useSharedValue(-1)
  const ringRef = useRef<RingChartHandle>(null)
  const scale = size / RING_SIZE
  const centerStyle = { transform: [{ scale: Math.max(1, scale) }] }
  const ringGap = MILESTONE_RING_GAP * scale
  const strokeWidth = MILESTONE_RING_STROKE * scale
  const data = milestones.map(({ label, target, value }) => ({
    label,
    maxValue: target,
    value,
  }))
  const renderCenter = (ring: RingDatum | null) =>
    ring ? (
      <View className="items-center" style={centerStyle}>
        <Text className="text-center font-heading text-xs text-foreground">
          {ring.label}
        </Text>
      </View>
    ) : (
      <View className="items-center" style={centerStyle}>
        <NumericText
          align="center"
          animationDuration={animationDuration}
          direction="up"
          reduceMotion="system"
          style={styles.levelNumber}
          value={level}
        />
        <Text className="-mt-2 font-heading text-[10px] leading-3 tracking-[1px] text-muted-foreground">
          {t("today.level", { level: "" }).trim().toLocaleLowerCase()}
        </Text>
      </View>
    )
  const focus = (index: number) => {
    setActiveIndex(index)
    selectionTick()
  }
  const clear = () => setActiveIndex(-1)
  const focusAt = (x: number, y: number) => {
    "worklet"
    const radius = size / 2 - strokeWidth / 2
    const distance = Math.hypot(x - size / 2, y - size / 2)
    const index = Math.max(
      0,
      Math.min(
        milestones.length - 1,
        Math.round((radius - distance) / (strokeWidth + ringGap))
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

  useEffect(() => {
    if (animationDuration) ringRef.current?.replay()
  }, [animationDuration, level])

  if (milestones.length === 0) {
    return null
  }

  return (
    <GestureDetector gesture={gesture}>
      <View collapsable={false} style={{ height: size, width: size }}>
        <RingChart
          accessibilityLabel={t("today.level", { level })}
          activeIndex={activeIndex}
          animationDuration={animationDuration}
          data={data}
          ref={ringRef}
          ringGap={ringGap}
          size={size}
          strokeWidth={strokeWidth}
          style={{ width: size }}
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

export function DailyGoal({
  activity,
  animationDuration,
  levelUpdateDelay = 0,
  repsUpdateDelay = 0,
}: {
  activity: Activity | undefined
  animationDuration?: number
  levelUpdateDelay?: number
  repsUpdateDelay?: number
}) {
  const { plan } = usePlan()
  const target = 90
  const reps = useDelayedValue(activity?.todayReps ?? 0, repsUpdateDelay)
  const levelActivity = useDelayedValue(activity, levelUpdateDelay)
  const { level, milestones } = getLevel({
    bestStreak: levelActivity?.bestStreak ?? 0,
    dailyGoal: target,
    recentDays: levelActivity?.recentDays ?? [],
    totalReps: levelActivity?.totalPushups ?? 0,
  })

  return (
    <GridItem.Group aspect={1} columns={2} gap={12} size="sm">
      <GridItem
        className="items-center justify-end overflow-visible"
        variant="plain"
      >
        <TodayRepsRing
          animationDuration={animationDuration}
          reps={reps}
          target={target}
        />
      </GridItem>
      <GridItem
        className="items-center justify-end overflow-visible"
        variant="plain"
      >
        <LevelRings
          animationDuration={animationDuration}
          level={level}
          milestones={milestones}
        />
      </GridItem>
    </GridItem.Group>
  )
}
