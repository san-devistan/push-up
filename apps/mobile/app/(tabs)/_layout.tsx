import { useColorScheme } from "@/hooks/use-color-scheme"
import { GLASS_THEME } from "@/lib/glass"
import {
  GlassTabBar,
  GlassTabButton,
  TabBarMinimizeProvider,
  renderFadingTabScreen,
  type GlassTabItem,
} from "expo-glass-tabs"
import { useRouter, type Href } from "expo-router"
import { TabList, TabSlot, TabTrigger, Tabs } from "expo-router/ui"
import { StyleSheet } from "react-native"

const ITEMS: (GlassTabItem & { href: Href })[] = [
  { href: "/", icon: "flame.fill", label: "Train", name: "index" },
  { href: "/plan", icon: "calendar", label: "Plan", name: "plan" },
]

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
  const tabTheme = GLASS_THEME[appAppearance]

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
