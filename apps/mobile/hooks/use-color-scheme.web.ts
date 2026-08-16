import { useSyncExternalStore } from "react"
import { Appearance } from "react-native"

type AppColorScheme = "light" | "dark"

export function useColorScheme() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

function subscribe(onStoreChange: () => void) {
  const subscription = Appearance.addChangeListener(onStoreChange)

  return () => subscription.remove()
}

function getSnapshot(): AppColorScheme {
  return Appearance.getColorScheme() === "dark" ? "dark" : "light"
}

function getServerSnapshot(): AppColorScheme {
  return "light"
}
