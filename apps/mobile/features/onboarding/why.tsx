import {
  ArmchairIcon,
  BicepsFlexedIcon,
  HouseIcon,
  TimerIcon,
  type IconProps,
} from "@/components/icons"
import { NumericText } from "@/components/numeric-text"
import { Overline, Slab } from "@/features/workout/_components/figures"
import { Progress, Text } from "panelui-native"
import { useEffect, useState, type ComponentType } from "react"
import { StyleSheet, View } from "react-native"

/**
 * Years of life bought back by activity at the recommended level, from the
 * pooled 650,000-adult cohort in Moore et al., PLoS Medicine 2012 (3.4–4.5
 * years). Doing nothing is the zero every bar is measured against, so the
 * empty track is the comparison rather than a truncated axis.
 */
const YEARS_GAINED = 4
/** The second bar starts once the first has visibly moved, not alongside it. */
const SECOND_GAUGE_DELAY_MS = 220

const BENEFITS = [
  { icon: BicepsFlexedIcon, label: "whole upper body" },
  { icon: TimerIcon, label: "10 min a day" },
  { icon: HouseIcon, label: "no gym" },
] satisfies { icon: ComponentType<IconProps>; label: string }[]

const styles = StyleSheet.create({
  readout: { fontSize: 22, lineHeight: 26 },
})

/**
 * `Progress` seeds its shared value at the target, so a bar handed its final
 * value on mount lands there without moving. Mounting empty and pushing the
 * value in an effect is what makes it fill; the spring — and reduce motion —
 * stay `Progress`'s business.
 */
function useRevealedValue(value: number, delay: number) {
  const [revealed, setRevealed] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(value), delay)
    return () => clearTimeout(timer)
  }, [delay, value])

  return revealed
}

function Gauge({
  delay = 0,
  icon: Icon,
  label,
  value,
}: {
  delay?: number
  icon: ComponentType<IconProps>
  label: string
  value: number
}) {
  const revealed = useRevealedValue(value, delay)

  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-2">
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
        {value > 0 ? (
          <Text className="font-heading text-foreground" style={styles.readout}>
            +
          </Text>
        ) : null}
        <NumericText
          className="text-foreground"
          style={styles.readout}
          value={revealed}
        />
        <Text className="font-mono text-xs text-muted-foreground">yrs</Text>
      </View>
      <Progress maxValue={YEARS_GAINED} size="lg" value={revealed} />
    </View>
  )
}

export default function WhyPushUpsStep() {
  return (
    <View className="flex-1 justify-between gap-8">
      <Text className="font-heading text-4xl leading-[44px]">
        {"Push-ups are enough."}
      </Text>

      <Slab className="gap-5">
        <Overline>years of life gained</Overline>
        <Gauge icon={ArmchairIcon} label="doing nothing" value={0} />
        <Gauge
          delay={SECOND_GAUGE_DELAY_MS}
          icon={BicepsFlexedIcon}
          label="one set a day"
          value={YEARS_GAINED}
        />
        <Text className="text-xs text-muted-foreground">
          {"Pooled study of 650,000 adults, PLoS Medicine."}
        </Text>
      </Slab>

      <View className="flex-row gap-3">
        {BENEFITS.map(({ icon: Icon, label }) => (
          <View
            className="flex-1 flex-shrink items-center gap-2 rounded-2xl bg-muted p-3"
            key={label}
          >
            <Icon size={20} />
            <Text
              adjustsFontSizeToFit
              className="text-center text-xs text-muted-foreground"
              minimumFontScale={0.7}
              numberOfLines={2}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}
