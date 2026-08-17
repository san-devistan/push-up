import { Storage } from "expo-sqlite/kv-store"

const APPEARANCES = ["system", "light", "dark"] as const
const LANGUAGES = ["en", "fr"] as const

export type AppearancePreference = (typeof APPEARANCES)[number]
export type LanguagePreference = (typeof LANGUAGES)[number]

export type Preferences = {
  appearance: AppearancePreference
  language: LanguagePreference
}

const DEFAULT_PREFERENCES = {
  appearance: "system",
  language: getDefaultLanguage(),
} satisfies Preferences
const KEY = "pushup.preferences"

function getDefaultLanguage(): LanguagePreference {
  return Intl.DateTimeFormat().resolvedOptions().locale.startsWith("fr")
    ? "fr"
    : "en"
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
  return value === "en" || value === "fr"
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
    language: isLanguage(value.language)
      ? value.language
      : DEFAULT_PREFERENCES.language,
  }
}

export function savePreferences(preferences: Preferences) {
  Storage.setItemSync(KEY, JSON.stringify(preferences))
}
