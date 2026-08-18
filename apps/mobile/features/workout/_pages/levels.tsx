import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Text } from "@/components/ui/text"
import { Slab } from "@/features/workout/_components/figures"
import { useActivity } from "@/features/workout/_hooks/use-activity"
import { formatCompact } from "@/features/workout/_lib/format"
import {
  getLevel,
  getLevelRequirements,
  type LevelRequirement,
} from "@/features/workout/_lib/gamification"
import { cn } from "@/lib/utils"
import { useRouter } from "expo-router"
import { CheckIcon, ChevronLeftIcon } from "lucide-react-native"
import { useEffect, useRef } from "react"
import { ScrollView, StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const SCREEN_EDGES = ["top", "bottom"] as const
const REQUIREMENTS = getLevelRequirements()
const CURRENT_LEVEL_CONTEXT_ROWS = 2
const LEVEL_ROW_HEIGHT = 44

const styles = StyleSheet.create({
  content: {
    gap: 16,
    padding: 20,
    paddingBottom: 40,
  },
  levelNumber: { width: 58 },
})

function getBack(router: ReturnType<typeof useRouter>) {
  return () => router.back()
}

function getLevelOffset(level: number) {
  return Math.max(
    0,
    (level - CURRENT_LEVEL_CONTEXT_ROWS - 1) * LEVEL_ROW_HEIGHT
  )
}

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Button
      accessibilityLabel="Go back"
      className="rounded-full bg-muted"
      onPress={onPress}
      size="icon-sm"
      variant="ghost"
    >
      <Icon as={ChevronLeftIcon} className="text-foreground" />
    </Button>
  )
}

function RequirementText({
  completed,
  requirement,
}: {
  completed: boolean
  requirement: LevelRequirement
}) {
  const parts = [
    `${formatCompact(requirement.totalReps)} total`,
    requirement.streak > 0 ? `${requirement.streak}d streak` : null,
    requirement.recentDailyAverage > 0
      ? `${requirement.recentDailyAverage}/day`
      : null,
  ].filter((part) => part !== null)

  return (
    <Text
      className={cn(
        "text-sm text-muted-foreground",
        completed && "line-through"
      )}
    >
      {parts.join(" · ")}
    </Text>
  )
}

function LevelRow({
  completed,
  requirement,
}: {
  completed: boolean
  requirement: LevelRequirement
}) {
  return (
    <View className="flex-row items-center gap-3 py-2">
      <Text
        className={cn(
          "font-heading text-base font-bold tabular-nums",
          completed && "text-muted-foreground line-through"
        )}
        style={styles.levelNumber}
      >
        {requirement.level}
      </Text>
      <View className="flex-1">
        <RequirementText completed={completed} requirement={requirement} />
      </View>
      {completed ? (
        <View className="size-7 items-center justify-center rounded-full bg-primary/15">
          <Icon as={CheckIcon} className="text-primary" />
        </View>
      ) : null}
    </View>
  )
}

export default function LevelsPage() {
  const router = useRouter()
  const scrollRef = useRef<ScrollView>(null)
  const { activity } = useActivity()
  const { level } = getLevel({
    bestStreak: activity?.bestStreak ?? 0,
    recentDays: activity?.recentDays ?? [],
    totalReps: activity?.totalPushups ?? 0,
  })

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        animated: false,
        y: getLevelOffset(level),
      })
    })

    return () => cancelAnimationFrame(frame)
  }, [level])

  return (
    <SafeAreaView className="flex-1 bg-background" edges={SCREEN_EDGES}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        <View className="flex-row items-center">
          <BackButton onPress={getBack(router)} />
          <Text
            accessibilityRole="header"
            className="flex-1 text-center font-heading text-lg font-bold tracking-[2px]"
          >
            LEVELS
          </Text>
          <View className="size-10" />
        </View>
        <Slab>
          <View>
            {REQUIREMENTS.map((requirement) => (
              <LevelRow
                completed={requirement.level <= level}
                key={requirement.level}
                requirement={requirement}
              />
            ))}
          </View>
        </Slab>
      </ScrollView>
    </SafeAreaView>
  )
}
