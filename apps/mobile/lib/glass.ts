import { THEME } from "@/lib/theme"
import type { GlassTabBarTheme } from "expo-glass-tabs"

// Shared by the tab bar and any other floating chrome, so a bar pinned over a
// screen reads at the same elevation as the tabs on the tab screens.
export const GLASS_THEME = {
  dark: {
    activeTint: THEME.dark.chart1,
    glassTint: "rgba(10, 10, 12, 0.72)",
    highlight: "rgba(255, 255, 255, 0.14)",
    inactiveTint: "rgba(255, 255, 255, 0.5)",
    solidFallback: "rgba(18, 18, 20, 0.96)",
  },
  light: {
    activeTint: THEME.light.chart5,
    glassTint: "rgba(255, 255, 255, 0.76)",
    highlight: "rgba(0, 0, 0, 0.08)",
    inactiveTint: "rgba(0, 0, 0, 0.45)",
    solidFallback: "rgba(250, 250, 250, 0.96)",
  },
} as const satisfies Record<"dark" | "light", GlassTabBarTheme>
