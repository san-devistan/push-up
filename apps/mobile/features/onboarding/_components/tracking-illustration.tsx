import { StyleSheet, View } from "react-native"
import Svg, { Circle, G, Line, Path, Rect } from "react-native-svg"
import { useCSSVariable } from "uniwind"

const styles = StyleSheet.create({
  illustration: { transform: [{ translateY: -32 }] },
})

export default function TrackingIllustration() {
  const backgroundValue = useCSSVariable("--color-background")
  const foregroundValue = useCSSVariable("--color-foreground")
  const mutedValue = useCSSVariable("--color-muted-foreground")
  const primaryValue = useCSSVariable("--color-primary")
  const background =
    typeof backgroundValue === "string" ? backgroundValue : "#ffffff"
  const foreground =
    typeof foregroundValue === "string" ? foregroundValue : "#18181b"
  const muted = typeof mutedValue === "string" ? mutedValue : "#71717a"
  const primary = typeof primaryValue === "string" ? primaryValue : "#22c55e"

  return (
    <View
      className="flex-1 items-center justify-center"
      style={styles.illustration}
    >
      <Svg
        accessibilityLabel="A phone tracking a push-up"
        accessible
        height={260}
        viewBox="0 0 320 240"
        width="100%"
      >
        <Line
          opacity={0.35}
          stroke={muted}
          strokeLinecap="round"
          strokeWidth={4}
          x1={28}
          x2={292}
          y1={202}
          y2={202}
        />
        <G transform="translate(18 0)">
          <Circle cx={241} cy={195} fill={primary} opacity={0.06} r={40} />
          <Circle cx={241} cy={195} fill={primary} opacity={0.1} r={27} />
          <Circle cx={241} cy={195} fill={primary} opacity={0.16} r={15} />
          <Path
            d="M34 193 L90 145 Q130 123 170 132"
            fill="none"
            stroke={foreground}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={18}
          />
          <Path
            d="M166 134 L160 158 L174 194"
            fill="none"
            stroke={foreground}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={16}
          />
          <Circle cx={197} cy={122} fill={foreground} r={13} />
          <Rect
            fill={foreground}
            height={14}
            rx={6}
            width={54}
            x={198}
            y={188}
          />
          <Rect
            fill={background}
            height={8}
            rx={3}
            width={46}
            x={202}
            y={191}
          />
          <Circle cx={241} cy={195} fill={primary} r={4} />
        </G>
      </Svg>
    </View>
  )
}
