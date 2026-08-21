import {
  resolveLanguageTag,
  SUPPORTED_LANGUAGES,
  type Language,
} from "@/lib/i18n"
import { Storage } from "expo-sqlite/kv-store"

const APPEARANCES = ["system", "light", "dark"] as const
const CLOCK_FORMATS = ["12", "24"] as const
const HOUR_FORMATTER = new Intl.DateTimeFormat(undefined, { hour: "numeric" })

export type AppearancePreference = (typeof APPEARANCES)[number]
export type ClockFormatPreference = (typeof CLOCK_FORMATS)[number]
export type LanguagePreference = Language

export type Preferences = {
  appearance: AppearancePreference
  clockFormat: ClockFormatPreference
  language: LanguagePreference
}

const DEFAULT_PREFERENCES = {
  appearance: "system",
  clockFormat: getDefaultClockFormat(),
  language: getDefaultLanguage(),
} satisfies Preferences
const KEY = "pushup.preferences"

function getDefaultLanguage(): LanguagePreference {
  return resolveLanguageTag(Intl.DateTimeFormat().resolvedOptions().locale)
}

function getDefaultClockFormat(): ClockFormatPreference {
  return HOUR_FORMATTER.resolvedOptions().hour12 ? "12" : "24"
}

function readJson(key: string): unknown {
  try {
    const value = Storage.getItemSync(key)
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isAppearance(value: unknown): value is AppearancePreference {
  return value === "system" || value === "light" || value === "dark"
}

function isLanguage(value: unknown): value is LanguagePreference {
  return (
    typeof value === "string" &&
    SUPPORTED_LANGUAGES.some((language) => language === value)
  )
}

function isClockFormat(value: unknown): value is ClockFormatPreference {
  return value === "12" || value === "24"
}

export function loadPreferences(): Preferences {
  const value = readJson(KEY)

  if (!isRecord(value)) {
    return DEFAULT_PREFERENCES
  }

  return {
    appearance: isAppearance(value.appearance)
      ? value.appearance
      : DEFAULT_PREFERENCES.appearance,
    clockFormat: isClockFormat(value.clockFormat)
      ? value.clockFormat
      : DEFAULT_PREFERENCES.clockFormat,
    language: isLanguage(value.language)
      ? value.language
      : DEFAULT_PREFERENCES.language,
  }
}

export function savePreferences(preferences: Preferences) {
  Storage.setItemSync(KEY, JSON.stringify(preferences))
}
