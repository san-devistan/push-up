import type { Preferences } from "./storage"

export function resolvePreferences(
  debugMode: boolean,
  phonePreferences: Preferences,
  debugPreferences: Preferences
) {
  return debugMode ? debugPreferences : phonePreferences
}
