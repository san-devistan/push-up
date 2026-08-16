import {
  goalAtIndex,
  LAST_GOAL_INDEX,
  MAX_TARGET_REPS,
  MIN_TARGET_REPS,
  nearestGoalIndex,
} from "@/features/workout/_lib/goal"
import { useState, type Dispatch, type SetStateAction } from "react"
import {
  StyleSheet,
  View,
  type AccessibilityActionEvent,
  type AccessibilityActionInfo,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"

const THUMB = 26
const TRACK_HEIGHT = 8
const ADJUST_ACTIONS: AccessibilityActionInfo[] = [
  { name: "increment" },
  { name: "decrement" },
]

const styles = StyleSheet.create({
  fill: { borderRadius: 999, height: TRACK_HEIGHT },
  row: { height: THUMB + 12, justifyContent: "center" },
  thumb: {
    borderRadius: 999,
    height: THUMB,
    position: "absolute",
    width: THUMB,
  },
  track: { borderRadius: 999, height: TRACK_HEIGHT, overflow: "hidden" },
})

function getAccessibilityValue(value: number) {
  return {
    max: MAX_TARGET_REPS,
    min: MIN_TARGET_REPS,
    now: value,
  }
}

function getFillStyle(offset: number): StyleProp<ViewStyle> {
  return StyleSheet.compose(styles.fill, { width: offset + THUMB / 2 })
}

function getThumbStyle(offset: number): StyleProp<ViewStyle> {
  return StyleSheet.compose(styles.thumb, { left: offset })
}

function getGesture(commit: (x: number) => void) {
  const scrub = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-4, 4])
    .failOffsetY([-12, 12])
    .shouldCancelWhenOutside(false)
    .onStart((event) => commit(event.x))
    .onUpdate((event) => commit(event.x))
  const jump = Gesture.Tap()
    .runOnJS(true)
    .maxDuration(400)
    .onEnd((event) => commit(event.x))

  return Gesture.Race(scrub, jump)
}

function getSelect(onChange: (value: number) => void, value: number) {
  return (next: number | undefined) => {
    if (next !== undefined && next !== value) {
      onChange(next)
    }
  }
}

function getCommit(travel: number, select: (next: number | undefined) => void) {
  return (x: number) => {
    if (travel <= 0) {
      return
    }

    const ratio = Math.min(1, Math.max(0, (x - THUMB / 2) / travel))
    select(goalAtIndex(Math.round(ratio * LAST_GOAL_INDEX)))
  }
}

function getMeasure(setWidth: Dispatch<SetStateAction<number>>) {
  return (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width)
  }
}

function getAdjust(index: number, select: (next: number | undefined) => void) {
  return (event: AccessibilityActionEvent) => {
    select(
      goalAtIndex(
        index + (event.nativeEvent.actionName === "increment" ? 1 : -1)
      )
    )
  }
}

export default function GoalSlider({
  onChange,
  value,
}: {
  onChange: (value: number) => void
  value: number
}) {
  const [width, setWidth] = useState(0)
  const index = nearestGoalIndex(value)
  const travel = Math.max(0, width - THUMB)
  const offset = travel * (index / LAST_GOAL_INDEX)
  const select = getSelect(onChange, value)
  const commit = getCommit(travel, select)
  const measure = getMeasure(setWidth)
  const adjust = getAdjust(index, select)
  const accessibilityValue = getAccessibilityValue(value)
  const fillStyle = getFillStyle(offset)
  const thumbStyle = getThumbStyle(offset)
  const gesture = getGesture(commit)

  return (
    <GestureDetector gesture={gesture}>
      <View
        accessible
        accessibilityActions={ADJUST_ACTIONS}
        accessibilityLabel="Daily push-up goal"
        accessibilityRole="adjustable"
        accessibilityValue={accessibilityValue}
        onAccessibilityAction={adjust}
        onLayout={measure}
        style={styles.row}
      >
        <View className="bg-muted" style={styles.track}>
          <View className="bg-primary" style={fillStyle} />
        </View>
        <View
          className="border-2 border-background bg-primary"
          style={thumbStyle}
        />
      </View>
    </GestureDetector>
  )
}
