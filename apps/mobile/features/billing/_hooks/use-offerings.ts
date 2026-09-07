import { hasProEntitlement } from "@/features/billing/_lib/purchases"
import { useEffect, useState } from "react"
import Purchases, { type PurchasesPackage } from "react-native-purchases"

export type PaywallPlans = {
  annual: PurchasesPackage | null
  monthly: PurchasesPackage | null
}

type OfferingsState = {
  error: boolean
  loading: boolean
  plans: PaywallPlans
}

export type PurchaseOutcome = "cancelled" | "failed" | "purchased"

const EMPTY_PLANS: PaywallPlans = { annual: null, monthly: null }

function errorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? error.code
    : undefined
}

export function useOfferings() {
  const [state, setState] = useState<OfferingsState>({
    error: false,
    loading: true,
    plans: EMPTY_PLANS,
  })

  useEffect(() => {
    let active = true

    Purchases.getOfferings()
      .then(({ current }) => {
        if (!active) return null
        const packages = current?.availablePackages ?? []
        return setState({
          error: false,
          loading: false,
          plans: {
            annual: packages.find((p) => p.identifier === "$rc_annual") ?? null,
            monthly:
              packages.find((p) => p.identifier === "$rc_monthly") ?? null,
          },
        })
      })
      .catch(() => {
        if (active)
          setState({ error: true, loading: false, plans: EMPTY_PLANS })
      })

    return () => {
      active = false
    }
  }, [])

  return state
}

export async function purchase(
  pkg: PurchasesPackage
): Promise<PurchaseOutcome> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg)
    return hasProEntitlement(customerInfo) ? "purchased" : "failed"
  } catch (error) {
    return errorCode(error) ===
      Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR
      ? "cancelled"
      : "failed"
  }
}

export async function restore() {
  try {
    return hasProEntitlement(await Purchases.restorePurchases())
  } catch {
    return false
  }
}

/** Share of the yearly price saved against twelve monthly renewals. */
export function yearlySavings(plans: PaywallPlans) {
  if (!(plans.annual && plans.monthly)) return null
  const yearly = plans.annual.product.price
  const monthly = plans.monthly.product.price
  if (monthly <= 0) return null
  return Math.max(0, Math.round((1 - yearly / (monthly * 12)) * 100))
}

export function formatPrice(
  amount: number,
  currencyCode: string,
  locale: string
) {
  try {
    return new Intl.NumberFormat(locale, {
      currency: currencyCode,
      style: "currency",
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currencyCode}`
  }
}
