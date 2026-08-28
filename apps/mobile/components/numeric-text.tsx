import { useI18n } from "@/hooks/use-i18n"
import { FONT_FAMILY } from "@/lib/theme"
import { cn } from "@/lib/utils"
import { Text } from "panelui-native"
import {
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native"
import {
  NumericText as NumericTextPrimitive,
  type NumericTextProps as NumericTextPrimitiveProps,
} from "react-native-numeric-text"
import { withUniwind } from "uniwind"

export const NUMERIC_TEXT_SLOT = "\uFFFC"

type NumericTextLayoutProps =
  | { containerStyle?: never; layoutStyle?: never; layoutText?: undefined }
  | {
      containerStyle?: StyleProp<ViewStyle>
      layoutStyle?: StyleProp<TextStyle>
      layoutText: string
    }

export type NumericTextProps = NumericTextPrimitiveProps &
  NumericTextLayoutProps & {
    className?: string
  }

type NumericPhraseProps = NumericTextProps & {
  containerClassName?: string
  template: string
  textClassName?: string
  textStyle?: StyleProp<TextStyle>
}

const StyledNumericText = withUniwind(NumericTextPrimitive)

const styles = StyleSheet.create({
  layoutOverlay: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  layoutPlaceholder: { opacity: 0 },
  root: {
    fontFamily:
      process.env.EXPO_OS === "ios" ? "Anton-Regular" : FONT_FAMILY.heading,
  },
})

function NumericText({
  className,
  containerStyle,
  layoutStyle,
  layoutText,
  locale,
  style,
  ...props
}: NumericTextProps) {
  const { locale: defaultLocale } = useI18n()
  const resolvedClassName = cn("text-base text-foreground", className)
  const resolvedStyle = StyleSheet.compose<TextStyle, TextStyle, TextStyle>(
    styles.root,
    style
  )
  const numericText = (
    <StyledNumericText
      className={resolvedClassName}
      locale={locale ?? defaultLocale}
      style={resolvedStyle}
      {...props}
    />
  )

  if (layoutText === undefined) return numericText

  return (
    <View style={containerStyle}>
      <Text
        accessibilityElementsHidden
        accessible={false}
        className={resolvedClassName}
        importantForAccessibility="no-hide-descendants"
        style={StyleSheet.compose<TextStyle, TextStyle, TextStyle>(
          layoutStyle,
          styles.layoutPlaceholder
        )}
      >
        {layoutText}
      </Text>
      <View pointerEvents="none" style={styles.layoutOverlay}>
        {numericText}
      </View>
    </View>
  )
}

function NumericPhrase({
  align,
  className,
  containerClassName,
  style,
  template,
  textClassName,
  textStyle,
  ...props
}: NumericPhraseProps) {
  const slot = template.indexOf(NUMERIC_TEXT_SLOT)

  if (slot < 0) {
    return (
      <Text className={textClassName} style={textStyle}>
        {template}
      </Text>
    )
  }

  const before = template.slice(0, slot)
  const after = template.slice(slot + NUMERIC_TEXT_SLOT.length)
  const numberAlign =
    align ?? (before && !after ? "start" : after && !before ? "end" : "center")

  return (
    <View className={cn("flex-row items-center", containerClassName)}>
      {before ? (
        <Text className={textClassName} style={textStyle}>
          {before}
        </Text>
      ) : null}
      <NumericText
        align={numberAlign}
        className={cn(
          className,
          "-translate-y-px",
          before && "-ml-[0.31em]",
          after && "-mr-[0.31em]"
        )}
        style={style}
        {...props}
      />
      {after ? (
        <Text className={textClassName} style={textStyle}>
          {after}
        </Text>
      ) : null}
    </View>
  )
}

export { NumericPhrase, NumericText }
export type { NumericTextFormat } from "react-native-numeric-text"
