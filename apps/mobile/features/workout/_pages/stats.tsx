import { Text } from "@/components/ui/text"
import { BadgeGrid } from "@/features/workout/_components/badges"
import { ActivityHeatmap } from "@/features/workout/_components/charts"
import {
  Hero,
  Overline,
  Slab,
  StatGrid,
  StatTile,
} from "@/features/workout/_components/figures"
import { useActivity } from "@/features/workout/_hooks/use-activity"
import type { Activity } from "@/features/workout/_lib/activity"
import { formatCompact, formatSeconds } from "@/features/workout/_lib/format"
import {
  formatMilestoneRemaining,
  getLevel,
} from "@/features/workout/_lib/gamification"
import { useMinimizeOnScroll } from "expo-glass-tabs"
import {
  DumbbellIcon,
  TimerIcon,
  TrendingUpIcon,
  TrophyIcon,
} from "lucide-react-native"
import { StyleSheet, View } from "react-native"
import Animated from "react-native-reanimated"
import { SafeAreaView } from "react-native-safe-area-context"

const SCREEN_EDGES = ["top"] as const
const EMPTY_DAYS = Array.from({ length: 16 * 7 }, (_, index) => ({
  date: `placeholder-${index}`,
  reps: 0,
}))
const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingBottom: 140,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
})

function OverviewTiles({ activity }: { activity: Activity | undefined }) {
  return (
    <StatGrid>
      <StatTile
        icon={TrendingUpIcon}
        label="Success rate"
        value={activity ? `${activity.successRate}%` : "—"}
      />
      <StatTile
        icon={TimerIcon}
        label="Avg. rep"
        value={activity ? formatSeconds(activity.averageRepMs) : "—"}
      />
      <StatTile
        icon={DumbbellIcon}
        label="Sessions"
        value={activity ? String(activity.totalSessions) : "—"}
      />
      <StatTile
        icon={TrophyIcon}
        label="Best day"
        value={activity ? String(activity.bestDayReps) : "—"}
      />
    </StatGrid>
  )
}

function StreakRow({ best, current }: { best: number; current: number }) {
  return (
    <View className="flex-row gap-6">
      <View className="flex-1 gap-1">
        <Text variant="muted">Current streak</Text>
        <Text className="font-heading text-2xl font-bold">
          {current} {current === 1 ? "day" : "days"}
        </Text>
      </View>
      <View className="flex-1 gap-1">
        <Text variant="muted">Best streak</Text>
        <Text className="font-heading text-2xl font-bold">
          {best} {best === 1 ? "day" : "days"}
        </Text>
      </View>
    </View>
  )
}

function ActivitySection({ activity }: { activity: Activity | undefined }) {
  return (
    <Slab>
      <View className="gap-1">
        <Overline>Activity</Overline>
        <Text variant="muted">Last 16 weeks</Text>
      </View>
      <ActivityHeatmap days={activity?.recentDays ?? EMPTY_DAYS} />
      <View className="h-px bg-border" />
      <StreakRow
        best={activity?.bestStreak ?? 0}
        current={activity?.currentStreak ?? 0}
      />
    </Slab>
  )
}

function MilestonesSection({ activity }: { activity: Activity | undefined }) {
  const { level, milestones, nextLevel } = getLevel({
    bestStreak: activity?.bestStreak ?? 0,
    recentDays: activity?.recentDays ?? [],
    totalReps: activity?.totalPushups ?? 0,
  })
  const next = milestones.find((milestone) => !milestone.earned)

  return (
    <Slab>
      <View className="gap-1">
        <Overline>Milestones</Overline>
        <Text variant="muted">
          {next
            ? `Level ${nextLevel}: ${next.label} — ${formatMilestoneRemaining(next)} to go`
            : level === 100
              ? "Every level unlocked. Respect."
              : `Level ${nextLevel} milestone ready.`}
        </Text>
      </View>
      <BadgeGrid badges={milestones} />
    </Slab>
  )
}

export default function StatsPage() {
  const onScroll = useMinimizeOnScroll()
  const { activity, isAuthenticated } = useActivity()

  return (
    <SafeAreaView className="flex-1 bg-background" edges={SCREEN_EDGES}>
      <Animated.ScrollView
        className="flex-1"
        contentContainerStyle={styles.content}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <Text className="py-2 font-heading text-base font-semibold">
          Progression
        </Text>

        <Hero
          caption={
            isAuthenticated
              ? "Valid push-ups, all time"
              : "Connecting your profile…"
          }
          label="Total push-ups"
          value={activity ? formatCompact(activity.totalPushups) : "—"}
        />

        <OverviewTiles activity={activity} />
        <ActivitySection activity={activity} />
        <MilestonesSection activity={activity} />
      </Animated.ScrollView>
    </SafeAreaView>
  )
}
