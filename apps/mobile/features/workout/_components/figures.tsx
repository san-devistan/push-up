import { Card, CardContent } from "@/components/ui/card"
import { Icon } from "@/components/ui/icon"
import { Progress } from "@/components/ui/progress"
import { Text } from "@/components/ui/text"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react-native"
import type * as React from "react"
import { StyleSheet, View, type ViewProps } from "react-native"

const styles = StyleSheet.create({
  heroCaption: { color: "rgba(255, 255, 255, 0.6)" },
  heroNumber: { color: "#ffffff", fontSize: 72, lineHeight: 78 },
  heroSuffix: { color: "rgba(255, 255, 255, 0.45)", fontSize: 30 },
  heroSurface: {
    backgroundColor: "#09090b",
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderCurve: "continuous",
    borderRadius: 28,
    borderWidth: 1,
  },
  meter: { height: 10 },
  slab: { borderCurve: "continuous", borderRadius: 20 },
  statValue: { fontSize: 26, lineHeight: 32 },
  tile: { flexBasis: "47%", flexGrow: 1 },
  tileGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
})

export function Overline({
  children,
  tone = "muted",
}: {
  children: React.ReactNode
  tone?: "muted" | "primary"
}) {
  return (
    <Text
      className={cn(
        "font-heading text-xs uppercase tracking-[3px]",
        tone === "primary" ? "text-primary" : "text-muted-foreground"
      )}
    >
      {children}
    </Text>
  )
}

export function Hero({
  caption,
  children,
  label,
  suffix,
  value,
}: {
  caption?: string
  children?: ViewProps["children"]
  label: string
  suffix?: string
  value: string
}) {
  return (
    <View className="gap-4 p-6" style={styles.heroSurface}>
      <Overline tone="primary">{label}</Overline>
      <Text selectable className="font-extrabold" style={styles.heroNumber}>
        {value}
        {suffix ? <Text style={styles.heroSuffix}>{suffix}</Text> : null}
      </Text>
      {children}
      {caption ? <Text style={styles.heroCaption}>{caption}</Text> : null}
    </View>
  )
}

export function Meter({
  className,
  percent,
}: {
  className?: string
  percent: number
}) {
  return (
    <Progress
      className={cn("bg-primary/15", className)}
      indicatorClassName="bg-primary"
      style={styles.meter}
      value={Math.max(0, Math.min(100, percent))}
    />
  )
}

export function StatTile({
  icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <Card className="gap-0 py-0 shadow-none" style={styles.tile}>
      <CardContent className="gap-3 p-4">
        <View className="flex-row items-center gap-2">
          <Icon as={icon} className="text-muted-foreground" />
          <Text className="text-sm text-muted-foreground">{label}</Text>
        </View>
        <Text
          selectable
          className="font-heading font-bold"
          style={styles.statValue}
        >
          {value}
        </Text>
      </CardContent>
    </Card>
  )
}

export function StatGrid({ children }: { children: ViewProps["children"] }) {
  return <View style={styles.tileGrid}>{children}</View>
}

export function Slab({
  children,
  className,
}: {
  children: ViewProps["children"]
  className?: string
}) {
  return (
    <Card className="gap-0 py-0 shadow-none" style={styles.slab}>
      <CardContent className={cn("gap-4 p-5", className)}>
        {children}
      </CardContent>
    </Card>
  )
}
