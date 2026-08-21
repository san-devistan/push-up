import { isOnboardingComplete } from "@/features/onboarding/storage"
import {
  PreferencesProvider,
  usePreferences,
} from "@/features/preferences/_hooks/use-preferences"
import { PlanProvider } from "@/features/workout/_hooks/use-plan"
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
import * as ScreenOrientation from "expo-screen-orientation"
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

let didWarnMissingConvexUrl = false
let didWarnFontLoadError = false

function warnMissingConvexUrl() {
  if (didWarnMissingConvexUrl) {
    return
  }

  didWarnMissingConvexUrl = true
  console.warn(
    "EXPO_PUBLIC_CONVEX_URL is not set. Convex is disabled for apps/mobile; set it when this app needs the Convex backend."
  )
}

function warnFontLoadError(error: Error) {
  if (didWarnFontLoadError) {
    return
  }

  didWarnFontLoadError = true
  console.warn(
    "Mobile fonts failed to load; mobile will fall back to system fonts.",
    error
  )
}

if (!convex) {
  warnMissingConvexUrl()
}

const stackScreenOptions = { headerShown: false } as const
const homeScreenOptions = { freezeOnBlur: true } as const
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
      if (!isAuthConfigured || isPending || session || requested.current) {
        return
      }

      requested.current = true
      const { error } = await authClient.signIn.anonymous()

      if (error) {
        requested.current = false
        console.warn("Could not create the anonymous profile", error)
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
    void ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP
    )
  }, [])

  useEffect(() => {
    if (fontLoadError) {
      warnFontLoadError(fontLoadError)
    }

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
    <PanelUIProvider>
      <IconColorProvider
        color={typeof foreground === "string" ? foreground : undefined}
      >
        <OptionalConvexProvider>
          <PlanProvider>
            <ThemeProvider value={NAV_THEME[colorScheme]}>
              <RootStack />
              <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
            </ThemeProvider>
          </PlanProvider>
        </OptionalConvexProvider>
      </IconColorProvider>
    </PanelUIProvider>
  )
}

function RootStack() {
  return (
    <Stack
      initialRouteName={initialRouteName}
      screenOptions={stackScreenOptions}
    >
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" options={homeScreenOptions} />
      <Stack.Screen name="session" options={sessionScreenOptions} />
      <Stack.Screen name="levels" />
      <Stack.Screen name="settings" />
    </Stack>
  )
}
