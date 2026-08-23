import { EdgeBlur } from "@/components/edge-blur"
import { CheckIcon, ChevronLeftIcon } from "@/components/icons"
import { NUMERIC_TEXT_SLOT, NumericPhrase } from "@/components/numeric-text"
import { Accordion } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Timeline } from "@/components/ui/timeline"
import WorkoutSectionRail from "@/features/workout/_components/section-rail"
import { useActivity } from "@/features/workout/_hooks/use-activity"
import { usePlan } from "@/features/workout/_hooks/use-plan"
import { getCompactNumber } from "@/features/workout/_lib/format"
import {
  getLevel,
  getLevelRequirements,
  type LevelRequirement,
} from "@/features/workout/_lib/gamification"
import { useI18n } from "@/hooks/use-i18n"
import { FONT_FAMILY } from "@/lib/theme"
import { cn } from "@/lib/utils"
import { Stack, useRouter } from "expo-router"
import { Badge, Surface, Text } from "panelui-native"
import { useScrollSections } from "panelui-native/hooks/use-scroll-sections"
import { ScrollView, StyleSheet, View } from "react-native"

const REQUIREMENTS = getLevelRequirements()
const LEVELS_PER_GROUP = 10
const MAX_LEVEL = REQUIREMENTS.length
const LEVEL_GROUPS = Array.from(
  { length: Math.ceil(MAX_LEVEL / LEVELS_PER_GROUP) },
  (_, index) => {
    const start = index * LEVELS_PER_GROUP + 1
    const end = Math.min(start + LEVELS_PER_GROUP - 1, MAX_LEVEL)

    return {
      end,
      requirements: REQUIREMENTS.slice(start - 1, end),
      start,
      value: `${start}-${end}`,
    }
  }
)
const LEVEL_SECTION_IDS = LEVEL_GROUPS.map((group) => group.value)
const LEVEL_RAIL_SECTIONS = LEVEL_GROUPS.map((group) => ({
  label: `${group.start}–${group.end}`,
  value: group.value,
}))
const HEADER_FONT_FAMILY =
  process.env.EXPO_OS === "ios" ? "Anton-Regular" : FONT_FAMILY.heading
const LEVELS_SCREEN_OPTIONS = {
  headerBackVisible: false,
  headerLargeTitleShadowVisible: false,
  headerLeft: renderLevelsBackButton,
  headerShadowVisible: false,
  headerShown: true,
  headerTransparent: true,
  scrollEdgeEffects: { top: "hidden" },
} as const
const LEVELS_TITLE_STYLE = {
  fontFamily: HEADER_FONT_FAMILY,
  fontSize: 24,
} as const
const LEVELS_LARGE_TITLE_STYLE = {
  fontFamily: HEADER_FONT_FAMILY,
  fontSize: 44,
} as const

const styles = StyleSheet.create({
  content: {
    gap: 16,
    padding: 20,
    paddingBottom: 40,
  },
  dailyNumber: { marginRight: -4, width: 20 },
  screen: { flex: 1 },
  streakNumber: { marginRight: -6, width: 24 },
  totalNumber: { marginRight: -8, width: 38 },
})

function getReachedCount(level: number, start: number, end: number) {
  return Math.max(0, Math.min(level - 1, end) - start + 1)
}

function getCurrentGroupValue(level: number) {
  const index = Math.min(
    LEVEL_GROUPS.length - 1,
    Math.floor(Math.max(0, level - 1) / LEVELS_PER_GROUP)
  )

  return LEVEL_GROUPS[index]?.value ?? LEVEL_GROUPS[0]?.value ?? ""
}

function LevelsBackButton() {
  const { t } = useI18n()
  const router = useRouter()

  return (
    <Button
      accessibilityLabel={t("levels.goBack")}
      className="h-10 w-10 rounded-full"
      onPress={router.back}
      size="icon"
      variant="ghost"
    >
      <ChevronLeftIcon strokeWidth={3} />
    </Button>
  )
}

function renderLevelsBackButton() {
  return <LevelsBackButton />
}

function RequirementText({
  emphasized,
  requirement,
}: {
  emphasized: boolean
  requirement: LevelRequirement
}) {
  const { t } = useI18n()
  const total = getCompactNumber(requirement.totalReps)
  const textClassName = cn(
    "text-[15px] text-muted-foreground",
    emphasized && "text-foreground"
  )

  return (
    <View className="flex-1 flex-row flex-wrap items-center justify-end">
      <NumericPhrase
        align="end"
        className={cn(textClassName, "text-[13px]")}
        maximumFractionDigits={2}
        style={styles.totalNumber}
        template={t("levels.total", {
          value: `${NUMERIC_TEXT_SLOT}${total.suffix}`,
        })}
        textClassName={textClassName}
        value={total.value}
      />
      {requirement.streak > 0 ? (
        <>
          <Text className={cn(textClassName, "w-4 translate-x-px text-center")}>
            ·
          </Text>
          <NumericPhrase
            align="end"
            className={cn(textClassName, "text-[13px]")}
            style={styles.streakNumber}
            template={t("levels.streak", { value: NUMERIC_TEXT_SLOT })}
            textClassName={textClassName}
            value={requirement.streak}
          />
        </>
      ) : null}
      {requirement.recentDailyAverage > 0 ? (
        <>
          <Text className={cn(textClassName, "w-4 translate-x-px text-center")}>
            ·
          </Text>
          <NumericPhrase
            align="end"
            className={cn(textClassName, "text-[13px]")}
            style={styles.dailyNumber}
            template={t("levels.daily", { value: NUMERIC_TEXT_SLOT })}
            textClassName={textClassName}
            value={requirement.recentDailyAverage}
          />
        </>
      ) : null}
    </View>
  )
}

function LevelTimelineItem({
  currentLevel,
  index,
  last,
  requirement,
}: {
  currentLevel: number
  index: number
  last: boolean
  requirement: LevelRequirement
}) {
  const { formatNumber, t } = useI18n()
  const isCompleted = requirement.level < currentLevel
  const isCurrentLevel = requirement.level === currentLevel

  return (
    <Timeline.Item completed={isCompleted} last={last} step={index}>
      <Timeline.Indicator
        className={cn("size-4 border-0", isCurrentLevel && "bg-foreground")}
      >
        {isCompleted ? <CheckIcon size={10} strokeWidth={3} /> : null}
      </Timeline.Indicator>
      <Timeline.Content className="-translate-y-1 flex-row items-center justify-between gap-3 pb-4">
        <Timeline.Title
          className={cn(
            "shrink-0 font-heading text-base text-muted-foreground",
            isCurrentLevel && "text-foreground"
          )}
        >
          {t("today.level", {
            level: formatNumber(requirement.level),
          })}
        </Timeline.Title>
        <RequirementText
          emphasized={isCurrentLevel}
          requirement={requirement}
        />
      </Timeline.Content>
    </Timeline.Item>
  )
}

function LevelGroup({
  currentLevel,
  group,
}: {
  currentLevel: number
  group: (typeof LEVEL_GROUPS)[number]
}) {
  const { formatNumber, locale, t } = useI18n()
  const reached = getReachedCount(currentLevel, group.start, group.end)
  const isCurrent =
    (currentLevel === 0 && group.start === 1) ||
    (currentLevel >= group.start && currentLevel <= group.end)
  const title = `${t("levels.levels").toLocaleLowerCase(locale)} ${formatNumber(group.start)}–${formatNumber(group.end)}`

  return (
    <Surface
      className={cn(isCurrent && "border border-primary/50")}
      elevated
      padding="none"
    >
      <Accordion.Item value={group.value}>
        <Accordion.Trigger className="px-4 py-3.5">
          <Accordion.Title className="font-heading text-xl">
            {title}
          </Accordion.Title>
          <Badge
            className="rounded-full"
            variant={
              reached === group.requirements.length
                ? "success"
                : isCurrent
                  ? "default"
                  : "secondary"
            }
          >
            {formatNumber(reached)} / {formatNumber(group.requirements.length)}
          </Badge>
          <Accordion.Indicator />
        </Accordion.Trigger>
        <Accordion.Content className="px-4 pb-1">
          <Timeline value={reached - 1} variant="icon">
            {group.requirements.map((requirement, index) => (
              <LevelTimelineItem
                currentLevel={currentLevel}
                index={index}
                key={requirement.level}
                last={index === group.requirements.length - 1}
                requirement={requirement}
              />
            ))}
          </Timeline>
        </Accordion.Content>
      </Accordion.Item>
    </Surface>
  )
}

export default function LevelsPage() {
  const { t } = useI18n()
  const { activity } = useActivity()
  const { plan } = usePlan()
  const {
    active,
    measure,
    ref: scrollRef,
    scrollProps,
    scrollTo,
  } = useScrollSections({ ids: LEVEL_SECTION_IDS })
  const { level } = getLevel({
    bestStreak: activity?.bestStreak ?? 0,
    dailyGoal: plan.targetReps,
    recentDays: activity?.recentDays ?? [],
    totalReps: activity?.totalPushups ?? 0,
  })

  return (
    <>
      <ScrollView
        ref={scrollRef}
        {...scrollProps}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        style={styles.screen}
      >
        <Accordion
          className="gap-2.5 overflow-visible"
          defaultValue={getCurrentGroupValue(level)}
          selectionMode="single"
          variant="ghost"
        >
          {LEVEL_GROUPS.map((group) => (
            <View key={group.value} onLayout={measure(group.value)}>
              <LevelGroup currentLevel={level} group={group} />
            </View>
          ))}
        </Accordion>
      </ScrollView>
      <EdgeBlur />
      <WorkoutSectionRail
        active={active}
        onValueChange={scrollTo}
        screen="levels"
        sections={LEVEL_RAIL_SECTIONS}
      />
      <Stack.Screen options={LEVELS_SCREEN_OPTIONS} />
      <Stack.Title
        large
        largeStyle={LEVELS_LARGE_TITLE_STYLE}
        style={LEVELS_TITLE_STYLE}
      >
        {t("levels.levels")}
      </Stack.Title>
    </>
  )
}
