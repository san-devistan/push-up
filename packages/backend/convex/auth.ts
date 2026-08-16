import { expo } from "@better-auth/expo"
import { createClient, type GenericCtx } from "@convex-dev/better-auth"
import { convex } from "@convex-dev/better-auth/plugins"
import { requireRunMutationCtx } from "@convex-dev/better-auth/utils"
import { betterAuth, type BetterAuthOptions } from "better-auth/minimal"
import { anonymous } from "better-auth/plugins/anonymous"
import type { DataModelFromSchemaDefinition } from "convex/server"
import { importPKCS8, SignJWT } from "jose"

import { components, internal } from "./_generated/api"
import authConfig from "./auth.config"
import type schema from "./schema"

declare const process: { env: Record<string, string | undefined> }
type DataModel = DataModelFromSchemaDefinition<typeof schema>

export const authComponent = createClient<DataModel>(components.betterAuth)

async function createAppleClientSecret() {
  const clientId = process.env.APPLE_CLIENT_ID
  const keyId = process.env.APPLE_KEY_ID
  const privateKey = process.env.APPLE_PRIVATE_KEY?.replaceAll("\\n", "\n")
  const teamId = process.env.APPLE_TEAM_ID

  if (!(clientId && keyId && privateKey && teamId)) {
    throw new Error("Apple authentication is not configured")
  }

  const now = Math.floor(Date.now() / 1000)
  const key = await importPKCS8(privateKey, "ES256")

  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setSubject(clientId)
    .setAudience("https://appleid.apple.com")
    .setIssuedAt(now)
    .setExpirationTime(now + 180 * 24 * 60 * 60)
    .sign(key)
}

function appleProvider() {
  const appBundleIdentifier = process.env.APPLE_APP_BUNDLE_IDENTIFIER
  const clientId = process.env.APPLE_CLIENT_ID

  if (!(appBundleIdentifier && clientId)) {
    return {}
  }

  return {
    apple: async () => ({
      appBundleIdentifier,
      clientId,
      clientSecret: await createAppleClientSecret(),
    }),
  }
}

function googleProvider() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!(clientId && clientSecret)) {
    return {}
  }

  return { google: { clientId, clientSecret } }
}

export const createAuthOptions = (ctx: GenericCtx<DataModel>) =>
  ({
    account: {
      accountLinking: {
        enabled: true,
      },
    },
    database: authComponent.adapter(ctx),
    rateLimit: {
      storage: "database",
    },
    socialProviders: { ...appleProvider(), ...googleProvider() },
    trustedOrigins: [
      "pushup://",
      "https://accounts.google.com",
      "https://appleid.apple.com",
    ],
    plugins: [
      expo(),
      anonymous({
        onLinkAccount: async ({ anonymousUser, newUser }) => {
          await requireRunMutationCtx(ctx).runMutation(
            internal.workoutSessions.transferOwner,
            {
              fromOwnerId: anonymousUser.user.id,
              toOwnerId: newUser.user.id,
            }
          )
        },
      }),
      convex({ authConfig }),
    ],
  }) satisfies BetterAuthOptions

export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth(createAuthOptions(ctx))
