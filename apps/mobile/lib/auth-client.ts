import { expoClient } from "@better-auth/expo/client"
import { convexClient } from "@convex-dev/better-auth/client/plugins"
import { anonymousClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import Constants from "expo-constants"
import * as SecureStore from "expo-secure-store"

const configuredScheme = Constants.expoConfig?.scheme
const scheme =
  (Array.isArray(configuredScheme) ? configuredScheme[0] : configuredScheme) ??
  "pumpr"
const isDemo = process.env.EXPO_PUBLIC_DEMO_DATA === "1"

/**
 * Demo builds (UI review, store screenshots) never touch the backend: no
 * anonymous sign-in, and the session lives in memory because the keychain
 * needs signing entitlements that simulator-only builds do not carry.
 */
export const isAuthConfigured =
  !isDemo && Boolean(process.env.EXPO_PUBLIC_CONVEX_SITE_URL)

const memoryStorage = new Map<string, string>()
const sessionStorage = isDemo
  ? {
      getItem: (key: string) => memoryStorage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memoryStorage.set(key, value)
      },
    }
  : SecureStore

export const authClient = createAuthClient({
  baseURL:
    process.env.EXPO_PUBLIC_CONVEX_SITE_URL ?? "https://invalid.localhost",
  plugins: [
    expoClient({
      scheme,
      storage: sessionStorage,
      storagePrefix: `${scheme}-auth`,
    }),
    anonymousClient(),
    convexClient(),
  ],
})
