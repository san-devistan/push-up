/* eslint-disable react-perf/jsx-no-new-array-as-prop, react-perf/jsx-no-new-object-as-prop -- React Compiler stabilizes viewport-derived reflection styles. */
import { NumericText } from "@/components/numeric-text"
import { useI18n } from "@/hooks/use-i18n"
import MaskedView from "@react-native-masked-view/masked-view"
import { Text } from "panelui-native"
import { StyleSheet, View, useWindowDimensions } from "react-native"

const styles = StyleSheet.create({
  count: { alignItems: "center" },
  goal: { fontSize: 18, letterSpacing: 1.2 },
  reflection: {
    left: -32,
    overflow: "hidden",
    position: "absolute",
    right: -32,
  },
  reflectionContent: {
    alignItems: "center",
    filter: [{ blur: 7 }],
    opacity: 0.2,
    transform: [{ scaleY: -1 }],
  },
  reflectionMask: {
    flex: 1,
    experimental_backgroundImage:
      "linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.24) 56%, transparent 100%)",
  },
  root: {
    alignItems: "center",
    bottom: 180,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 120,
  },
})

const REFLECTION_MASK = <View style={styles.reflectionMask} />

export function ActiveScore({
  count,
  target,
}: {
  count: number
  target: number
}) {
  const { formatNumber, t } = useI18n()
  const { width } = useWindowDimensions()
  const lineHeight = Math.min(232, width * 0.53)
  const countStyle = { fontSize: Math.min(220, width * 0.5), lineHeight }

  return (
    <View style={styles.root}>
      <Text className="text-muted-foreground" style={styles.goal}>
        {t("session.goal")} {target}
      </Text>
      <View style={styles.count}>
        <NumericText
          className="text-foreground"
          style={countStyle}
          value={count}
        />
        <MaskedView
          maskElement={REFLECTION_MASK}
          pointerEvents="none"
          style={[
            styles.reflection,
            { height: lineHeight * 0.73, top: lineHeight - 24 },
          ]}
        >
          <View style={[styles.reflectionContent, { height: lineHeight }]}>
            <Text
              accessibilityElementsHidden
              className="font-heading text-foreground"
              importantForAccessibility="no-hide-descendants"
              style={countStyle}
            >
              {formatNumber(count)}
            </Text>
          </View>
        </MaskedView>
      </View>
    </View>
  )
}
