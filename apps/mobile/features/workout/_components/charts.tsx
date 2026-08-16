import { Text } from "@/components/ui/text"
import { cn } from "@/lib/utils"
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native"

const HEATMAP_WEEKS = 16
const COLUMN_MAX_WIDTH = 24

const styles = StyleSheet.create({
  baseline: { height: StyleSheet.hairlineWidth },
  cell: { aspectRatio: 1, borderCurve: "continuous", borderRadius: 3 },
  columnCap: { borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  columnLabel: { height: 18 },
  columnSlot: { maxWidth: COLUMN_MAX_WIDTH },
  legendSwatch: { borderRadius: 2, height: 10, width: 10 },
  plot: { height: 124 },
})

const RAMP = ["bg-primary/25", "bg-primary/45", "bg-primary/70", "bg-primary"]

function rampClass(reps: number) {
  if (reps >= 50) {
    return RAMP[3]
  }
  if (reps >= 25) {
    return RAMP[2]
  }
  if (reps >= 10) {
    return RAMP[1]
  }
  if (reps > 0) {
    return RAMP[0]
  }
  return "bg-muted"
}

function Cell({ date, reps }: { date: string; reps: number }) {
  const isPlaceholder = date.startsWith("placeholder-")

  return (
    <View
      accessible={!isPlaceholder}
      accessibilityLabel={isPlaceholder ? undefined : `${date}: ${reps} reps`}
      className={rampClass(reps)}
      style={styles.cell}
    />
  )
}

function LegendSwatch({ className }: { className: string }) {
  return <View className={className} style={styles.legendSwatch} />
}

function getColumnStyle(percent: number): StyleProp<ViewStyle> {
  return StyleSheet.compose(styles.columnCap, { height: `${percent}%` })
}

export function ActivityHeatmap({
  days,
}: {
  days: ReadonlyArray<{ date: string; reps: number }>
}) {
  const weeks = Array.from({ length: HEATMAP_WEEKS }, (_, index) =>
    days.slice(index * 7, index * 7 + 7)
  )

  return (
    <View className="gap-3">
      <View className="flex-row gap-1">
        {weeks.map((week) => (
          <View className="flex-1 gap-1" key={week[0]?.date}>
            {week.map((day) => (
              <Cell date={day.date} key={day.date} reps={day.reps} />
            ))}
          </View>
        ))}
      </View>
      <View className="flex-row items-center justify-end gap-1.5">
        <Text className="text-xs text-muted-foreground">Less</Text>
        <LegendSwatch className="bg-muted" />
        {RAMP.map((className) => (
          <LegendSwatch className={className} key={className} />
        ))}
        <Text className="text-xs text-muted-foreground">More</Text>
      </View>
    </View>
  )
}

function Column({
  isPeak,
  percent,
  reps,
}: {
  isPeak: boolean
  percent: number
  reps: number
}) {
  const columnStyle = getColumnStyle(percent)

  return (
    <View className="h-full flex-1 items-center" style={styles.columnSlot}>
      <View className="justify-center" style={styles.columnLabel}>
        {isPeak ? (
          <Text className="font-heading text-xs font-bold tabular-nums">
            {reps}
          </Text>
        ) : null}
      </View>
      <View className="w-full flex-1 justify-end">
        <View
          className={cn(
            "w-full",
            reps > 0 ? "bg-primary" : "bg-muted",
            isPeak ? "" : "opacity-70"
          )}
          style={columnStyle}
        />
      </View>
    </View>
  )
}

export function WeeklyColumns({
  weeks,
}: {
  weeks: ReadonlyArray<{ reps: number; start: string }>
}) {
  const peak = Math.max(0, ...weeks.map((week) => week.reps))

  return (
    <View className="gap-2">
      <View
        className="flex-row items-stretch justify-between gap-2"
        style={styles.plot}
      >
        {weeks.map((week) => (
          <Column
            key={week.start}
            isPeak={peak > 0 && week.reps === peak}
            percent={peak > 0 ? Math.max(3, (week.reps / peak) * 100) : 3}
            reps={week.reps}
          />
        ))}
      </View>
      <View className="bg-border" style={styles.baseline} />
      <View className="flex-row justify-between">
        <Text className="text-xs text-muted-foreground">8 weeks ago</Text>
        <Text className="text-xs text-muted-foreground">This week</Text>
      </View>
    </View>
  )
}
