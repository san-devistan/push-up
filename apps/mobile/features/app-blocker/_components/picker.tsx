import { ShieldCheckIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import type { AppBlockerController } from "@/features/app-blocker/_hooks/use-app-blocker"
import { useI18n } from "@/hooks/use-i18n"
import { Text } from "panelui-native"
import { ActivityIndicator, View } from "react-native"

/**
 * A single button, not an embedded list: Apple's picker is a sheet, and
 * inlining it pushed the rest of the screen — including the continue button —
 * out of reach.
 */
export function AppBlockerPicker({
  controller,
}: {
  controller: AppBlockerController
}) {
  const { formatNumber, t } = useI18n()
  const { authorize, error, pending, state } = controller

  if (!state) {
    return (
      <View className="items-center justify-center py-6">
        <ActivityIndicator />
      </View>
    )
  }

  if (state.authorizationStatus === "unsupported") {
    return (
      <Text className="py-4 text-muted-foreground">
        {t("appBlocker.rebuild")}
      </Text>
    )
  }

  const denied = state.authorizationStatus === "denied"
  const approved = state.authorizationStatus === "approved"
  const label = denied
    ? t("appBlocker.openSettings")
    : approved
      ? t("appBlocker.chooseApps")
      : t("appBlocker.allow")

  return (
    <View className="gap-3">
      <Text className="text-muted-foreground">
        {t("appBlocker.pickerHeader")}
      </Text>
      <Button
        className="h-14 w-full rounded-full"
        disabled={pending}
        loading={pending}
        onPress={authorize}
      >
        <ShieldCheckIcon size={18} />
        {label}
      </Button>
      {approved && state.selectedCount > 0 ? (
        <Text className="text-center font-semibold text-sm text-primary">
          {t("appBlocker.selectedCount", {
            count: formatNumber(state.selectedCount),
          })}
        </Text>
      ) : null}
      <Text className="text-center text-xs text-muted-foreground">
        {t("appBlocker.pickerFooter")}
      </Text>
      {error ? (
        <Text selectable className="text-sm text-destructive">
          {error}
        </Text>
      ) : null}
    </View>
  )
}
