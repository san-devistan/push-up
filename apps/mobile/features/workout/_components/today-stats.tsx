import {
  StatNumber,
  StatPlaceholder,
  StatsDivider,
  StatsList,
  StatsListRow,
} from "@/features/workout/_components/figures"
import type { Activity } from "@/features/workout/_lib/activity"
import { getEstimatedCalories } from "@/features/workout/_lib/calories"
import { useI18n } from "@/hooks/use-i18n"
import {
  ArrowUpRightIcon,
  BadgeCheckIcon,
  ClockIcon,
  SparklesIcon,
  StarIcon,
} from "panelui-native"

const PERCENT_FORMAT = { maximumFractionDigits: 0, style: "percent" } as const

export function TodayStats({ activity }: { activity: Activity | undefined }) {
  const { t } = useI18n()
  const calories = activity
    ? getEstimatedCalories(activity.totalAttempts)
    : null

  return (
    <StatsList>
      <StatsListRow icon={ArrowUpRightIcon} label={t("common.successRate")}>
        {activity ? (
          <StatNumber
            format={PERCENT_FORMAT}
            value={activity.successRate / 100}
          />
        ) : (
          <StatPlaceholder />
        )}
      </StatsListRow>
      <StatsDivider />
      <StatsListRow icon={ClockIcon} label={t("common.avgRep")}>
        {activity ? (
          <StatNumber
            maximumFractionDigits={1}
            minimumFractionDigits={1}
            suffix={t("time.secondsShort")}
            value={activity.averageRepMs / 1000}
          />
        ) : (
          <StatPlaceholder />
        )}
      </StatsListRow>
      <StatsDivider />
      <StatsListRow icon={BadgeCheckIcon} label={t("today.sessions")}>
        {activity ? (
          <StatNumber value={activity.totalSessions} />
        ) : (
          <StatPlaceholder />
        )}
      </StatsListRow>
      <StatsDivider />
      <StatsListRow icon={SparklesIcon} label={t("today.bestStreak")}>
        {activity ? (
          <StatNumber
            suffix={` ${t(activity.bestStreak === 1 ? "common.day" : "common.days")}`}
            value={activity.bestStreak}
          />
        ) : (
          <StatPlaceholder />
        )}
      </StatsListRow>
      <StatsDivider />
      <StatsListRow icon={StarIcon} label={t("common.calories")}>
        {calories === null ? (
          <StatPlaceholder />
        ) : (
          <StatNumber
            maximumFractionDigits={1}
            minimumFractionDigits={calories < 10 ? 1 : 0}
            suffix=" kcal"
            value={calories}
          />
        )}
      </StatsListRow>
    </StatsList>
  )
}
