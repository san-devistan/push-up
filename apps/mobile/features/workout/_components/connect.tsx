import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { Slab } from "@/features/workout/_components/figures"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { authClient } from "@/lib/auth-client"
import * as AppleAuthentication from "expo-apple-authentication"
import * as Crypto from "expo-crypto"
import { useEffect, useState, type Dispatch, type SetStateAction } from "react"
import { StyleSheet, View } from "react-native"
import Svg, { Path } from "react-native-svg"

const MARK_SIZE = 18
const styles = StyleSheet.create({
  appleDark: {
    backgroundColor: "#ffffff",
    borderCurve: "continuous",
    borderRadius: 14,
    height: 52,
  },
  appleLight: {
    backgroundColor: "#09090b",
    borderCurve: "continuous",
    borderRadius: 14,
    height: 52,
  },
  appleLabelDark: { color: "#09090b" },
  appleLabelLight: { color: "#ffffff" },
  provider: { borderCurve: "continuous", borderRadius: 14, height: 52 },
})

function AppleMark({ color }: { color: string }) {
  return (
    <Svg height={MARK_SIZE} viewBox="0 0 24 24" width={MARK_SIZE}>
      <Path
        d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z"
        fill={color}
      />
    </Svg>
  )
}

function GoogleMark() {
  return (
    <Svg height={MARK_SIZE} viewBox="0 0 24 24" width={MARK_SIZE}>
      <Path
        d="M23.06 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h6.19a5.29 5.29 0 0 1-2.3 3.47v2.88h3.72c2.17-2 3.45-4.95 3.45-8.36z"
        fill="#4285F4"
      />
      <Path
        d="M12 23.5c3.11 0 5.72-1.03 7.62-2.79l-3.72-2.88c-1.03.69-2.35 1.1-3.9 1.1-3 0-5.54-2.03-6.45-4.75H1.71v2.98A11.5 11.5 0 0 0 12 23.5z"
        fill="#34A853"
      />
      <Path
        d="M5.55 14.18a6.9 6.9 0 0 1 0-4.36V6.84H1.71a11.5 11.5 0 0 0 0 10.32l3.84-2.98z"
        fill="#FBBC05"
      />
      <Path
        d="M12 4.75c1.69 0 3.21.58 4.4 1.72l3.3-3.3C17.71 1.26 15.1.25 12 .25A11.5 11.5 0 0 0 1.71 6.84l3.84 2.98C6.46 7.1 9 4.75 12 4.75z"
        fill="#EA4335"
      />
    </Svg>
  )
}

function errorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : null
}

async function connectApple() {
  try {
    const nonce = Crypto.randomUUID()
    const credential = await AppleAuthentication.signInAsync({
      nonce,
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    })

    if (!credential.identityToken) {
      return "Apple did not return an identity token"
    }

    const { error } = await authClient.signIn.social({
      idToken: {
        nonce,
        token: credential.identityToken,
        user: {
          email: credential.email ?? undefined,
          name: credential.fullName
            ? {
                firstName: credential.fullName.givenName ?? undefined,
                lastName: credential.fullName.familyName ?? undefined,
              }
            : undefined,
        },
      },
      provider: "apple",
    })

    return error?.message ?? null
  } catch (caught) {
    return errorCode(caught) === "ERR_REQUEST_CANCELED"
      ? null
      : "Apple sign-in is unavailable. Check the server credentials."
  }
}

async function connectGoogle() {
  try {
    const { error } = await authClient.signIn.social({
      callbackURL: "pushup://",
      provider: "google",
    })

    return error?.message ?? null
  } catch {
    return "Google sign-in is unavailable. Check the server credentials."
  }
}

function getConnectAction(
  setError: Dispatch<SetStateAction<string | null>>,
  connect: () => Promise<string | null>
) {
  return () => {
    setError(null)
    void connect().then(setError)
  }
}

export function Connect() {
  const { data: authSession } = authClient.useSession()
  const isDark = useColorScheme() === "dark"
  const [appleAvailable, setAppleAvailable] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void AppleAuthentication.isAvailableAsync().then(setAppleAvailable)
  }, [])

  const withApple = getConnectAction(setError, connectApple)
  const withGoogle = getConnectAction(setError, connectGoogle)

  if (!authSession?.user.isAnonymous) {
    return null
  }

  return (
    <Slab>
      <Text className="font-heading text-base font-semibold">
        Connect & Sync
      </Text>
      <View className="gap-3">
        {appleAvailable ? (
          <Button
            onPress={withApple}
            style={isDark ? styles.appleDark : styles.appleLight}
          >
            <AppleMark color={isDark ? "#09090b" : "#ffffff"} />
            <Text
              className="font-semibold"
              style={isDark ? styles.appleLabelDark : styles.appleLabelLight}
            >
              Apple
            </Text>
          </Button>
        ) : null}
        <Button onPress={withGoogle} style={styles.provider} variant="outline">
          <GoogleMark />
          <Text className="font-semibold">Google</Text>
        </Button>
      </View>
      {error ? (
        <Text selectable className="text-destructive">
          {error}
        </Text>
      ) : null}
    </Slab>
  )
}
