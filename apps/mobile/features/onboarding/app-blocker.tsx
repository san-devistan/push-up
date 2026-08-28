import { AppBlockerPicker } from "@/features/app-blocker/_components/picker"
import { useAppBlocker } from "@/features/app-blocker/_hooks/use-app-blocker"
import { useI18n } from "@/hooks/use-i18n"
import { Text } from "panelui-native"
import { View } from "react-native"

export default function AppBlockerStep() {
  const { t } = useI18n()
  const blocker = useAppBlocker()

  return (
    <View className="flex-1 gap-5">
      <Text className="font-heading text-4xl leading-[44px]">
        {t("appBlocker.onboardingTitle")}
      </Text>
      <AppBlockerPicker controller={blocker} />
    </View>
  )
}
