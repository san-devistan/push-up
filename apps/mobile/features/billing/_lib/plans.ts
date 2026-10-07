import type { PaywallPlans } from "@/features/billing/_hooks/use-offerings"

export type PlanId = "annual" | "monthly"

export function billingLine(plans: PaywallPlans, selected: PlanId) {
  const product = plans[selected]?.product
  if (!product) return null
  return selected === "annual"
    ? `Billed ${product.priceString} / year · Cancel anytime.`
    : `Billed ${product.priceString} / month · Cancel anytime.`
}
