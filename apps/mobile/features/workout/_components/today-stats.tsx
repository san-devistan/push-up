import {
  CalendarDaysIcon,
  ClockIcon,
  type IconProps,
  TimerIcon,
  TrendingUpIcon,
  TrophyIcon,
  ZapIcon,
} from "@/components/icons"
import type { NumericTextProps } from "@/components/numeric-text"
import { Surface } from "@/components/ui/surface"
import { Overline, Slab } from "@/features/workout/_components/figures"
import type { Activity } from "@/features/workout/_lib/activity"
import { getWeeklyComparison } from "@/features/workout/_lib/activity-window"
import { getEstimatedCalories } from "@/features/workout/_lib/calories"
import { formatTotalDuration } from "@/features/workout/_lib/format"
import { useI18n } from "@/hooks/use-i18n"
import { cn } from "@/lib/utils"
import MaskedView from "@react-native-masked-view/masked-view"
import { BlurView } from "expo-blur"
import { AreaChart, GridItem, Kpi, Text } from "panelui-native"
import { Fragment, type ComponentType, type ReactNode } from "react"
import { StyleSheet, View } from "react-native"
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg"
import { useCSSVariable } from "uniwind"

const EMPTY_DAYS: Activity["recentDays"] = []

const styles = StyleSheet.create({
  statBackdrop: {
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
})

const STAT_BLUR_MASK = (
  <Svg height="100%" width="100%">
    <Defs>
      <RadialGradient id="stat-blur-mask" cx="50%" cy="50%" r="50%">
        <Stop offset="0" stopColor="#fff" stopOpacity={1} />
        <Stop offset="0.55" stopColor="#fff" stopOpacity={1} />
        <Stop offset="1" stopColor="#fff" stopOpacity={0} />
      </RadialGradient>
    </Defs>
    <Rect height="100%" width="100%" fill="url(#stat-blur-mask)" />
  </Svg>
)

function StatBackdrop({ children }: { children: ReactNode }) {
  return (
    <View style={styles.statBackdrop}>
      <MaskedView
        maskElement={STAT_BLUR_MASK}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      >
        <BlurView
          intensity={60}
          style={StyleSheet.absoluteFill}
          tint="systemUltraThinMaterial"
        />
      </MaskedView>
      {children}
    </View>
  )
}

function getCalories(activity: Activity | undefined) {
  return activity ? getEstimatedCalories(activity.totalPushups) : undefined
}

function useThemeColor(name: string) {
  const value = useCSSVariable(name)
  return typeof value === "string" ? value : undefined
}

type MetricValueProps = Pick<
  NumericTextProps,
  "maximumFractionDigits" | "minimumFractionDigits"
> & {
  className?: string
  suffix?: string
  value: null | number | undefined
}

function MetricValue({ className, suffix, value, ...props }: MetricValueProps) {
  const { formatNumber } = useI18n()

  return (
    <Text className={cn("font-heading text-3xl", className)}>
      {value == null ? "-" : formatNumber(value, props)}
      {value != null && suffix ? (
        <Text className="font-heading text-sm text-muted-foreground">
          {` ${suffix}`}
        </Text>
      ) : null}
    </Text>
  )
}

function MetricTile({
  children,
  icon: Icon,
  label,
}: {
  children: ReactNode
  icon: ComponentType<IconProps>
  label: string
}) {
  const foreground = useThemeColor("--color-foreground")

  return (
    <GridItem className="overflow-visible p-0" variant="plain">
      <Surface className="h-full pb-3" elevated padding="default">
        <GridItem.Background>
          <View className="absolute -right-5 -bottom-6 opacity-[0.14]">
            <Icon color={foreground} size={72} strokeWidth={1.5} />
          </View>
        </GridItem.Background>
        <GridItem.Title
          className="font-mono text-xs text-muted-foreground"
          numberOfLines={2}
        >
          {label}
        </GridItem.Title>
        <GridItem.Footer>{children}</GridItem.Footer>
      </Surface>
    </GridItem>
  )
}

function VolumeStat({
  percent,
  reps,
}: {
  percent: null | number
  reps: number
}) {
  const { t } = useI18n()

  return (
    <Kpi.Stat className="flex-row items-end justify-between gap-3">
      <StatBackdrop>
        <View className="pt-1.5">
          <MetricValue
            className="text-4xl leading-[44px]"
            suffix={t("common.reps")}
            value={reps}
          />
        </View>
      </StatBackdrop>
      {percent === null ? null : (
        <StatBackdrop>
          <Kpi.Trend value={percent} />
        </StatBackdrop>
      )}
    </Kpi.Stat>
  )
}

/** The section's hero: rolling 7-day volume against the seven days before it. */
function VolumeCard({ activity }: { activity: Activity | undefined }) {
  const { t } = useI18n()
  const foreground = useThemeColor("--color-foreground")
  const green = useThemeColor("--color-chart-3")
  const { current, data, percent } = getWeeklyComparison(
    activity?.recentDays ?? EMPTY_DAYS
  )
  const hasData = data.some((day) => day.current > 0 || day.previous > 0)

  return (
    <Slab>
      <Kpi className="min-h-28" colorIndex={3} surface={false}>
        {hasData ? (
          <View
            className="absolute -right-5 -bottom-5 -left-5"
            pointerEvents="none"
          >
            <AreaChart
              accessibilityLabel={t("today.weeklyPerformance")}
              accessible={false}
              aspectRatio={4}
              compact
              data={data}
              xDataKey="day"
            >
              <AreaChart.Area
                color={foreground}
                dataKey="previous"
                fillOpacity={0.12}
                strokeWidth={1.5}
              />
              <AreaChart.Area
                color={green}
                dataKey="current"
                fillOpacity={0.24}
              />
            </AreaChart>
          </View>
        ) : null}
        <Kpi.Header className="z-10 items-start">
          <View className="flex-1 flex-row items-center gap-2">
            <TrendingUpIcon color={foreground} size={14} />
            <Overline>{t("today.weeklyPerformance")}</Overline>
          </View>
          <View className="gap-1">
            <View className="flex-row items-center gap-1.5">
              <View className="h-2 w-2 rounded-[2px] bg-chart-3" />
              <Text className="font-mono text-xs text-muted-foreground">
                {t("today.thisWeek")}
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <View className="h-2 w-2 rounded-[2px] bg-foreground" />
              <Text className="font-mono text-xs text-muted-foreground">
                {t("today.lastWeek")}
              </Text>
            </View>
          </View>
        </Kpi.Header>
        <Kpi.Content className="z-10">
          <VolumeStat percent={percent} reps={current} />
        </Kpi.Content>
      </Kpi>
    </Slab>
  )
}

function RecordStat({
  label,
  suffix,
  value,
}: {
  label: string
  suffix?: string
  value: null | number | undefined
}) {
  return (
    <Kpi className="gap-1" surface={false}>
      <Kpi.Title className="font-mono text-xs text-muted-foreground">
        {label}
      </Kpi.Title>
      <MetricValue className="text-2xl" suffix={suffix} value={value} />
    </Kpi>
  )
}

function RecordsCard({ activity }: { activity: Activity | undefined }) {
  const { t } = useI18n()
  const foreground = useThemeColor("--color-foreground")
  const bestWeek = activity
    ? Math.max(0, ...activity.weeks.map((week) => week.reps))
    : undefined
  const streak = activity?.bestStreak

  return (
    <Slab className="gap-3">
      <View className="flex-row items-center gap-2">
        <TrophyIcon color={foreground} size={14} />
        <Overline>{t("today.records")}</Overline>
      </View>
      <Kpi.Group>
        <RecordStat
          label={t("today.bestDay")}
          suffix={t("common.reps")}
          value={activity?.bestDayReps}
        />
        <RecordStat
          label={t("today.bestWeek")}
          suffix={t("common.reps")}
          value={bestWeek}
        />
        <RecordStat
          label={t("today.bestStreak")}
          suffix={t(streak === 1 ? "common.day" : "common.days")}
          value={streak}
        />
      </Kpi.Group>
    </Slab>
  )
}

function MetricsGrid({ activity }: { activity: Activity | undefined }) {
  const { t } = useI18n()
  const calories = getCalories(activity)

  return (
    <GridItem.Group aspect={1.6} columns={2} gap={12} size="sm">
      <MetricTile icon={ZapIcon} label={t("common.calories")}>
        <MetricValue
          maximumFractionDigits={1}
          minimumFractionDigits={
            calories !== undefined && calories > 0 && calories < 10 ? 1 : 0
          }
          suffix="kcal"
          value={calories}
        />
      </MetricTile>

      <MetricTile icon={TimerIcon} label={t("common.avgRep")}>
        <MetricValue
          maximumFractionDigits={2}
          minimumFractionDigits={2}
          suffix={t("time.secondsShort")}
          value={activity ? activity.averageRepMs / 1000 : null}
        />
      </MetricTile>

      <MetricTile icon={CalendarDaysIcon} label={t("today.sessions")}>
        <MetricValue value={activity?.totalSessions} />
      </MetricTile>

      <MetricTile icon={ClockIcon} label={t("today.totalTime")}>
        <Text className="font-heading text-3xl">
          {activity
            ? formatTotalDuration(activity.totalDurationMs)
                .split(" ")
                .map((part, index) => (
                  <Fragment key={part.slice(-1)}>
                    {index === 0 ? null : " "}
                    {part.slice(0, -1)}
                    <Text className="font-heading text-sm text-muted-foreground">
                      {` ${part.slice(-1)}`}
                    </Text>
                  </Fragment>
                ))
            : "-"}
        </Text>
      </MetricTile>
    </GridItem.Group>
  )
}

export function TodayStats({ activity }: { activity: Activity | undefined }) {
  return (
    <View className="gap-3">
      <VolumeCard activity={activity} />
      <MetricsGrid activity={activity} />
      <RecordsCard activity={activity} />
    </View>
  )
}
