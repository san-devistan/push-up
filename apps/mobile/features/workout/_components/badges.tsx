import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/icon"
import { Text } from "@/components/ui/text"
import { formatCompact } from "@/features/workout/_lib/format"
import type { LevelMilestone } from "@/features/workout/_lib/gamification"
import { cn } from "@/lib/utils"
import { CheckIcon, LockIcon } from "lucide-react-native"
import { StyleSheet, View } from "react-native"

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
})

function getMilestoneText(milestone: LevelMilestone) {
  if (milestone.earned) {
    return milestone.label
  }

  const value = Math.min(milestone.value, milestone.target)
  const progress =
    milestone.id === "totalReps"
      ? `${formatCompact(value)}/${formatCompact(milestone.target)}`
      : `${value.toLocaleString()}/${milestone.target.toLocaleString()}`

  if (milestone.id === "totalReps") {
    return `${progress} total`
  }

  if (milestone.id === "streak") {
    return `${progress}d streak`
  }

  return `${progress}/day`
}

function MilestoneChip({ milestone }: { milestone: LevelMilestone }) {
  const text = getMilestoneText(milestone)

  return (
    <Badge
      accessibilityLabel={`${text}, ${milestone.earned ? "earned" : "in progress"}`}
      className={cn(
        "h-auto flex-row items-center gap-2 px-3 py-2",
        milestone.earned
          ? "bg-primary/25 dark:bg-primary/15"
          : "border-border bg-background dark:bg-muted"
      )}
      variant="secondary"
    >
      <Icon
        as={milestone.earned ? CheckIcon : LockIcon}
        className={milestone.earned ? "text-primary" : "text-muted-foreground"}
      />
      <Text
        className={cn(
          "text-sm font-semibold",
          milestone.earned ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {text}
      </Text>
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
