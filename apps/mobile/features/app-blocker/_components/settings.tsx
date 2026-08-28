import { ShieldCheckIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Popover } from "@/components/ui/popover"
import { AppBlockerPicker } from "@/features/app-blocker/_components/picker"
import { useAppBlocker } from "@/features/app-blocker/_hooks/use-app-blocker"
import { useI18n } from "@/hooks/use-i18n"
import { selectionTick } from "@/lib/haptics"
import { Text } from "panelui-native"
import { useState } from "react"
import { Pressable, View } from "react-native"

function getOpenChange(reload: () => void, setOpen: (open: boolean) => void) {
  return (open: boolean) => {
    setOpen(open)
    if (!open) return
    selectionTick()
    reload()
  }
}

export function AppBlockerSettings() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const blocker = useAppBlocker()
  const { state } = blocker
  const summary =
    state?.enabled && state.selectedCount > 0
      ? t("appBlocker.active")
      : t("appBlocker.off")
  const changeOpen = getOpenChange(blocker.reload, setOpen)

  return (
    <Popover
      native
      onOpenChange={changeOpen}
      open={open}
      presentation="bottom-sheet"
    >
      <Popover.Trigger>
        <Pressable
          accessibilityLabel={t("appBlocker.title")}
          accessibilityRole="button"
          className="min-h-8 flex-row items-center gap-4 active:opacity-60"
          hitSlop={6}
        >
          <ShieldCheckIcon size={18} />
          <Text className="flex-1 font-semibold">{t("appBlocker.title")}</Text>
          <Text className="text-sm text-muted-foreground">{summary}</Text>
        </Pressable>
      </Popover.Trigger>
      <Popover.Content width="full">
        <View className="w-full gap-3 px-1">
          <AppBlockerPicker controller={blocker} />
          <Popover.Close>
            <Button
              className="-mb-6 w-full rounded-2xl bg-foreground active:bg-foreground/90"
              labelClassName="font-heading lowercase text-background"
              sfx="success"
            >
              done.
            </Button>
          </Popover.Close>
        </View>
      </Popover.Content>
    </Popover>
  )
}
