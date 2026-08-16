import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/icon"
import { Text } from "@/components/ui/text"
import type { LevelMilestone } from "@/features/workout/_lib/gamification"
import { cn } from "@/lib/utils"
import { CheckIcon, LockIcon } from "lucide-react-native"
import { StyleSheet, View } from "react-native"

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
})

function MilestoneChip({ milestone }: { milestone: LevelMilestone }) {
  return (
    <Badge
      accessibilityLabel={`${milestone.label}, ${milestone.earned ? "earned" : `${milestone.value} of ${milestone.target}`}`}
      className={cn(
        "h-auto gap-2 px-3 py-2",
        milestone.earned ? "bg-primary/15" : "bg-muted"
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
        {milestone.label}
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
