import { Platform } from "react-native"
import Animated from "react-native-reanimated"

type NativeOnlyAnimatedViewProps = Omit<
  React.ComponentProps<typeof Animated.View>,
  "children"
> & {
  children?: React.ReactNode
}

function NativeOnlyAnimatedView({
  children,
  ...props
}: NativeOnlyAnimatedViewProps) {
  if (Platform.OS === "web") {
    return <>{children}</>
  } else {
    return <Animated.View {...props}>{children}</Animated.View>
  }
}

export { NativeOnlyAnimatedView }
