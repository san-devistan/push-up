import { Text } from "@/components/ui/text"
import type { PoseCameraProps } from "@/features/workout/camera.types"
import { View } from "react-native"

export default function PoseCamera(_: PoseCameraProps) {
  return (
    <View className="flex-1 items-center justify-center bg-black px-8">
      <Text className="text-center text-white">
        Push-up detection requires the iOS or Android development build.
      </Text>
    </View>
  )
}
