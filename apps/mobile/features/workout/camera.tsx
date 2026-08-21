import type { PoseCameraProps } from "@/features/workout/camera.types"
import { useI18n } from "@/hooks/use-i18n"
import { Text } from "panelui-native"
import { View } from "react-native"

export default function PoseCamera(_: PoseCameraProps) {
  const { t } = useI18n()

  return (
    <View className="flex-1 items-center justify-center bg-black px-8">
      <Text className="text-center text-white">{t("camera.devBuild")}</Text>
    </View>
  )
}
