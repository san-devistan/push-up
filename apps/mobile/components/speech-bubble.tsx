import { cn } from "@/lib/utils"
import { Text } from "panelui-native"
import type { ReactNode } from "react"
import { View } from "react-native"

export function SpeechBubble({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <View
      className={cn(
        "rounded-2xl border border-border bg-muted px-3 pt-3 pb-1.5",
        className
      )}
    >
      <Text className="font-heading text-2xl leading-7 text-foreground">
        {children}
      </Text>
      <View className="absolute -bottom-1 left-4 size-2 rotate-45 border-r border-b border-border bg-muted" />
    </View>
  )
}
