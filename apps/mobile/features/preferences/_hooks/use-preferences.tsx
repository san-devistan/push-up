import {
  loadPreferences,
  savePreferences,
  type AppearancePreference,
  type LanguagePreference,
  type Preferences,
} from "@/features/preferences/_lib/storage"
import * as React from "react"
import { useColorScheme as useSystemColorScheme } from "react-native"

type ResolvedColorScheme = "light" | "dark"

type PreferencesContextValue = Preferences & {
  colorScheme: ResolvedColorScheme
  setAppearance: (appearance: AppearancePreference) => void
  setLanguage: (language: LanguagePreference) => void
}

const PreferencesContext = React.createContext<PreferencesContextValue | null>(
  null
)

function resolveColorScheme(
  appearance: AppearancePreference,
  systemScheme: ResolvedColorScheme
): ResolvedColorScheme {
  return appearance === "system" ? systemScheme : appearance
}

function setAppearancePreference(
  appearance: AppearancePreference,
  setPreferences: React.Dispatch<React.SetStateAction<Preferences>>
) {
  setPreferences((current) => {
    const next = { ...current, appearance }
    savePreferences(next)
    return next
  })
}

function setLanguagePreference(
  language: LanguagePreference,
  setPreferences: React.Dispatch<React.SetStateAction<Preferences>>
) {
  setPreferences((current) => {
    const next = { ...current, language }
    savePreferences(next)
    return next
  })
}

function getSetAppearance(
  setPreferences: React.Dispatch<React.SetStateAction<Preferences>>
) {
  return (appearance: AppearancePreference) =>
    setAppearancePreference(appearance, setPreferences)
}

function getSetLanguage(
  setPreferences: React.Dispatch<React.SetStateAction<Preferences>>
) {
  return (language: LanguagePreference) =>
    setLanguagePreference(language, setPreferences)
}

function getPreferencesContextValue(
  preferences: Preferences,
  colorScheme: ResolvedColorScheme,
  setAppearance: (appearance: AppearancePreference) => void,
  setLanguage: (language: LanguagePreference) => void
) {
  return { ...preferences, colorScheme, setAppearance, setLanguage }
}

export function PreferencesProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [preferences, setPreferences] = React.useState(loadPreferences)
  const systemScheme = useSystemColorScheme() === "dark" ? "dark" : "light"
  const colorScheme = resolveColorScheme(preferences.appearance, systemScheme)
  const setAppearance = getSetAppearance(setPreferences)
  const setLanguage = getSetLanguage(setPreferences)
  const value = getPreferencesContextValue(
    preferences,
    colorScheme,
    setAppearance,
    setLanguage
  )

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const value = React.use(PreferencesContext)

  if (!value) {
    throw new Error("usePreferences must be used inside PreferencesProvider")
  }

  return value
}

export function useResolvedColorScheme() {
  return usePreferences().colorScheme
}
