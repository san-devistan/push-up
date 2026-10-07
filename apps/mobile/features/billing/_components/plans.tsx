import { CheckIcon } from "@/components/icons"
import {
  formatPrice,
  yearlySavings,
  type PaywallPlans,
} from "@/features/billing/_hooks/use-offerings"
import type { PlanId } from "@/features/billing/_lib/plans"
import { cn } from "@/lib/cn"
import { Text } from "panelui-native"
import { Pressable, View } from "react-native"
import { useCSSVariable } from "uniwind"

const SELECTED_STATE = { selected: true }
const UNSELECTED_STATE = { selected: false }

function getSelectAction(onSelect: (plan: PlanId) => void, plan: PlanId) {
  return () => onSelect(plan)
}

function PlanCard({
  badge,
  detail,
  onPress,
  price,
  selected,
  title,
}: {
  badge?: string
  detail?: string
  onPress: () => void
  price: string
  selected: boolean
  title: string
}) {
  const primaryForeground = useCSSVariable("--color-primary-foreground")

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={selected ? SELECTED_STATE : UNSELECTED_STATE}
      className={cn(
        "flex-1 gap-1 rounded-3xl border-2 p-4 pt-5",
        selected ? "border-primary bg-primary/10" : "border-border bg-card"
      )}
      onPress={onPress}
    >
      {badge ? (
        <View className="absolute -top-3 right-3 rounded-full bg-primary px-3 py-1">
          <Text
            adjustsFontSizeToFit
            className="font-bold text-xs text-primary-foreground"
            minimumFontScale={0.7}
            numberOfLines={1}
          >
            {badge}
          </Text>
        </View>
      ) : null}
      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-muted-foreground">{title}</Text>
        <View
          className={cn(
            "size-5 items-center justify-center rounded-full border-2",
            selected ? "border-primary bg-primary" : "border-border"
          )}
        >
          {selected ? (
            <CheckIcon
              color={
                typeof primaryForeground === "string"
                  ? primaryForeground
                  : undefined
              }
              size={12}
            />
          ) : null}
        </View>
      </View>
      <Text
        adjustsFontSizeToFit
        className="font-heading text-2xl"
        minimumFontScale={0.7}
        numberOfLines={1}
      >
        {price}
      </Text>
      {detail ? (
        <Text className="font-medium text-sm text-muted-foreground">
          {detail}
        </Text>
      ) : null}
    </Pressable>
  )
}

export type { PlanId }

export function Plans({
  locale,
  onSelect,
  plans,
  selected,
}: {
  locale: string
  onSelect: (plan: PlanId) => void
  plans: PaywallPlans
  selected: PlanId
}) {
  const savings = yearlySavings(plans)
  const annual = plans.annual?.product
  const monthly = plans.monthly?.product
  const selectMonthly = getSelectAction(onSelect, "monthly")
  const selectAnnual = getSelectAction(onSelect, "annual")

  return (
    <View className="flex-row gap-3 pt-3">
      {monthly ? (
        <PlanCard
          onPress={selectMonthly}
          price={monthly.priceString}
          selected={selected === "monthly"}
          title="Monthly"
        />
      ) : null}
      {annual ? (
        <PlanCard
          badge={savings ? `SAVE ${savings}%` : undefined}
          detail={`${formatPrice(annual.price / 12, annual.currencyCode, locale)} / month`}
          onPress={selectAnnual}
          price={annual.priceString}
          selected={selected === "annual"}
          title="Yearly"
        />
      ) : null}
    </View>
  )
}
