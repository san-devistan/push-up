import { expoClient } from "@better-auth/expo/client"
import { convexClient } from "@convex-dev/better-auth/client/plugins"
import { anonymousClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import Constants from "expo-constants"
import * as SecureStore from "expo-secure-store"

const configuredScheme = Constants.expoConfig?.scheme
const scheme =
  (Array.isArray(configuredScheme) ? configuredScheme[0] : configuredScheme) ??
  "pushup"
export const isAuthConfigured = Boolean(process.env.EXPO_PUBLIC_CONVEX_SITE_URL)

export const authClient = createAuthClient({
  baseURL:
    process.env.EXPO_PUBLIC_CONVEX_SITE_URL ?? "https://invalid.localhost",
  plugins: [
    expoClient({
      scheme,
      storage: SecureStore,
      storagePrefix: `${scheme}-auth`,
    }),
    anonymousClient(),
    convexClient(),
  ],
})
