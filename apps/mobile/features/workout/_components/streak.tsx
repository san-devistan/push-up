/* eslint-disable react-perf/jsx-no-new-object-as-prop -- React Compiler stabilizes the optional expanded styles. */
import { FlameIcon } from "@/components/icons"
import { NumericText } from "@/components/numeric-text"
import { useI18n } from "@/hooks/use-i18n"
import { View } from "react-native"
import { useCSSVariable } from "uniwind"

export function Streak({
  animationDuration,
  days,
  size,
}: {
  animationDuration?: number
  days: number
  size?: number
}) {
  const { formatNumber, t } = useI18n()
  const foregroundValue = useCSSVariable("--color-foreground")
  const foreground =
    typeof foregroundValue === "string" ? foregroundValue : undefined
  const large = size !== undefined
  const textStyle = large
    ? {
        fontSize: size * 0.42,
        lineHeight: size * 0.52,
        transform: [{ translateY: size * -0.03 }],
      }
    : { transform: [{ translateY: -2 }] }

  return (
    <View
      className={
        large ? "flex-row items-center justify-center" : "flex-row items-center"
      }
      style={large ? { width: size } : undefined}
    >
      <FlameIcon
        color={foreground}
        fill={foreground}
        size={large ? size * 0.36 : 24}
      />
      <NumericText
        align="end"
        accessibilityLabel={`${formatNumber(days)} ${t(days === 1 ? "common.day" : "common.days")}`}
        animationDuration={animationDuration}
        className={
          large ? "shrink pt-1 font-heading" : "pt-1 font-heading text-2xl"
        }
        direction="up"
        layoutStyle={textStyle}
        layoutText={formatNumber(days)}
        reduceMotion="system"
        style={textStyle}
        value={days}
      />
    </View>
  )
}
