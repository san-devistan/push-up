import { CheckIcon, LockIcon } from "@/components/icons"
import { NUMERIC_TEXT_SLOT, NumericPhrase } from "@/components/numeric-text"
import { getCompactNumber } from "@/features/workout/_lib/format"
import type { LevelMilestone } from "@/features/workout/_lib/gamification"
import { useI18n } from "@/hooks/use-i18n"
import { cn } from "@/lib/utils"
import { Badge, Progress } from "panelui-native"
import { StyleSheet, View } from "react-native"
import { useCSSVariable } from "uniwind"

const styles = StyleSheet.create({
  grid: { flexDirection: "row", gap: 8 },
  number: { transform: [{ translateY: 0 }] },
  tightNumber: { marginRight: -5, transform: [{ translateY: 0 }] },
})

function MilestoneChip({ milestone }: { milestone: LevelMilestone }) {
  const { t } = useI18n()
  const primaryForeground = useCSSVariable("--color-primary-foreground")
  const progress = milestone.earned
    ? 100
    : Math.max(0, (milestone.value / milestone.target) * 100)
  const target =
    milestone.id === "totalReps"
      ? getCompactNumber(milestone.target)
      : { suffix: "", value: milestone.target }
  const labelKey =
    milestone.id === "recentDailyAverage"
      ? "levels.daily"
      : milestone.id === "streak"
        ? "levels.streak"
        : "levels.total"
  const label = t(labelKey, { value: `${target.value}${target.suffix}` })
  const textClassName = milestone.earned
    ? "font-heading text-xs text-primary-foreground"
    : "font-heading text-xs text-foreground"

  return (
    <Badge
      accessibilityLabel={t("accessibility.badgeProgress", {
        label,
        percent: Math.round(progress),
      })}
      className={cn(
        "relative h-10 min-w-0 flex-1 overflow-hidden rounded-full border-border bg-background p-0 dark:bg-muted",
        milestone.earned && "border-primary bg-primary dark:bg-primary"
      )}
      variant="secondary"
    >
      {milestone.earned ? null : (
        <Progress
          accessibilityElementsHidden
          className="absolute inset-0 h-full rounded-full bg-transparent"
          importantForAccessibility="no-hide-descendants"
          indicatorClassName="h-full rounded-none bg-primary/30"
          pointerEvents="none"
          value={progress}
        />
      )}
      <View className="z-10 min-w-0 flex-1 flex-row items-center justify-center px-1.5">
        {milestone.earned ? (
          <CheckIcon
            color={
              typeof primaryForeground === "string"
                ? primaryForeground
                : undefined
            }
            size={14}
            strokeWidth={3}
          />
        ) : (
          <LockIcon size={14} strokeWidth={3} />
        )}
        <NumericPhrase
          className={textClassName}
          containerClassName="shrink items-end justify-center"
          maximumFractionDigits={2}
          style={
            milestone.id === "recentDailyAverage"
              ? styles.number
              : styles.tightNumber
          }
          template={t(labelKey, {
            value: `${NUMERIC_TEXT_SLOT}${target.suffix}`,
          })}
          textClassName={textClassName}
          value={target.value}
        />
      </View>
    </Badge>
  )
}

export function BadgeGrid({ badges }: { badges: readonly LevelMilestone[] }) {
  return (
    <View style={styles.grid}>
      {badges.map((milestone) => (
        <MilestoneChip key={milestone.id} milestone={milestone} />
      ))}
    </View>
  )
}
