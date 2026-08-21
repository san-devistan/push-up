/* eslint-disable react-perf/jsx-no-new-array-as-prop, react-perf/jsx-no-new-function-as-prop -- React Compiler stabilizes chart props. */

import {
  formatActivityDate,
  getActivityDaysAgo,
} from "@/features/workout/_lib/activity-window"
import { useI18n } from "@/hooks/use-i18n"
import {
  BarChart,
  HeatmapChart,
  buildHeatmapCalendar,
  type BarChartDatum,
  type HeatmapCell,
  type HeatmapColumn,
} from "panelui-native"
import { useEffect, useRef } from "react"
import { ScrollView, View } from "react-native"

const HEATMAP_WEEK_START = 1
const EMPTY_HEATMAP_DATA: HeatmapColumn[] = []

type ActivityDay = { date: string; reps: number }

function parseActivityDate(date: string) {
  return new Date(`${date}T00:00:00`)
}

function getShortDay(date: string, locale: string) {
  return parseActivityDate(date).toLocaleDateString(locale, {
    weekday: "short",
  })
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
    <BarChart
      accessibilityLabel={t("today.activity")}
      accessibilityLabelForDatum={labelDatum}
      aspectRatio={2.5}
      data={data}
      minBarLength={2}
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
  const weekdayLabels = Array.from({ length: 7 }, (_, index) =>
    new Date(2024, 0, index + 1).toLocaleDateString(locale, {
      weekday: "short",
    })
  )

  useEffect(() => {
    scrollView.current?.scrollToEnd({ animated: false })
  }, [weeks.length])

  const labelCell = (cell: HeatmapCell) => {
    const repLabel = t(cell.count === 1 ? "common.rep" : "common.reps")
    const value = `${formatNumber(cell.count)} ${repLabel}`

    return cell.date
      ? `${getDateLabel(cell.date, today, locale, formatNumber, t)}: ${value}`
      : value
  }

  return (
    <View className="gap-2">
      <ScrollView
        horizontal
        ref={scrollView}
        showsHorizontalScrollIndicator={false}
      >
        <HeatmapChart
          accessibilityLabel={t("today.activity")}
          accessibilityLabelForDatum={labelCell}
          binSize={14}
          color="--color-chart-3"
          data={weeks}
          gap={4}
          weekStartDay={HEATMAP_WEEK_START}
        >
          <HeatmapChart.XAxis
            formatLabel={(date) =>
              date.toLocaleDateString(locale, { month: "short" })
            }
          />
          <HeatmapChart.YAxis labels={weekdayLabels} width={28} />
          <HeatmapChart.Cells cornerRadius={3} />
          <HeatmapChart.Tooltip formatLabel={labelCell} />
        </HeatmapChart>
      </ScrollView>
      <HeatmapChart data={EMPTY_HEATMAP_DATA}>
        <HeatmapChart.Legend
          lessLabel={t("charts.less")}
          moreLabel={t("charts.more")}
          swatchSize={10}
        />
      </HeatmapChart>
    </View>
  )
}
