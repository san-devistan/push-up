import { Button } from "@/components/ui/button"
import type { AppBlockerController } from "@/features/app-blocker/_hooks/use-app-blocker"
import { useI18n } from "@/hooks/use-i18n"
import { DailyAppBlockerPicker } from "@/modules/daily-app-blocker"
import { Text } from "panelui-native"
import { ActivityIndicator, StyleSheet, View } from "react-native"

const styles = StyleSheet.create({
  picker: {
    borderCurve: "continuous",
    borderRadius: 24,
    height: 500,
    overflow: "hidden",
  },
})

export function AppBlockerPicker({
  controller,
}: {
  controller: AppBlockerController
}) {
  const { t } = useI18n()
  const { authorize, error, onSelectionChange, pending, state } = controller
  const approved = state?.authorizationStatus === "approved"

  return (
    <View className="gap-3">
      {state ? (
        state.authorizationStatus === "unsupported" ? (
          <Text className="py-4 text-muted-foreground">
            {t("appBlocker.rebuild")}
          </Text>
        ) : approved ? (
          <DailyAppBlockerPicker
            footerText={t("appBlocker.pickerFooter")}
            headerText={t("appBlocker.pickerHeader")}
            onSelectionChange={onSelectionChange}
            style={styles.picker}
          />
        ) : (
          <Button
            className="mt-3 w-full rounded-full"
            disabled={pending}
            onPress={authorize}
          >
            {t(
              state.authorizationStatus === "denied"
                ? "appBlocker.openSettings"
                : "appBlocker.allow"
            )}
          </Button>
        )
      ) : (
        <View className="items-center justify-center" style={styles.picker}>
          <ActivityIndicator />
        </View>
      )}
      {error ? (
        <Text selectable className="text-sm text-destructive">
          {error}
        </Text>
      ) : null}
    </View>
  )
}
