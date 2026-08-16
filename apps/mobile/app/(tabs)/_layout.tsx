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
  { href: "/", icon: "flame.fill", label: "Today", name: "index" },
  { href: "/stats", icon: "chart.bar.fill", label: "Stats", name: "stats" },
  { href: "/plan", icon: "calendar", label: "Plan", name: "plan" },
]

const TAB_THEME: GlassTabBarTheme = {
  activeTint: THEME.dark.chart1,
  glassTint: "rgba(10, 10, 12, 0.55)",
  highlight: "rgba(255, 255, 255, 0.14)",
  inactiveTint: "rgba(255, 255, 255, 0.5)",
  solidFallback: "rgba(18, 18, 20, 0.94)",
}

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

  return (
    <TabBarMinimizeProvider>
      <Tabs>
        <TabSlot renderFn={renderFadingTabScreen} style={styles.slot} />
        <TabList asChild>
          <GlassTabBar onIndexSelected={selectTab} theme={TAB_THEME}>
            {TRIGGERS}
          </GlassTabBar>
        </TabList>
      </Tabs>
    </TabBarMinimizeProvider>
  )
}
