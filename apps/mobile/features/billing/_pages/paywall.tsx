import { Button } from "@/components/ui/button"
import {
  GoalHero,
  LockedPlan,
  Reassurance,
} from "@/features/billing/_components/pitch"
import { Plans } from "@/features/billing/_components/plans"
import {
  purchase,
  restore,
  useOfferings,
} from "@/features/billing/_hooks/use-offerings"
import { usePro } from "@/features/billing/_hooks/use-pro"
import { billingLine, type PlanId } from "@/features/billing/_lib/plans"
import { usePlan } from "@/features/workout/_hooks/use-plan"
import { useI18n } from "@/hooks/use-i18n"
import { LinearGradient } from "expo-linear-gradient"
import { Redirect, Stack, useRouter } from "expo-router"
import { Text } from "panelui-native"
import { useEffect, useState, type Dispatch, type SetStateAction } from "react"
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native"
import type { PurchasesPackage } from "react-native-purchases"
import { SafeAreaView } from "react-native-safe-area-context"
import { useCSSVariable } from "uniwind"

const PAYWALL_SCREEN_OPTIONS = { gestureEnabled: false, headerShown: false }
const TERMS_URL = "https://pumpr-web-sandy.vercel.app/terms"
const PRIVACY_URL = "https://pumpr-web-sandy.vercel.app/privacy"
const GRADIENT_START = { x: 0.5, y: 0 }
const GRADIENT_END = { x: 0.5, y: 1 }
const SAFE_AREA_EDGES = ["top", "bottom"] as const
const styles = StyleSheet.create({
  gradient: {
    bottom: 0,
    left: 0,
    opacity: 0.25,
    position: "absolute",
    right: 0,
    top: 0,
  },
  screen: { flex: 1 },
  scroll: { gap: 20, paddingBottom: 32, paddingHorizontal: 20 },
})

type Notice = Dispatch<SetStateAction<string | null>>
type Busy = Dispatch<SetStateAction<boolean>>

function openTerms() {
  void Linking.openURL(TERMS_URL)
}

function openPrivacy() {
  void Linking.openURL(PRIVACY_URL)
}

function getUnlockAction(
  selectedPackage: PurchasesPackage | null,
  setBusy: Busy,
  setNotice: Notice
) {
  return () => {
    if (!selectedPackage) return
    setBusy(true)
    setNotice(null)
    void purchase(selectedPackage)
      .then((outcome) => {
        if (outcome === "failed") {
          setNotice("The purchase could not be completed. Try again.")
        }

        return outcome
      })
      .finally(() => setBusy(false))
  }
}

function getRestoreAction(setBusy: Busy, setNotice: Notice) {
  return () => {
    setBusy(true)
    setNotice(null)
    void restore()
      .then((restored) => {
        if (!restored) {
          setNotice("No active subscription found for this Apple ID.")
        }

        return restored
      })
      .finally(() => setBusy(false))
  }
}

function FooterLinks({ onRestore }: { onRestore: () => void }) {
  return (
    <View className="flex-row flex-wrap items-center justify-center gap-x-5 gap-y-1">
      <Pressable onPress={openTerms}>
        <Text className="text-xs text-muted-foreground">Terms of Use</Text>
      </Pressable>
      <Pressable onPress={openPrivacy}>
        <Text className="text-xs text-muted-foreground">Privacy Policy</Text>
      </Pressable>
      <Pressable onPress={onRestore}>
        <Text className="text-xs text-muted-foreground">Restore purchase</Text>
      </Pressable>
    </View>
  )
}

/**
 * Hard paywall: the whole app sits behind the `pro` entitlement. The screen
 * sells the plan the user just configured in onboarding; a successful
 * purchase or restore flips the entitlement and sends them home.
 */
export default function PaywallPage() {
  const router = useRouter()
  const { locale } = useI18n()
  const { isLoading, isPro } = usePro()
  const { plan } = usePlan()
  const offerings = useOfferings()
  const [selected, setSelected] = useState<PlanId>("annual")
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const background = useCSSVariable("--color-background")
  const primary = useCSSVariable("--color-primary")
  const gradient = [
    typeof primary === "string" ? primary : "#2f9e5a",
    typeof background === "string" ? background : "#ffffff",
  ] as const

  useEffect(() => {
    if (!isLoading && isPro) router.replace("/")
  }, [isLoading, isPro, router])

  if (!isLoading && isPro) {
    return <Redirect href="/" />
  }

  const selectedPackage = offerings.plans[selected]
  const unlock = getUnlockAction(selectedPackage, setBusy, setNotice)
  const restorePurchase = getRestoreAction(setBusy, setNotice)
  const noPlans = !(offerings.plans.annual || offerings.plans.monthly)

  return (
    <View className="bg-background" style={styles.screen}>
      <Stack.Screen options={PAYWALL_SCREEN_OPTIONS} />
      <LinearGradient
        colors={gradient}
        end={GRADIENT_END}
        start={GRADIENT_START}
        style={styles.gradient}
      />
      <SafeAreaView edges={SAFE_AREA_EDGES} style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          contentInsetAdjustmentBehavior="automatic"
        >
          <GoalHero targetReps={plan.targetReps} />
          <LockedPlan />
          <Reassurance />
          {offerings.loading ? (
            <View className="items-center py-6">
              <ActivityIndicator />
            </View>
          ) : offerings.error || noPlans ? (
            <Text className="text-center text-sm text-destructive">
              Plans could not be loaded. Check your connection and try again.
            </Text>
          ) : (
            <>
              <Plans
                locale={locale}
                onSelect={setSelected}
                plans={offerings.plans}
                selected={selected}
              />
              <Text className="text-center text-xs text-muted-foreground">
                {billingLine(offerings.plans, selected)}
              </Text>
            </>
          )}
          <Button
            className="h-14 rounded-full"
            disabled={busy || !selectedPackage}
            labelClassName="font-heading lowercase text-lg"
            loading={busy}
            onPress={unlock}
            sfx="success"
            size="lg"
          >
            unlock my plan.
          </Button>
          {notice ? (
            <Text selectable className="text-center text-sm text-destructive">
              {notice}
            </Text>
          ) : null}
          <FooterLinks onRestore={restorePurchase} />
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}
