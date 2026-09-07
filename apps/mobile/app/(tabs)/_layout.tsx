import { usePro } from "@/features/billing/_hooks/use-pro"
import { isOnboardingComplete } from "@/features/onboarding/storage"
import { Redirect, Stack } from "expo-router"

export default function HomeLayout() {
  const { isLoading, isPro } = usePro()

  // Expo Router resolves a cold launch to "/", so the root Stack's
  // initialRouteName only anchors onboarding beneath the tabs. Redirecting
  // here is what actually puts a new user on the onboarding first.
  if (!isOnboardingComplete()) {
    return <Redirect href="/onboarding" />
  }

  if (isLoading) {
    return null
  }

  if (!isPro) {
    return <Redirect href="/paywall" />
  }

  return <Stack />
}
