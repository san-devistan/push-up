import { SmartphoneIcon, TimerIcon, type IconProps } from "@/components/icons"
import { NumericText } from "@/components/numeric-text"
import { Slab } from "@/features/workout/_components/figures"
import { usePlan } from "@/features/workout/_hooks/use-plan"
import { useI18n } from "@/hooks/use-i18n"
import { selectionTick } from "@/lib/haptics"
import { Slider, Text } from "panelui-native"
import {
  useState,
  type ComponentType,
  type Dispatch,
  type SetStateAction,
} from "react"
import { StyleSheet, View } from "react-native"

/**
 * A rep at a steady tempo — down, up, no rest — is roughly three seconds, so a
 * minute of scrolling traded away is roughly twenty push-ups. Every number on
 * this screen comes out of that one constant and the goal the user just set,
 * which is what keeps the pitch honest: it is their goal, priced in scrolling.
 */
const SECONDS_PER_REP = 3
const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60
const DAYS_PER_YEAR = 365
/** Roughly the global daily average on a phone, and a sane place to start. */
const DEFAULT_SCROLL_HOURS = 3
const MIN_SCROLL_HOURS = 0.5
const MAX_SCROLL_HOURS = 10
const SCROLL_HOURS_STEP = 0.5

const styles = StyleSheet.create({
  hero: { fontSize: 84, lineHeight: 92 },
})

function formatHours(hours: number) {
  const whole = Math.floor(hours)
  return hours === whole ? `${whole}h` : `${whole}h30`
}

function getChangeHours(
  current: number,
  setScrollHours: Dispatch<SetStateAction<number>>
) {
  return (hours: number) => {
    if (hours === current) return
    selectionTick()
    setScrollHours(hours)
  }
}

function StatRow({
  duration,
  icon: Icon,
  label,
}: {
  duration: string
  icon: ComponentType<IconProps>
  label: string
}) {
  return (
    <View className="flex-row items-center gap-3">
      <Icon size={18} />
      <View className="flex-1 flex-shrink">
        <Text
          adjustsFontSizeToFit
          className="text-sm"
          minimumFontScale={0.7}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
      <Text className="font-heading text-lg text-foreground tabular-nums">
        {duration}
      </Text>
    </View>
  )
}

export default function ScreenTimeStep() {
  const { formatNumber, t } = useI18n()
  const { plan } = usePlan()
  const [scrollHours, setScrollHours] = useState(DEFAULT_SCROLL_HOURS)
  const scrollMinutes = scrollHours * MINUTES_PER_HOUR
  // A small goal rounds to nothing; "0 min" would read as free rather than cheap.
  const goalMinutes = Math.max(
    1,
    Math.round((plan.targetReps * SECONDS_PER_REP) / SECONDS_PER_MINUTE)
  )
  const repsPerYear = plan.targetReps * DAYS_PER_YEAR
  // Intl owns the decimal mark and the space before the sign: "0.6%" in
  // English is "0,6 %" in French, and hand-built strings get that wrong.
  const share = goalMinutes / scrollMinutes
  const formattedShare = formatNumber(share, {
    maximumFractionDigits: share < 0.01 ? 1 : 0,
    style: "percent",
  })
  const changeHours = getChangeHours(scrollHours, setScrollHours)

  return (
    <View className="flex-1 gap-8">
      <View className="gap-3">
        <Text className="font-heading text-4xl leading-[44px]">
          {t("onboarding.screenTimeTitle")}
        </Text>
        <Text className="text-lg text-muted-foreground">
          {t("onboarding.screenTimeBody")}
        </Text>
      </View>

      <View className="flex-1 items-center justify-center gap-2">
        <NumericText
          className="text-foreground"
          style={styles.hero}
          value={repsPerYear}
        />
        <Text className="font-mono text-xs tracking-[3px] text-muted-foreground uppercase">
          {t("onboarding.pushUpsPerYear")}
        </Text>
      </View>

      <Slab className="gap-4">
        <StatRow
          duration={t("onboarding.minutesShort", {
            minutes: Math.round(scrollMinutes),
          })}
          icon={SmartphoneIcon}
          label={t("onboarding.onYourPhone")}
        />
        <StatRow
          duration={t("onboarding.minutesShort", { minutes: goalMinutes })}
          icon={TimerIcon}
          label={t("onboarding.yourGoalReps", { reps: plan.targetReps })}
        />
        <Text className="text-xs text-muted-foreground">
          {t("onboarding.goalCost", { share: formattedShare })}
        </Text>
      </Slab>

      <Slider
        formatValue={formatHours}
        label={t("accessibility.dailyScreenTime")}
        max={MAX_SCROLL_HOURS}
        min={MIN_SCROLL_HOURS}
        onValueChange={changeHours}
        showValue
        step={SCROLL_HOURS_STEP}
        value={scrollHours}
      />
    </View>
  )
}
