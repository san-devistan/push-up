import { usePro } from "@/features/billing/_hooks/use-pro"
import { isOnboardingComplete } from "@/features/onboarding/storage"
import { authClient, isAuthConfigured } from "@/lib/auth-client"
import { Redirect } from "expo-router"
import type { ReactNode } from "react"

export function ProGate({ children }: { children: ReactNode }) {
  const { isLoading, isPro } = usePro()
  const { data: session, isPending: sessionPending } = authClient.useSession()

  if (!isOnboardingComplete()) {
    return <Redirect href="/onboarding" />
  }

  if (isAuthConfigured && sessionPending) {
    return null
  }

  if (isAuthConfigured && !session) {
    return <Redirect href="/onboarding" />
  }

  if (isLoading) {
    return null
  }

  if (!isPro) {
    return <Redirect href="/paywall" />
  }

  return children
}
