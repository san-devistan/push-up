import type { IconProps } from "@/components/icons"
import { NumericText, type NumericTextProps } from "@/components/numeric-text"
import { useI18n } from "@/hooks/use-i18n"
import { cn } from "@/lib/utils"
import { Progress, Surface, Text } from "panelui-native"
import type { ComponentType, ReactNode, Ref } from "react"
import { StyleSheet, View, type ViewProps } from "react-native"
import { useCSSVariable } from "uniwind"

const styles = StyleSheet.create({
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
  statListValue: { maxWidth: "58%" },
})

const HERO_SURFACE = {
  dark: styles.heroSurfaceDark,
  light: styles.heroSurfaceLight,
}

export function HeroSurface({
  children,
  className,
  ref,
  tone,
}: {
  children: ViewProps["children"]
  className?: string
  ref?: Ref<View>
  tone: "dark" | "light"
}) {
  return (
    <View
      className={className}
      collapsable={false}
      ref={ref}
      style={HERO_SURFACE[tone]}
    >
      {children}
    </View>
  )
}

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

export function Meter({
  className,
  percent,
}: {
  className?: string
  percent: number
}) {
  return (
    <Progress
      className={className}
      indicatorClassName="bg-primary"
      size="lg"
      value={Math.max(0, Math.min(100, percent))}
    />
  )
}

type StatListItem = {
  children: ReactNode
  icon: ComponentType<IconProps>
  iconSolid?: boolean
  label: string
}

type StatNumberProps = Pick<
  NumericTextProps,
  | "align"
  | "format"
  | "maximumFractionDigits"
  | "minimumFractionDigits"
  | "value"
> & { suffix?: string }

export function StatsDivider() {
  return <View className="h-px bg-border dark:bg-foreground/20" />
}

export function StatsListRow({
  children,
  icon,
  iconSolid,
  label,
}: StatListItem) {
  const StatIcon = icon
  const foregroundValue = useCSSVariable("--color-foreground")
  const backgroundValue = useCSSVariable("--color-background")
  const foreground =
    typeof foregroundValue === "string" ? foregroundValue : undefined
  const background =
    typeof backgroundValue === "string" ? backgroundValue : undefined

  return (
    <View className="flex-row items-center gap-2.5">
      <StatIcon
        color={iconSolid ? foreground : background}
        fill={foreground}
        size={18}
      />
      <Text className="flex-1 font-semibold">{label}</Text>
      <View
        className="shrink flex-row items-end justify-end"
        style={styles.statListValue}
      >
        {children}
      </View>
    </View>
  )
}

export function StatNumber({ suffix, ...props }: StatNumberProps) {
  return (
    <>
      <NumericText align="end" className="text-base" {...props} />
      {suffix ? (
        <Text className="-ml-1 font-heading text-base">
          {suffix.trimStart()}
        </Text>
      ) : null}
    </>
  )
}

export function StatsList({
  children,
  title,
}: {
  children: ViewProps["children"]
  title?: string
}) {
  const { t } = useI18n()

  return (
    <Slab>
      <Text className="font-mono text-xs text-muted-foreground">
        {title ?? t("common.stats")}
      </Text>
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
    <Surface elevated padding="none">
      <View className={cn("gap-4 p-5", className)}>{children}</View>
    </Surface>
  )
}
