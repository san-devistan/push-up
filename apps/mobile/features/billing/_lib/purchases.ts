import { Platform } from "react-native"
import Purchases, { LOG_LEVEL, type CustomerInfo } from "react-native-purchases"

/** RevenueCat entitlement that unlocks the whole app. */
export const PRO_ENTITLEMENT = "pro"

const apiKey =
  Platform.OS === "ios"
    ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
    : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY

/**
 * Billing only runs where a public SDK key is available. Without one (web,
 * Android until a Play app exists) the app stays fully open instead of
 * locking everyone out behind a paywall that cannot load.
 */
export const isBillingConfigured = Boolean(apiKey)

let configured = false

export function configurePurchases() {
  if (!apiKey || configured) {
    return
  }

  configured = true
  void Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR)
  Purchases.configure({ apiKey })
}

export function hasProEntitlement(info: CustomerInfo) {
  return PRO_ENTITLEMENT in info.entitlements.active
}
