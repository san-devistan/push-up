import { useColorScheme } from "@/hooks/use-color-scheme"
import { THEME } from "@/lib/theme"
import {
  GlassTabBar,
  GlassTabButton,
  TabBarMinimizeProvider,
  renderFadingTabScreen,
  type GlassTabBarTheme,
  type GlassTabItem,
} from "expo-glass-tabs"
import { useRouter, type Href } from "expo-router"
import { TabList, TabSlot, TabTrigger, Tabs } from "expo-router/ui"
import { StyleSheet } from "react-native"

const ITEMS: (GlassTabItem & { href: Href })[] = [
  { href: "/", icon: "flame.fill", label: "Train", name: "index" },
  { href: "/plan", icon: "calendar", label: "Plan", name: "plan" },
]

const TAB_THEMES = {
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

const styles = StyleSheet.create({
  slot: { height: "100%" },
})

const TRIGGERS = ITEMS.map((item, index) => (
  <TabTrigger asChild href={item.href} key={item.name} name={item.name}>
    <GlassTabButton index={index} item={item} />
  </TabTrigger>
))

function getSelectTab(navigate: (href: Href) => void) {
  return (index: number) => {
    const item = ITEMS[index]

    if (item) {
      navigate(item.href)
    }
  }
}

export default function TabsLayout() {
  const router = useRouter()
  const selectTab = getSelectTab(router.navigate)
  const appAppearance = useColorScheme()
  const tabTheme = TAB_THEMES[appAppearance === "dark" ? "dark" : "light"]

  return (
    <TabBarMinimizeProvider>
      <Tabs>
        <TabSlot renderFn={renderFadingTabScreen} style={styles.slot} />
        <TabList asChild>
          <GlassTabBar
            liquidGlass={false}
            onIndexSelected={selectTab}
            progressiveBlur={false}
            theme={tabTheme}
          >
            {TRIGGERS}
          </GlassTabBar>
        </TabList>
      </Tabs>
    </TabBarMinimizeProvider>
  )
}
