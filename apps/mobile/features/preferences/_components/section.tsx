import { usePreferences } from "@/features/preferences/_hooks/use-preferences"
import type {
  AppearancePreference,
  ClockFormatPreference,
  LanguagePreference,
} from "@/features/preferences/_lib/storage"
import { useI18n } from "@/hooks/use-i18n"
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from "@/lib/i18n"
import {
  ClockIcon,
  MessageCircleIcon,
  Select,
  SunIcon,
  Text,
  type IconProps,
} from "panelui-native"
import type { ComponentType } from "react"
import { View } from "react-native"

type PreferenceChoice<T extends string> = {
  label: string
  value: T
}

const LANGUAGE_CHOICES = SUPPORTED_LANGUAGES.map((value) => ({
  label: LANGUAGE_LABELS[value],
  value,
})) satisfies readonly PreferenceChoice<LanguagePreference>[]

function Divider() {
  return <View className="h-px bg-border" />
}

function getChoiceChange<T extends string>(
  options: readonly PreferenceChoice<T>[],
  onChange: (value: T) => void
) {
  return (value: string) => {
    const next = options.find((item) => item.value === value)

    if (next) {
      onChange(next.value)
    }
  }
}

function PreferenceChoiceRow<T extends string>({
  icon,
  label,
  onChange,
  options,
  value,
}: {
  icon: ComponentType<IconProps>
  label: string
  onChange: (value: T) => void
  options: readonly PreferenceChoice<T>[]
  value: T
}) {
  const change = getChoiceChange(options, onChange)
  const PreferenceIcon = icon

  return (
    <View className="flex-row items-center gap-4">
      <PreferenceIcon size={18} />
      <Text className="flex-1 font-semibold">{label}</Text>
      <Select
        className="w-32"
        contentWidth="content"
        onValueChange={change}
        placeholder={label}
        presentation="overlay"
        value={value}
      >
        <Select.Group>
          {options.map((option) => (
            <Select.Item
              key={option.value}
              label={option.label}
              value={option.value}
            />
          ))}
        </Select.Group>
      </Select>
    </View>
  )
}

export function PreferencesSection() {
  const {
    appearance,
    clockFormat,
    language,
    setAppearance,
    setClockFormat,
    setLanguage,
  } = usePreferences()
  const { t } = useI18n()
  const appearanceChoices = [
    { label: t("appearance.system"), value: "system" },
    { label: t("appearance.light"), value: "light" },
    { label: t("appearance.dark"), value: "dark" },
  ] satisfies readonly PreferenceChoice<AppearancePreference>[]
  const clockChoices = [
    { label: "12-hour", value: "12" },
    { label: "24-hour", value: "24" },
  ] satisfies readonly PreferenceChoice<ClockFormatPreference>[]

  return (
    <>
      <PreferenceChoiceRow
        icon={MessageCircleIcon}
        label={t("preferences.language")}
        onChange={setLanguage}
        options={LANGUAGE_CHOICES}
        value={language}
      />
      <Divider />
      <PreferenceChoiceRow
        icon={SunIcon}
        label={t("preferences.appearance")}
        onChange={setAppearance}
        options={appearanceChoices}
        value={appearance}
      />
      <Divider />
      <PreferenceChoiceRow
        icon={ClockIcon}
        label={t("preferences.timeFormat")}
        onChange={setClockFormat}
        options={clockChoices}
        value={clockFormat}
      />
    </>
  )
}
