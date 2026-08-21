import { Storage } from "expo-sqlite/kv-store"

const KEY = "pushup.onboarding.complete"

export function completeOnboarding() {
  Storage.setItemSync(KEY, "1")
}

export function isOnboardingComplete() {
  return Storage.getItemSync(KEY) === "1"
}
