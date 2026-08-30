import { resolvePreferences } from "@/features/preferences/_lib/mode"
import {
  getPhonePreferences,
  loadPreferences,
  savePreferences,
  type AppearancePreference,
  type ClockFormatPreference,
  type LanguagePreference,
  type Preferences,
} from "@/features/preferences/_lib/storage"
import * as React from "react"
import { AppState, useColorScheme as useSystemColorScheme } from "react-native"

type ResolvedColorScheme = "light" | "dark"

type PreferencesContextValue = Preferences & {
  colorScheme: ResolvedColorScheme
  debugMode: boolean
  setAppearance: (appearance: AppearancePreference) => void
  setClockFormat: (clockFormat: ClockFormatPreference) => void
  setLanguage: (language: LanguagePreference) => void
  toggleDebugMode: () => void
}
type PreferencesActions = Pick<
  PreferencesContextValue,
  "setAppearance" | "setClockFormat" | "setLanguage" | "toggleDebugMode"
>

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

function setClockFormatPreference(
  clockFormat: ClockFormatPreference,
  setPreferences: React.Dispatch<React.SetStateAction<Preferences>>
) {
  setPreferences((current) => {
    const next = { ...current, clockFormat }
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

function getSetClockFormat(
  setPreferences: React.Dispatch<React.SetStateAction<Preferences>>
) {
  return (clockFormat: ClockFormatPreference) =>
    setClockFormatPreference(clockFormat, setPreferences)
}

function getPreferencesContextValue(
  preferences: Preferences,
  colorScheme: ResolvedColorScheme,
  debugMode: boolean,
  actions: PreferencesActions
) {
  return {
    ...preferences,
    ...actions,
    colorScheme,
    debugMode,
  }
}

export function PreferencesProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [preferences, setPreferences] = React.useState(loadPreferences)
  const [phonePreferences, setPhonePreferences] =
    React.useState(getPhonePreferences)
  const [debugMode, setDebugMode] = React.useState(false)
  const systemScheme = useSystemColorScheme() === "dark" ? "dark" : "light"
  const activePreferences = resolvePreferences(
    debugMode,
    phonePreferences,
    preferences
  )
  const colorScheme = resolveColorScheme(
    activePreferences.appearance,
    systemScheme
  )
  const toggleDebugMode = () => setDebugMode((current) => !current)
  const setAppearance = getSetAppearance(setPreferences)
  const setClockFormat = getSetClockFormat(setPreferences)
  const setLanguage = getSetLanguage(setPreferences)

  React.useEffect(() => {
    const subscription = AppState.addEventListener("change", () =>
      setPhonePreferences(getPhonePreferences())
    )

    return () => subscription.remove()
  }, [])

  const value = getPreferencesContextValue(
    activePreferences,
    colorScheme,
    debugMode,
    { setAppearance, setClockFormat, setLanguage, toggleDebugMode }
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
