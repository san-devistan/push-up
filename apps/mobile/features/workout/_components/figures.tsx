import { Surface } from "@/components/ui/surface"
import { cn } from "@/lib/utils"
import { Text } from "panelui-native"
import type { ReactNode } from "react"
import { View, type ViewProps } from "react-native"

export function Overline({
  children,
  tone = "muted",
}: {
  children: ReactNode
  tone?: "muted" | "primary"
}) {
  return (
    <Text
      className={cn(
        "font-mono text-xs",
        tone === "primary" ? "text-primary" : "text-muted-foreground"
      )}
    >
      {children}
    </Text>
  )
}

export function Slab({
  children,
  className,
}: {
  children: ViewProps["children"]
  className?: string
}) {
  return (
    <Surface elevated padding="none">
      <View className={cn("gap-4 p-5", className)}>{children}</View>
    </Surface>
  )
}
