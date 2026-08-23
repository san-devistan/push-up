import type { FaceCameraProps } from "@/features/workout/camera.types"
import { useI18n } from "@/hooks/use-i18n"
import { Text } from "panelui-native"
import { View } from "react-native"

export default function FaceCamera(_: FaceCameraProps) {
  const { t } = useI18n()

  return (
    <View className="z-10 flex-1 items-center justify-center bg-background px-8">
      <Text className="text-center text-foreground">
        {t("camera.devBuild")}
      </Text>
    </View>
  )
}
