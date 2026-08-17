import { Text } from "@/components/ui/text"
import { cn } from "@/lib/utils"
import { useState } from "react"
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native"

const HEATMAP_WEEKS = 16

const styles = StyleSheet.create({
  baseline: { height: StyleSheet.hairlineWidth },
  cell: { aspectRatio: 1, borderCurve: "continuous", borderRadius: 3 },
  columnCap: { borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  columnLabel: { height: 18 },
  heatmapTooltip: {
    alignSelf: "center",
    bottom: "130%",
    minWidth: 72,
    position: "absolute",
    zIndex: 20,
  },
  legendSwatch: { borderRadius: 2, height: 10, width: 10 },
  plot: { height: 124 },
  selectedCell: { zIndex: 10 },
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

function Cell({
  date,
  isSelected,
  onSelect,
  reps,
}: {
  date: string
  isSelected: boolean
  onSelect: (date: string | null) => void
  reps: number
}) {
  const isPlaceholder = date.startsWith("placeholder-")
  const select = selectDate(onSelect, date)

  return (
    <Pressable
      accessible={!isPlaceholder}
      accessibilityLabel={isPlaceholder ? undefined : `${date}: ${reps} reps`}
      accessibilityRole={isPlaceholder ? undefined : "button"}
      className={rampClass(reps)}
      disabled={isPlaceholder}
      onPress={select}
      style={StyleSheet.compose(styles.cell, isSelected && styles.selectedCell)}
    >
      {isSelected ? (
        <View
          className="rounded-full bg-popover px-2 py-1 shadow-sm"
          style={styles.heatmapTooltip}
        >
          <Text
            className="text-center text-xs font-bold tabular-nums text-popover-foreground"
            numberOfLines={1}
          >
            {reps} reps
          </Text>
        </View>
      ) : null}
    </Pressable>
  )
}

function LegendSwatch({ className }: { className: string }) {
  return <View className={className} style={styles.legendSwatch} />
}

function getColumnStyle(percent: number): StyleProp<ViewStyle> {
  return StyleSheet.compose(styles.columnCap, {
    height: `${percent}%`,
  })
}

export function ActivityHeatmap({
  days,
  showLegend = true,
}: {
  days: ReadonlyArray<{ date: string; reps: number }>
  showLegend?: boolean
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const weekCount = Math.max(
    1,
    Math.min(HEATMAP_WEEKS, Math.ceil(days.length / 7))
  )
  const weeks = Array.from({ length: weekCount }, (_, index) =>
    days.slice(index * 7, index * 7 + 7)
  )

  return (
    <View className="gap-3">
      <View className="flex-row gap-1">
        {weeks.map((week) => (
          <View className="flex-1 gap-1" key={week[0]?.date}>
            {week.map((day) => (
              <Cell
                date={day.date}
                isSelected={day.date === selectedDate}
                key={day.date}
                onSelect={setSelectedDate}
                reps={day.reps}
              />
            ))}
          </View>
        ))}
      </View>
      {showLegend ? (
        <View className="flex-row items-center justify-end gap-1.5">
          <Text className="text-xs text-muted-foreground">Less</Text>
          <LegendSwatch className="bg-muted" />
          {RAMP.map((className) => (
            <LegendSwatch className={className} key={className} />
          ))}
          <Text className="text-xs text-muted-foreground">More</Text>
        </View>
      ) : null}
    </View>
  )
}

function getShortDay(date: string) {
  if (date.startsWith("placeholder-")) {
    return ""
  }

  const timestamp = Date.parse(`${date}T00:00:00.000Z`)

  return Number.isFinite(timestamp)
    ? new Date(timestamp).toLocaleDateString(undefined, { weekday: "short" })
    : ""
}

function getPeakDate(days: ReadonlyArray<{ date: string; reps: number }>) {
  return days.reduce(
    (peak, day) => (day.reps >= peak.reps ? day : peak),
    days[0] ?? { date: "", reps: 0 }
  ).date
}

function selectDate(onSelect: (date: string | null) => void, date: string) {
  return () => onSelect(date)
}

function clearDate(onSelect: (date: string | null) => void) {
  return () => onSelect(null)
}

function DailyColumn({
  day,
  isSelected,
  onSelect,
  peak,
}: {
  day: { date: string; reps: number }
  isSelected: boolean
  onSelect: (date: string | null) => void
  peak: number
}) {
  const select = selectDate(onSelect, day.date)
  const clear = clearDate(onSelect)
  const percent = peak > 0 ? Math.max(4, (day.reps / peak) * 100) : 4

  return (
    <Pressable
      accessible={!day.date.startsWith("placeholder-")}
      accessibilityLabel={`${day.date}: ${day.reps} reps`}
      className="h-full flex-1 items-center"
      onHoverIn={select}
      onHoverOut={clear}
      onPress={select}
    >
      <View className="justify-center" style={styles.columnLabel}>
        {isSelected ? (
          <Text className="font-heading text-xs font-bold tabular-nums">
            {day.reps}
          </Text>
        ) : null}
      </View>
      <View className="w-full flex-1 justify-end">
        <View
          className={cn(
            "w-full",
            day.reps > 0 ? "bg-primary" : "bg-muted",
            isSelected ? "" : "opacity-70"
          )}
          style={getColumnStyle(percent)}
        />
      </View>
      <Text className="pt-1 text-xs text-muted-foreground">
        {getShortDay(day.date)}
      </Text>
    </Pressable>
  )
}

export function DailyColumns({
  days,
}: {
  days: ReadonlyArray<{ date: string; reps: number }>
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const peakDate = getPeakDate(days)
  const activeDate = days.some((day) => day.date === selectedDate)
    ? selectedDate
    : peakDate
  const peak = Math.max(0, ...days.map((day) => day.reps))

  return (
    <View className="gap-2">
      <View
        className="flex-row items-stretch justify-between gap-2"
        style={styles.plot}
      >
        {days.map((day) => (
          <DailyColumn
            day={day}
            isSelected={day.date === activeDate}
            key={day.date}
            onSelect={setSelectedDate}
            peak={peak}
          />
        ))}
      </View>
      <View className="bg-border" style={styles.baseline} />
    </View>
  )
}
