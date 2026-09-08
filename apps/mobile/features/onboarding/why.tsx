import {
  BicepsFlexedIcon,
  HouseIcon,
  TimerIcon,
  type IconProps,
} from "@/components/icons"
import { Overline, Slab } from "@/features/workout/_components/figures"
import { useI18n } from "@/hooks/use-i18n"
import type { TranslationKey } from "@/lib/i18n"
import { Text } from "panelui-native"
import {
  useEffect,
  useState,
  type ComponentType,
  type ReactNode,
} from "react"
import { StyleSheet, View } from "react-native"
import {
  createAnimatedComponent,
  ReduceMotion,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated"
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg"
import { useCSSVariable } from "uniwind"

/**
 * Years of life bought back by activity at the recommended level, from the
 * pooled 650,000-adult cohort in Moore et al., PLoS Medicine 2012 (3.4-4.5
 * years). Doing nothing is the zero the other card is read against.
 */
const YEARS_GAINED = 4

/**
 * Both curves are drawn in the same box so the cards compare at a glance: one
 * drifts along the floor, the other climbs off it.
 */
const CHART = { height: 48, width: 100 } as const
const FLAT_CURVE = "M0 38 C 20 36, 34 39, 50 35 S 80 33, 100 31"
const RISING_CURVE = "M0 44 C 22 42, 32 30, 50 24 S 78 8, 100 4"
const RISING_AREA = `${RISING_CURVE} L100 ${CHART.height} L0 ${CHART.height} Z`
/** Generous enough to cover the path, so the dash can hide the whole line. */
const CURVE_LENGTH = 240
const DRAW_DURATION_MS = 900
const DRAW_DELAY_MS = 200
const VIEW_BOX = `0 0 ${CHART.width} ${CHART.height}`
const FALLBACK_COLORS = { active: "#3aa869", rest: "#888888" }

const BENEFITS = [
  { icon: BicepsFlexedIcon, key: "onboarding.benefitUpperBody" },
  { icon: TimerIcon, key: "onboarding.benefitTenMinutes" },
  { icon: HouseIcon, key: "onboarding.benefitNoGym" },
] satisfies { icon: ComponentType<IconProps>; key: TranslationKey }[]

const styles = StyleSheet.create({
  chart: { height: CHART.height, width: "100%" },
  value: { fontSize: 40, lineHeight: 46 },
})

const AnimatedPath = createAnimatedComponent(Path)

function resolveColor(token: unknown, fallback: string) {
  return typeof token === "string" ? token : fallback
}

function useDrawOffset(active: boolean) {
  const offset = useSharedValue(CURVE_LENGTH)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (!active) return
    offset.value = reducedMotion
      ? 0
      : withDelay(
          DRAW_DELAY_MS,
          withTiming(0, {
            duration: DRAW_DURATION_MS,
            reduceMotion: ReduceMotion.System,
          })
        )
  }, [active, offset, reducedMotion])

  return offset
}

function FlatCurve({ color }: { color: string }) {
  return (
    <Svg preserveAspectRatio="none" style={styles.chart} viewBox={VIEW_BOX}>
      <Path
        d={FLAT_CURVE}
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={2.5}
      />
    </Svg>
  )
}

/**
 * The rising curve draws itself in. Only the card making a claim earns the
 * motion; the flat one is already there when the step appears.
 */
function RisingCurve({ active, color }: { active: boolean; color: string }) {
  const offset = useDrawOffset(active)
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: offset.value,
  }))

  return (
    <Svg preserveAspectRatio="none" style={styles.chart} viewBox={VIEW_BOX}>
      <Defs>
        <LinearGradient id="whyCurveFill" x1="0" x2="0" y1="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0.35} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={RISING_AREA} fill="url(#whyCurveFill)" />
      <AnimatedPath
        animatedProps={animatedProps}
        d={RISING_CURVE}
        fill="none"
        stroke={color}
        strokeDasharray={CURVE_LENGTH}
        strokeLinecap="round"
        strokeWidth={2.5}
      />
    </Svg>
  )
}

function ComparisonCard({
  active,
  children,
  label,
  value,
}: {
  active: boolean
  children: ReactNode
  label: string
  value: string
}) {
  return (
    <View
      className={
        active
          ? "flex-1 flex-shrink gap-4 rounded-3xl border-2 border-primary p-4"
          : "flex-1 flex-shrink gap-4 rounded-3xl border-2 border-transparent bg-muted p-4"
      }
    >
      {children}
      <View className="gap-1">
        <Text
          adjustsFontSizeToFit
          className={
            active
              ? "font-heading text-primary"
              : "font-heading text-muted-foreground"
          }
          minimumFontScale={0.7}
          numberOfLines={1}
          style={styles.value}
        >
          {value}
        </Text>
        <Text
          adjustsFontSizeToFit
          className="text-xs text-muted-foreground"
          minimumFontScale={0.7}
          numberOfLines={2}
        >
          {label}
        </Text>
      </View>
    </View>
  )
}

export default function WhyPushUpsStep() {
  const { formatNumber, t } = useI18n()
  const [drawing, setDrawing] = useState(false)
  const primary = resolveColor(
    useCSSVariable("--color-primary"),
    FALLBACK_COLORS.active
  )
  const mutedForeground = resolveColor(
    useCSSVariable("--color-muted-foreground"),
    FALLBACK_COLORS.rest
  )
  const unit = t("onboarding.yearsShort")

  // The curve is armed a frame after mount, so it is seen arriving rather than
  // found already drawn when the step slides in.
  useEffect(() => {
    setDrawing(true)
  }, [])

  return (
    <View className="flex-1 justify-between gap-8">
      <Text className="font-heading text-4xl leading-[44px]">
        {t("onboarding.whyTitle")}
      </Text>

      <View className="gap-4">
        <Overline>{t("onboarding.yearsGained")}</Overline>
        <View className="flex-row gap-3">
          <ComparisonCard
            active={false}
            label={t("onboarding.doingNothing")}
            value={`${formatNumber(0)} ${unit}`}
          >
            <FlatCurve color={mutedForeground} />
          </ComparisonCard>
          <ComparisonCard
            active
            label={t("onboarding.oneSetADay")}
            value={`+${formatNumber(YEARS_GAINED)} ${unit}`}
          >
            <RisingCurve active={drawing} color={primary} />
          </ComparisonCard>
        </View>
        <Slab className="gap-0">
          <Text className="text-xs text-muted-foreground">
            {t("onboarding.whySource")}
          </Text>
        </Slab>
      </View>

      <View className="flex-row gap-3">
        {BENEFITS.map(({ icon: Icon, key }) => (
          <View
            className="flex-1 flex-shrink items-center gap-2 rounded-2xl bg-muted p-3"
            key={key}
          >
            <Icon size={20} />
            <Text
              adjustsFontSizeToFit
              className="text-center text-xs text-muted-foreground"
              minimumFontScale={0.7}
              numberOfLines={2}
            >
              {t(key)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}
