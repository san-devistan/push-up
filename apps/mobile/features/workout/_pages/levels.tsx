import {
  NUMERIC_TEXT_SLOT,
  NumericPhrase,
  NumericText,
} from "@/components/numeric-text"
import { Slab } from "@/features/workout/_components/figures"
import { useActivity } from "@/features/workout/_hooks/use-activity"
import { usePlan } from "@/features/workout/_hooks/use-plan"
import { getCompactNumber } from "@/features/workout/_lib/format"
import {
  getLevel,
  getLevelRequirements,
  type LevelRequirement,
} from "@/features/workout/_lib/gamification"
import { useI18n } from "@/hooks/use-i18n"
import { cn } from "@/lib/utils"
import { useRouter } from "expo-router"
import { Button, CheckIcon, ChevronLeftIcon, Text } from "panelui-native"
import { useEffect, useRef } from "react"
import { ScrollView, StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useCSSVariable } from "uniwind"

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
  screen: { flex: 1 },
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
  const { t } = useI18n()

  return (
    <Button
      accessibilityLabel={t("levels.goBack")}
      className="h-10 w-10 rounded-full bg-muted"
      onPress={onPress}
      size="icon"
      variant="ghost"
    >
      <ChevronLeftIcon />
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
  const { t } = useI18n()
  const total = getCompactNumber(requirement.totalReps)
  const textClassName = cn(
    "text-sm text-muted-foreground",
    completed && "line-through"
  )
  const numberClassName = cn(
    "text-sm text-muted-foreground",
    completed && "text-muted-foreground"
  )

  return (
    <View className="flex-row flex-wrap items-center">
      <NumericPhrase
        className={numberClassName}
        maximumFractionDigits={2}
        template={t("levels.total", {
          value: `${NUMERIC_TEXT_SLOT}${total.suffix}`,
        })}
        textClassName={textClassName}
        value={total.value}
      />
      {requirement.streak > 0 ? (
        <>
          <Text className={textClassName}> · </Text>
          <NumericPhrase
            className={numberClassName}
            template={t("levels.streak", { value: NUMERIC_TEXT_SLOT })}
            textClassName={textClassName}
            value={requirement.streak}
          />
        </>
      ) : null}
      {requirement.recentDailyAverage > 0 ? (
        <>
          <Text className={textClassName}> · </Text>
          <NumericPhrase
            className={numberClassName}
            template={t("levels.daily", { value: NUMERIC_TEXT_SLOT })}
            textClassName={textClassName}
            value={requirement.recentDailyAverage}
          />
        </>
      ) : null}
    </View>
  )
}

function LevelRow({
  completed,
  requirement,
}: {
  completed: boolean
  requirement: LevelRequirement
}) {
  const primary = useCSSVariable("--color-primary")

  return (
    <View className="flex-row items-center gap-3 py-2">
      <NumericText
        className={cn("text-base", completed && "text-muted-foreground")}
        style={styles.levelNumber}
        value={requirement.level}
      />
      <View className="flex-1">
        <RequirementText completed={completed} requirement={requirement} />
      </View>
      {completed ? (
        <View className="size-7 items-center justify-center rounded-full bg-primary/15">
          <CheckIcon
            color={typeof primary === "string" ? primary : undefined}
          />
        </View>
      ) : null}
    </View>
  )
}

export default function LevelsPage() {
  const { t } = useI18n()
  const router = useRouter()
  const scrollRef = useRef<ScrollView>(null)
  const { activity } = useActivity()
  const { plan } = usePlan()
  const { level } = getLevel({
    bestStreak: activity?.bestStreak ?? 0,
    dailyGoal: plan.targetReps,
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
    <SafeAreaView edges={SCREEN_EDGES} style={styles.screen}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        <View className="flex-row items-center">
          <BackButton onPress={getBack(router)} />
          <Text
            accessibilityRole="header"
            className="flex-1 text-center font-bold text-lg tracking-[2px]"
          >
            {t("levels.levels")}
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
