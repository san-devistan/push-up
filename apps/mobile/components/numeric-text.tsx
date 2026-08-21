import { useI18n } from "@/hooks/use-i18n"
import { FONT_FAMILY } from "@/lib/theme"
import { cn } from "@/lib/utils"
import { Text } from "panelui-native"
import { StyleSheet, View, type StyleProp, type TextStyle } from "react-native"
import {
  NumericText as NumericTextPrimitive,
  type NumericTextProps as NumericTextPrimitiveProps,
} from "react-native-numeric-text"
import { withUniwind } from "uniwind"

export const NUMERIC_TEXT_SLOT = "\uFFFC"

export type NumericTextProps = NumericTextPrimitiveProps & {
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
  root: {
    fontFamily:
      process.env.EXPO_OS === "ios" ? "Anton-Regular" : FONT_FAMILY.heading,
  },
})

function NumericText({ className, locale, style, ...props }: NumericTextProps) {
  const { locale: defaultLocale } = useI18n()

  return (
    <StyledNumericText
      className={cn("text-base text-foreground", className)}
      locale={locale ?? defaultLocale}
      style={StyleSheet.compose(styles.root, style)}
      {...props}
    />
  )
}

function NumericPhrase({
  className,
  containerClassName,
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

  return (
    <View className={cn("flex-row items-center", containerClassName)}>
      {before ? (
        <Text className={textClassName} style={textStyle}>
          {before}
        </Text>
      ) : null}
      <NumericText className={className} {...props} />
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
