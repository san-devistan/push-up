import { PanelUIProvider as LocalPanelUIProvider } from "@/components/ui/panel-ui-provider"
import { AppBlockerSync } from "@/features/app-blocker/_components/sync"
import { isOnboardingComplete } from "@/features/onboarding/storage"
import {
  PreferencesProvider,
  usePreferences,
} from "@/features/preferences/_hooks/use-preferences"
import { PlanProvider } from "@/features/workout/_hooks/use-plan"
import { RecapProvider } from "@/features/workout/_hooks/use-recap"
import { syncPendingSessions } from "@/features/workout/_lib/sync"
import globalCss from "@/global.css"
import { authClient, isAuthConfigured } from "@/lib/auth-client"
import { mobileFonts } from "@/lib/fonts"
import { configureMobileReanimatedLogger } from "@/lib/reanimated-logger"
import { NAV_THEME } from "@/lib/theme"
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react"
import { api } from "@workspace/backend/api"
import { ConvexReactClient, useMutation } from "convex/react"
import { useFonts } from "expo-font"
import * as Network from "expo-network"
import { Stack, ThemeProvider } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { StatusBar } from "expo-status-bar"
import { IconColorProvider, PanelUIProvider } from "panelui-native"
import { useEffect, useRef, type ReactNode } from "react"
import { Uniwind, useCSSVariable } from "uniwind"

void globalCss
configureMobileReanimatedLogger()
void SplashScreen.preventAutoHideAsync()

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL
const convex = convexUrl
  ? new ConvexReactClient(convexUrl, {
      expectAuth: true,
      unsavedChangesWarning: false,
    })
  : null

const stackScreenOptions = { headerShown: false } as const
const homeScreenOptions = { freezeOnBlur: true, gestureEnabled: false } as const
const onboardingScreenOptions = { gestureEnabled: false } as const
const initialRouteName = isOnboardingComplete() ? "(tabs)" : "onboarding"
const sessionScreenOptions = {
  animation: "fade",
  gestureEnabled: false,
} as const
function OptionalConvexProvider({ children }: { children: ReactNode }) {
  if (!convex) {
    return <>{children}</>
  }

  return (
    <ConvexBetterAuthProvider authClient={authClient} client={convex}>
      <AnonymousSession />
      <OutboxSync />
      {children}
    </ConvexBetterAuthProvider>
  )
}

function OutboxSync() {
  const { data: authSession } = authClient.useSession()
  const syncSession = useMutation(api.workoutSessions.sync)

  useEffect(() => {
    if (authSession) {
      void syncPendingSessions(syncSession)
    }
  }, [authSession, syncSession])

  return null
}

function AnonymousSession() {
  const { data: session, isPending } = authClient.useSession()
  const requested = useRef(false)

  useEffect(() => {
    async function requestAnonymousSession() {
      if (
        !isOnboardingComplete() ||
        !isAuthConfigured ||
        isPending ||
        session ||
        requested.current
      ) {
        return
      }

      requested.current = true
      const { error } = await authClient.signIn.anonymous()

      if (error) {
        requested.current = false
      }
    }

    void requestAnonymousSession()
    const subscription = Network.addNetworkStateListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        void requestAnonymousSession()
      }
    })

    return () => subscription.remove()
  }, [isPending, session])

  return null
}

export default function RootLayout() {
  const [fontsLoaded, fontLoadError] = useFonts(mobileFonts)

  useEffect(() => {
    if (fontsLoaded || fontLoadError) {
      void SplashScreen.hideAsync()
    }
  }, [fontLoadError, fontsLoaded])

  if (!fontsLoaded && !fontLoadError) {
    return null
  }

  return (
    <PreferencesProvider>
      <RootProviders />
    </PreferencesProvider>
  )
}

function RootProviders() {
  const { colorScheme } = usePreferences()
  const foreground = useCSSVariable("--color-foreground")

  useEffect(() => {
    Uniwind.setTheme(colorScheme)
  }, [colorScheme])

  return (
    <PanelProviders
      iconColor={typeof foreground === "string" ? foreground : undefined}
    >
      <OptionalConvexProvider>
        <PlanProvider>
          <RecapProvider>
            <AppBlockerSync />
            <ThemeProvider value={NAV_THEME[colorScheme]}>
              <RootStack />
              <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
            </ThemeProvider>
          </RecapProvider>
        </PlanProvider>
      </OptionalConvexProvider>
    </PanelProviders>
  )
}

function PanelProviders({
  children,
  iconColor,
}: {
  children: ReactNode
  iconColor?: string
}) {
  return (
    <PanelUIProvider>
      <LocalPanelUIProvider background={false}>
        <IconColorProvider color={iconColor}>{children}</IconColorProvider>
      </LocalPanelUIProvider>
    </PanelUIProvider>
  )
}

function RootStack() {
  return (
    <Stack
      initialRouteName={initialRouteName}
      screenOptions={stackScreenOptions}
    >
      <Stack.Screen name="onboarding" options={onboardingScreenOptions} />
      <Stack.Screen name="(tabs)" options={homeScreenOptions} />
      <Stack.Screen name="session" options={sessionScreenOptions} />
      <Stack.Screen name="levels" />
      <Stack.Screen name="settings" />
    </Stack>
  )
}
