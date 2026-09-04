import { usePro } from "@/features/billing/_hooks/use-pro"
import { Redirect, Stack } from "expo-router"

export default function HomeLayout() {
  const { isLoading, isPro } = usePro()

  if (isLoading) {
    return null
  }

  if (!isPro) {
    return <Redirect href="/paywall" />
  }

  return <Stack />
}
