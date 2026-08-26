import { Text } from "panelui-native"
import { Fragment } from "react"
import { View, type StyleProp, type TextStyle } from "react-native"

export type ShareMetricStyles = {
  label: StyleProp<TextStyle>
  scoreNumber: StyleProp<TextStyle>
  statValue: StyleProp<TextStyle>
}

export function ShareStat({
  cardStyles,
  compactUnits = false,
  label,
  unit,
  value,
}: {
  cardStyles: ShareMetricStyles
  compactUnits?: boolean
  label: string
  unit?: string
  value: string
}) {
  return (
    <View className="min-w-0 flex-1 items-center gap-0.5">
      <Text
        className="text-center font-mono text-[10px]"
        style={cardStyles.label}
      >
        {label}
      </Text>
      <Text className="font-heading text-lg" style={cardStyles.statValue}>
        {compactUnits
          ? value.split(" ").map((part, index) => (
              <Fragment key={part.slice(-1)}>
                {index === 0 ? null : " "}
                {part.slice(0, -1)}
                <Text className="font-heading text-xs" style={cardStyles.label}>
                  {` ${part.slice(-1)}`}
                </Text>
              </Fragment>
            ))
          : value}
        {unit ? (
          <Text className="font-heading text-xs" style={cardStyles.label}>
            {` ${unit}`}
          </Text>
        ) : null}
      </Text>
    </View>
  )
}
