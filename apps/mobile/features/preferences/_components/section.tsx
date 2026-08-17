import { Icon } from "@/components/ui/icon"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type Option,
} from "@/components/ui/select"
import { Text } from "@/components/ui/text"
import { usePreferences } from "@/features/preferences/_hooks/use-preferences"
import type {
  AppearancePreference,
  LanguagePreference,
} from "@/features/preferences/_lib/storage"
import { LanguagesIcon, PaletteIcon } from "lucide-react-native"
import { View } from "react-native"

type PreferenceChoice<T extends string> = {
  label: string
  value: T
}

const LANGUAGE_CHOICES = [
  { label: "English", value: "en" },
  { label: "French", value: "fr" },
] as const satisfies readonly PreferenceChoice<LanguagePreference>[]

const APPEARANCE_CHOICES = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
] as const satisfies readonly PreferenceChoice<AppearancePreference>[]

function Divider() {
  return <View className="h-px bg-border" />
}

function getSelectedOption<T extends string>(
  options: readonly PreferenceChoice<T>[],
  value: T
) {
  return options.find((option) => option.value === value)
}

function getChoiceChange<T extends string>(
  options: readonly PreferenceChoice<T>[],
  onChange: (value: T) => void
) {
  return (option: Option) => {
    const next = options.find((item) => item.value === option?.value)

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
  icon: typeof LanguagesIcon
  label: string
  onChange: (value: T) => void
  options: readonly PreferenceChoice<T>[]
  value: T
}) {
  const change = getChoiceChange(options, onChange)
  const selected = getSelectedOption(options, value)

  return (
    <View className="flex-row items-center gap-4">
      <Icon as={icon} className="text-foreground" />
      <Text className="flex-1 font-semibold">{label}</Text>
      <Select onValueChange={change} value={selected}>
        <SelectTrigger
          accessibilityLabel={label}
          className="h-auto border-transparent bg-transparent px-0 py-0"
        >
          <SelectValue className="text-foreground" placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem
                key={option.value}
                label={option.label}
                value={option.value}
              />
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </View>
  )
}

export function PreferencesSection() {
  const { appearance, language, setAppearance, setLanguage } = usePreferences()

  return (
    <>
      <PreferenceChoiceRow
        icon={LanguagesIcon}
        label="Language"
        onChange={setLanguage}
        options={LANGUAGE_CHOICES}
        value={language}
      />
      <Divider />
      <PreferenceChoiceRow
        icon={PaletteIcon}
        label="Appearance"
        onChange={setAppearance}
        options={APPEARANCE_CHOICES}
        value={appearance}
      />
    </>
  )
}
