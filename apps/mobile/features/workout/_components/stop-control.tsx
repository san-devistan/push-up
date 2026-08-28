import { XIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Surface } from "@/components/ui/surface"
import { useI18n } from "@/hooks/use-i18n"
import { StyleSheet } from "react-native"

const styles = StyleSheet.create({
  surface: { borderCurve: "circular" },
})

export function StopControl({ onPress }: { onPress: () => void }) {
  const { t } = useI18n()

  return (
    <Button
      accessibilityLabel={t("session.stop")}
      className="h-[72px] w-[72px] shrink-0 rounded-full border-0 bg-transparent p-1"
      onPress={onPress}
      size="icon"
      sfx={false}
      variant="ghost"
    >
      <Surface
        className="flex-1 items-center justify-center self-stretch rounded-full"
        padding="none"
        pointerEvents="none"
        style={styles.surface}
        variant="destructive"
      >
        <XIcon color="#ffffff" size={28} strokeWidth={3} />
      </Surface>
    </Button>
  )
}
