import { NumericText } from "@/components/numeric-text"
import { useI18n } from "@/hooks/use-i18n"
import { Text } from "panelui-native"
import type { ReactNode } from "react"
import { View, type StyleProp, type TextStyle } from "react-native"

const PERCENT_FORMAT = { maximumFractionDigits: 0, style: "percent" } as const
const PROGRESS_SLOT = "\uFFFC"
const TWO_DIGIT_FORMAT = { minimumIntegerDigits: 2 } as const

export type ShareMetricStyles = {
  goalDone: StyleProp<TextStyle>
  label: StyleProp<TextStyle>
  scoreNumber: StyleProp<TextStyle>
  statValue: StyleProp<TextStyle>
}

export function ShareStat({
  cardStyles,
  children,
  label,
}: {
  cardStyles: ShareMetricStyles
  children: ReactNode
  label: string
}) {
  return (
    <View className="flex-1 gap-1">
      <Text
        className="font-mono text-[10px] tracking-[1.5px] uppercase"
        style={cardStyles.label}
      >
        {label}
      </Text>
      <View className="flex-row items-center">{children}</View>
    </View>
  )
}

export function ShareDuration({
  cardStyles,
  durationMs,
}: {
  cardStyles: ShareMetricStyles
  durationMs: number
}) {
  const totalSeconds = Math.round(durationMs / 1000)

  return (
    <>
      <NumericText
        className="text-base"
        style={cardStyles.statValue}
        value={Math.floor(totalSeconds / 60)}
      />
      <Text className="font-heading text-base" style={cardStyles.statValue}>
        :
      </Text>
      <NumericText
        className="text-base"
        format={TWO_DIGIT_FORMAT}
        style={cardStyles.statValue}
        value={totalSeconds % 60}
      />
    </>
  )
}

export function ShareScore({
  cardStyles,
  percent,
  reps,
}: {
  cardStyles: ShareMetricStyles
  percent: number
  reps: number
}) {
  const { formatNumber, t } = useI18n()
  const goalDone = percent >= 100
  const progress = t("share.progress", { percent: PROGRESS_SLOT })
  const [progressBefore = "", progressAfter = ""] =
    progress.split(PROGRESS_SLOT)

  return (
    <View className="-mb-3 flex-row items-baseline justify-between">
      <View className="flex-row items-baseline gap-2">
        <NumericText
          accessibilityLabel={formatNumber(reps)}
          className="font-extrabold"
          style={cardStyles.scoreNumber}
          value={reps}
        />
        <Text
          className="font-medium font-mono text-[10px] tracking-[2px] uppercase"
          style={cardStyles.label}
        >
          {t("share.pushups")}
        </Text>
      </View>
      {goalDone ? (
        <Text
          className="text-right font-medium font-mono text-[10px] tracking-[0.75px] uppercase"
          style={cardStyles.goalDone}
        >
          {t("share.goalDone")}
        </Text>
      ) : (
        <View className="flex-row items-center justify-end">
          <Text
            className="font-medium font-mono text-[10px] tracking-[0.75px] uppercase"
            style={cardStyles.label}
          >
            {progressBefore}
          </Text>
          <NumericText
            className="text-[10px]"
            style={cardStyles.label}
            value={Math.floor(percent)}
          />
          <Text
            className="font-medium font-mono text-[10px] tracking-[0.75px] uppercase"
            style={cardStyles.label}
          >
            {progressAfter}
          </Text>
        </View>
      )}
    </View>
  )
}

export function SharePercent({
  cardStyles,
  value,
}: {
  cardStyles: ShareMetricStyles
  value: number
}) {
  return (
    <NumericText
      className="text-base"
      format={PERCENT_FORMAT}
      style={cardStyles.statValue}
      value={value}
    />
  )
}
