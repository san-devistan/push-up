import { ShieldCheckIcon } from "@/components/icons"
import { useAppBlocker } from "@/features/app-blocker/_hooks/use-app-blocker"
import { useI18n } from "@/hooks/use-i18n"
import { selectionTick } from "@/lib/haptics"
import { Text } from "panelui-native"
import { Pressable, View } from "react-native"

function getOpenPicker(authorize: () => void) {
  return () => {
    selectionTick()
    authorize()
  }
}

/**
 * The row hands straight over to Apple's picker sheet. There is no in-app
 * sheet in between: the system one already owns the title and the done button.
 */
export function AppBlockerSettings() {
  const { formatNumber, t } = useI18n()
  const blocker = useAppBlocker()
  const { authorize, error, state } = blocker
  const summary =
    state?.enabled && state.selectedCount > 0
      ? t("appBlocker.selectedCount", {
          count: formatNumber(state.selectedCount),
        })
      : t("appBlocker.off")

  return (
    <View className="gap-2">
      <Pressable
        accessibilityLabel={t("appBlocker.title")}
        accessibilityRole="button"
        className="min-h-8 flex-row items-center gap-4 active:opacity-60"
        hitSlop={6}
        onPress={getOpenPicker(authorize)}
      >
        <ShieldCheckIcon size={18} />
        <Text className="flex-1 font-semibold">{t("appBlocker.title")}</Text>
        <Text className="text-sm text-muted-foreground">{summary}</Text>
      </Pressable>
      {state?.enabled && state.selectedCount > 0 ? (
        <Text className="text-xs text-muted-foreground">
          {t("appBlocker.relaunchHint")}
        </Text>
      ) : null}
      {error ? (
        <Text selectable className="text-sm text-destructive">
          {error}
        </Text>
      ) : null}
    </View>
  )
}
