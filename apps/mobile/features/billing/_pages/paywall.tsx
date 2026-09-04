import { usePro } from "@/features/billing/_hooks/use-pro"
import { Redirect, Stack, useRouter } from "expo-router"
import { useEffect } from "react"
import { StyleSheet, View } from "react-native"
import RevenueCatUI from "react-native-purchases-ui"

const PAYWALL_SCREEN_OPTIONS = { gestureEnabled: false, headerShown: false }
const PAYWALL_OPTIONS = { displayCloseButton: false }
const styles = StyleSheet.create({ screen: { flex: 1 } })

/**
 * Hard paywall: the whole app sits behind the `pro` entitlement. The
 * RevenueCat paywall template owns purchase, restore and legal links; this
 * screen only reacts to the entitlement flipping and sends the user home.
 */
export default function PaywallPage() {
  const router = useRouter()
  const { isLoading, isPro } = usePro()

  useEffect(() => {
    if (!isLoading && isPro) {
      router.replace("/")
    }
  }, [isLoading, isPro, router])

  if (!isLoading && isPro) {
    return <Redirect href="/" />
  }

  return (
    <View className="bg-background" style={styles.screen}>
      <Stack.Screen options={PAYWALL_SCREEN_OPTIONS} />
      <RevenueCatUI.Paywall options={PAYWALL_OPTIONS} />
    </View>
  )
}
