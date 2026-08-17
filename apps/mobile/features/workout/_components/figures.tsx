import { Card, CardContent } from "@/components/ui/card"
import { Icon } from "@/components/ui/icon"
import { Progress } from "@/components/ui/progress"
import { Text } from "@/components/ui/text"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react-native"
import type { ReactNode } from "react"
import { StyleSheet, View, type ViewProps } from "react-native"

const styles = StyleSheet.create({
  heroCaptionDark: { color: "rgba(255, 255, 255, 0.6)" },
  heroCaptionLight: { color: "rgba(9, 9, 11, 0.55)" },
  heroLabelDark: { color: "#ffffff" },
  heroLabelLight: { color: "#09090b" },
  heroNumberDark: { color: "#ffffff", fontSize: 72, lineHeight: 78 },
  heroNumberLight: { color: "#09090b", fontSize: 72, lineHeight: 78 },
  heroSuffixDark: { color: "rgba(255, 255, 255, 0.45)", fontSize: 30 },
  heroSuffixLight: { color: "rgba(9, 9, 11, 0.5)", fontSize: 30 },
  heroSurfaceDark: {
    backgroundColor: "#09090b",
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderCurve: "continuous",
    borderRadius: 28,
    borderWidth: 1,
  },
  heroSurfaceLight: {
    backgroundColor: "#e8e8e8",
    borderColor: "rgba(255, 255, 255, 0.16)",
    borderCurve: "continuous",
    borderRadius: 28,
    borderWidth: 1,
  },
  meter: { height: 10 },
  slab: { borderCurve: "continuous", borderRadius: 20 },
  statListValue: { maxWidth: "58%" },
})

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
  tone = "dark",
  value,
}: {
  caption?: string
  children?: ViewProps["children"]
  label: string
  suffix?: string
  tone?: "dark" | "light"
  value: string
}) {
  const isLight = tone === "light"

  return (
    <View
      className="gap-4 p-6"
      style={isLight ? styles.heroSurfaceLight : styles.heroSurfaceDark}
    >
      <Text
        className="font-heading text-xs uppercase tracking-[3px]"
        style={isLight ? styles.heroLabelLight : styles.heroLabelDark}
      >
        {label}
      </Text>
      <Text
        selectable
        className="font-extrabold"
        style={isLight ? styles.heroNumberLight : styles.heroNumberDark}
      >
        {value}
        {suffix ? (
          <Text
            style={isLight ? styles.heroSuffixLight : styles.heroSuffixDark}
          >
            {suffix}
          </Text>
        ) : null}
      </Text>
      {children}
      {caption ? (
        <Text
          style={isLight ? styles.heroCaptionLight : styles.heroCaptionDark}
        >
          {caption}
        </Text>
      ) : null}
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

type StatListItem = {
  icon: LucideIcon
  label: string
  value: string
}

export function StatsDivider() {
  return <View className="h-px bg-border dark:bg-foreground/20" />
}

export function StatsListRow({ icon, label, value }: StatListItem) {
  return (
    <View className="flex-row items-center gap-4">
      <Icon as={icon} className="text-foreground" />
      <Text className="flex-1 font-semibold">{label}</Text>
      <Text
        selectable
        className="shrink text-right font-heading text-base font-bold tabular-nums"
        numberOfLines={1}
        style={styles.statListValue}
      >
        {value}
      </Text>
    </View>
  )
}

export function StatsList({
  children,
  title = "Stats",
}: {
  children: ViewProps["children"]
  title?: string
}) {
  return (
    <Slab>
      <Overline>{title}</Overline>
      {children}
    </Slab>
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
    <Card
      className="gap-0 border-transparent bg-muted py-0 shadow-none dark:border-border dark:bg-card"
      style={styles.slab}
    >
      <CardContent className={cn("gap-4 p-5", className)}>
        {children}
      </CardContent>
    </Card>
  )
}
