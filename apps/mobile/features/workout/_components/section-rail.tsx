import {
  getStartButtonBottom,
  START_BUTTON_HEIGHT,
} from "@/features/workout/_lib/floating-controls"
import { useI18n } from "@/hooks/use-i18n"
import { hapticFeedback, selectionTick } from "@/lib/haptics"
import { SectionRail } from "panelui-native"
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const START_BUTTON_GAP = 8

const styles = StyleSheet.create({
  overlay: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 11,
  },
})

const SECTIONS = {
  home: [
    { label: "today.totalPushups", value: "overview" },
    { label: "plan.dailyGoal", value: "goal" },
    { label: "today.activity", value: "activity" },
    { label: "common.stats", value: "stats" },
  ],
  settings: [
    { label: "plan.trainingSettings", value: "training" },
    { label: "plan.preferences", value: "preferences" },
    { label: "connect.account", value: "sync" },
  ],
} as const

type RailSection = { label: string; value: string }

function getOverlayStyle(bottom: number): StyleProp<ViewStyle> {
  return [styles.overlay, { bottom }]
}

function getValueChange(onValueChange: (value: string) => void) {
  return (value: string) => {
    selectionTick()
    onValueChange(value)
  }
}

function hapticOnOpen(open: boolean) {
  if (open) hapticFeedback("open")
}

export default function WorkoutSectionRail({
  active,
  onValueChange,
  screen,
  sections,
}: {
  active: string | undefined
  onValueChange: (value: string) => void
  screen: keyof typeof SECTIONS | "levels"
  sections?: readonly RailSection[]
}) {
  const { t } = useI18n()
  const insets = useSafeAreaInsets()
  const translatedSections =
    screen === "levels"
      ? []
      : SECTIONS[screen].map((section) => ({
          label: t(section.label),
          value: section.value,
        }))
  const railSections = sections ?? translatedSections
  const change = getValueChange(onValueChange)
  const bottom =
    screen === "home"
      ? getStartButtonBottom(insets.bottom) +
        START_BUTTON_HEIGHT +
        START_BUTTON_GAP -
        insets.bottom
      : 0

  return (
    <View pointerEvents="box-none" style={getOverlayStyle(bottom)}>
      <SectionRail
        align="bottom"
        onOpenChange={hapticOnOpen}
        onValueChange={change}
        placement="right"
        value={active}
      >
        <SectionRail.Trigger>
          {railSections.map((section) => (
            <SectionRail.Bar key={section.value} value={section.value} />
          ))}
        </SectionRail.Trigger>
        <SectionRail.Content>
          {railSections.map((section) => (
            <SectionRail.Item key={section.value} value={section.value}>
              {section.label}
            </SectionRail.Item>
          ))}
        </SectionRail.Content>
      </SectionRail>
    </View>
  )
}
