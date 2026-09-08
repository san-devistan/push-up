import {
  SmartphoneIcon,
  TimerIcon,
  type IconProps,
} from "@/components/icons"
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

/** The goal's share of the scrolling, kept readable under one percent. */
function formatShare(share: number) {
  return `${share < 1 ? share.toFixed(1) : Math.round(share)}%`
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
  icon: Icon,
  label,
  minutes,
}: {
  icon: ComponentType<IconProps>
  label: string
  minutes: number
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
        {`${Math.round(minutes)} min`}
      </Text>
    </View>
  )
}

export default function ScreenTimeStep() {
  const { t } = useI18n()
  const { plan } = usePlan()
  const [scrollHours, setScrollHours] = useState(DEFAULT_SCROLL_HOURS)
  const scrollMinutes = scrollHours * MINUTES_PER_HOUR
  const goalMinutes = (plan.targetReps * SECONDS_PER_REP) / SECONDS_PER_MINUTE
  const repsPerYear = plan.targetReps * DAYS_PER_YEAR
  const share = (goalMinutes / scrollMinutes) * 100
  const changeHours = getChangeHours(scrollHours, setScrollHours)

  return (
    <View className="flex-1 gap-8">
      <View className="gap-3">
        <Text className="font-heading text-4xl leading-[44px]">
          {"One minute a day."}
        </Text>
        <Text className="text-lg text-muted-foreground">
          {"You already spend more than that scrolling."}
        </Text>
      </View>

      <View className="flex-1 items-center justify-center gap-2">
        <NumericText
          className="text-foreground"
          style={styles.hero}
          value={repsPerYear}
        />
        <Text className="font-mono text-xs tracking-[3px] text-muted-foreground uppercase">
          push-ups a year
        </Text>
      </View>

      <Slab className="gap-4">
        <StatRow
          icon={SmartphoneIcon}
          label="on your phone"
          minutes={scrollMinutes}
        />
        <StatRow
          icon={TimerIcon}
          label={`your ${plan.targetReps} push-ups`}
          minutes={goalMinutes}
        />
        <Text className="text-xs text-muted-foreground">
          {`Your goal costs ${formatShare(share)} of your screen time.`}
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
