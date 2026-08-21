import { NUMERIC_TEXT_SLOT, NumericPhrase } from "@/components/numeric-text"
import { getCompactNumber } from "@/features/workout/_lib/format"
import type { LevelMilestone } from "@/features/workout/_lib/gamification"
import { useI18n } from "@/hooks/use-i18n"
import { cn } from "@/lib/utils"
import { Badge, CheckIcon, LockIcon, Progress } from "panelui-native"
import { StyleSheet, View } from "react-native"
import { useCSSVariable } from "uniwind"

const styles = StyleSheet.create({
  grid: { flexDirection: "row", gap: 8 },
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
    ? "text-xs font-semibold text-primary-foreground"
    : "text-xs font-semibold text-foreground"

  return (
    <Badge
      accessibilityLabel={t("accessibility.badgeProgress", {
        label,
        percent: Math.round(progress),
      })}
      className={cn(
        "relative h-10 min-w-0 flex-1 overflow-hidden border-border bg-background p-0 dark:bg-muted",
        milestone.earned && "border-primary bg-primary dark:bg-primary"
      )}
      variant="secondary"
    >
      {milestone.earned ? null : (
        <Progress
          accessibilityElementsHidden
          className="absolute inset-x-0 bottom-0"
          importantForAccessibility="no-hide-descendants"
          indicatorClassName="bg-primary/30"
          pointerEvents="none"
          size="sm"
          value={progress}
        />
      )}
      <View className="z-10 min-w-0 flex-1 flex-row items-center justify-center gap-1.5 px-2">
        {milestone.earned ? (
          <CheckIcon
            color={
              typeof primaryForeground === "string"
                ? primaryForeground
                : undefined
            }
            size={14}
          />
        ) : (
          <LockIcon size={14} />
        )}
        <NumericPhrase
          className={textClassName}
          maximumFractionDigits={2}
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
