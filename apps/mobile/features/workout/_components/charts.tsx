/* eslint-disable react-perf/jsx-no-new-array-as-prop, react-perf/jsx-no-new-function-as-prop -- React Compiler stabilizes chart props. */

import {
  HeatmapChart,
  buildHeatmapCalendar,
  type HeatmapCell,
} from "@/components/ui/heatmap-chart"
import {
  formatActivityDate,
  getActivityDaysAgo,
} from "@/features/workout/_lib/activity-window"
import { DEMO_DATA } from "@/features/workout/_lib/demo"
import { useI18n } from "@/hooks/use-i18n"
import { hapticHard } from "@/lib/haptics"
import { BarChart, type BarChartDatum } from "panelui-native"
import { useRef } from "react"
import { ScrollView, View } from "react-native"

const HEATMAP_WEEK_START = 1

type ActivityDay = { date: string; reps: number }

function parseActivityDate(date: string) {
  return new Date(`${date}T00:00:00`)
}

function getShortDay(date: string, locale: string) {
  return parseActivityDate(date).toLocaleDateString(locale, {
    weekday: "short",
  })
}

function hapticBarSelection(_: number, datum: BarChartDatum | null) {
  if (datum) hapticHard()
}

function hapticCellSelection(cell: HeatmapCell | null) {
  if (cell) hapticHard()
}

function getDateLabel(
  date: Date,
  today: number,
  locale: string,
  formatNumber: (value: number) => string,
  t: ReturnType<typeof useI18n>["t"]
) {
  const dateKey = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-")
  const daysAgo = getActivityDaysAgo(dateKey, today)

  if (daysAgo === 0) return t("date.today")
  if (daysAgo === 1) return t("date.yesterday")
  if (daysAgo <= 7) {
    return t("date.daysAgo", { count: formatNumber(daysAgo) })
  }

  return formatActivityDate(dateKey, locale)
}

export function DailyColumns({ days }: { days: readonly ActivityDay[] }) {
  const { formatNumber, locale, t } = useI18n()
  const data = days.map((day) => ({
    date: day.date,
    label: getShortDay(day.date, locale),
    reps: day.reps,
  }))

  const labelDatum = (datum: BarChartDatum) => {
    const reps = Number(datum.reps ?? 0)
    const repLabel = t(reps === 1 ? "common.rep" : "common.reps")

    return `${String(datum.label ?? "")}: ${formatNumber(reps)} ${repLabel}`
  }

  return (
    <View className="-mx-2.5">
      <BarChart
        accessibilityLabel={t("today.activity")}
        accessibilityLabelForDatum={labelDatum}
        aspectRatio={2.5}
        data={data}
        minBarLength={2}
        onAccessibilityDatumPress={hapticHard}
        onActiveIndexChange={hapticBarSelection}
        xDataKey="label"
      >
        <BarChart.Grid opacity={0.45} rows={3} />
        <BarChart.Bar colorIndex={3} dataKey="reps" />
        <BarChart.XAxis />
        <BarChart.Tooltip
          formatValue={(value) =>
            `${formatNumber(value)} ${t(
              value === 1 ? "common.rep" : "common.reps"
            )}`
          }
        />
      </BarChart>
    </View>
  )
}

export function ActivityHeatmap({
  recentDays,
  today,
}: {
  recentDays: readonly ActivityDay[]
  today: number
}) {
  const { formatNumber, locale, t } = useI18n()
  const scrollView = useRef<ScrollView>(null)
  const entries = recentDays.map((day) => ({
    count: day.reps,
    date: parseActivityDate(day.date),
  }))
  const weeks = buildHeatmapCalendar(entries, {
    end: new Date(today),
    start: entries[0]?.date,
    weekStartDay: HEATMAP_WEEK_START,
  })

  const valueCell = (cell: HeatmapCell) => {
    const repLabel = t(cell.count === 1 ? "common.rep" : "common.reps")
    return `${formatNumber(cell.count)} ${repLabel}`
  }

  const titleCell = (cell: HeatmapCell) =>
    cell.date ? getDateLabel(cell.date, today, locale, formatNumber, t) : ""

  const labelCell = (cell: HeatmapCell) => {
    const value = valueCell(cell)
    const title = titleCell(cell)

    return title ? `${title}: ${value}` : value
  }
  const heatmap = (
    <HeatmapChart
      accessibilityLabel={t("today.activity")}
      accessibilityLabelForDatum={labelCell}
      className={DEMO_DATA ? "w-[428px]" : undefined}
      color="--color-chart-3"
      data={weeks}
      gap={4}
      layout={DEMO_DATA ? "fluid" : "fill"}
      onAccessibilityDatumPress={hapticHard}
      onActiveCellChange={hapticCellSelection}
      weekStartDay={HEATMAP_WEEK_START}
    >
      <HeatmapChart.XAxis
        className="mb-0.5"
        formatLabel={(date) =>
          date.toLocaleDateString(locale, { month: "short" })
        }
      />
      <HeatmapChart.Cells cornerRadius={3} />
      <HeatmapChart.Tooltip
        className="w-[132px]"
        formatTitle={titleCell}
        formatValue={valueCell}
      />
    </HeatmapChart>
  )

  return (
    <View className="gap-2">
      {DEMO_DATA ? (
        <ScrollView
          horizontal
          onContentSizeChange={() =>
            scrollView.current?.scrollToEnd({ animated: false })
          }
          ref={scrollView}
          showsHorizontalScrollIndicator={false}
        >
          {heatmap}
        </ScrollView>
      ) : (
        heatmap
      )}
    </View>
  )
}
