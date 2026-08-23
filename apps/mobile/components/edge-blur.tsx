/**
 * iOS's own `scrollEdgeEffects` blurs exactly the nav bar frame, has no height
 * API, and its geometry changed between iOS 26 and 27 — on 27 it collapses to
 * the status bar strip. Drawing the edges ourselves is the only way the extent
 * is a number we control, and the only way top and bottom match.
 */
import MaskedView from "@react-native-masked-view/masked-view"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import { useMemo } from "react"
import { StyleSheet } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useCSSVariable } from "uniwind"

type Edge = "bottom" | "top"

/** How far the effect reaches past the safe area. Tune this. */
const EDGE_BLUR_HEIGHT = 72
const BLUR_INTENSITY = 50
const TOP_FADE = ["#000", "#000", "transparent"] as const
const TOP_LOCATIONS = [0, 0.55, 1] as const
const BOTTOM_FADE = ["transparent", "#000", "#000"] as const
const BOTTOM_LOCATIONS = [0, 0.45, 1] as const

const styles = StyleSheet.create({
  bottom: { bottom: 0, left: 0, position: "absolute", right: 0 },
  fill: { flex: 1 },
  top: { left: 0, position: "absolute", right: 0, top: 0 },
})

const MASKS = {
  bottom: (
    <LinearGradient
      colors={BOTTOM_FADE}
      locations={BOTTOM_LOCATIONS}
      style={styles.fill}
    />
  ),
  top: (
    <LinearGradient
      colors={TOP_FADE}
      locations={TOP_LOCATIONS}
      style={styles.fill}
    />
  ),
}

/*
 * CAGradientLayer interpolates straight through RGBA, so fading to `transparent`
 * (black at alpha 0) drags a grey fringe across a light background. Fading to
 * the same hex at alpha 0 keeps the ramp on one colour.
 */
function useBackgroundTint(edge: Edge) {
  const value = useCSSVariable("--color-background")
  const hex = typeof value === "string" && value.length === 7 ? value : null

  return useMemo(() => {
    if (!hex) return ["transparent", "transparent"] as const
    return edge === "top"
      ? ([hex, `${hex}00`] as const)
      : ([`${hex}00`, hex] as const)
  }, [edge, hex])
}

export function EdgeBlur({
  edge = "top",
  height = EDGE_BLUR_HEIGHT,
}: {
  edge?: Edge
  height?: number
}) {
  const insets = useSafeAreaInsets()
  const tint = useBackgroundTint(edge)
  const inset = edge === "top" ? insets.top : insets.bottom
  const rootStyle = useMemo(
    () => [styles[edge], { height: inset + height }],
    [edge, height, inset]
  )

  return (
    <MaskedView
      maskElement={MASKS[edge]}
      pointerEvents="none"
      style={rootStyle}
    >
      <BlurView
        intensity={BLUR_INTENSITY}
        style={styles.fill}
        tint="systemChromeMaterial"
      />
      <LinearGradient colors={tint} style={StyleSheet.absoluteFill} />
    </MaskedView>
  )
}
