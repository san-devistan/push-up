import { Surface } from "@/components/ui/surface"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { cn } from "@/lib/utils"
import { Text } from "panelui-native"
import type { ReactNode } from "react"
import { View } from "react-native"

export function SpeechBubble({
  children,
  className,
  tail = "left",
  textClassName,
}: {
  children: ReactNode
  className?: string
  tail?: "left" | "right"
  textClassName?: string
}) {
  const surfaceVariant = useColorScheme() === "light" ? "tertiary" : "default"

  return (
    <View className={cn("relative", className)}>
      <View
        className={cn(
          "absolute size-3 rotate-45 border-white/60 bg-[rgba(248,248,248,0.76)] dark:border-white/[0.16] dark:bg-[rgba(45,47,46,0.68)]",
          tail === "right"
            ? "top-1/2 -right-1.5 -translate-y-1/2 border-t border-r"
            : "-bottom-1.5 left-4 border-r border-b"
        )}
        pointerEvents="none"
      />
      <Surface
        className="rounded-2xl px-3 pt-3 pb-1.5"
        padding="none"
        variant={surfaceVariant}
      >
        <Text
          className={cn(
            "font-heading text-2xl leading-7 text-foreground",
            textClassName
          )}
          numberOfLines={1}
        >
          {children}
        </Text>
      </Surface>
    </View>
  )
}
