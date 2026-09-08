import { requireOptionalNativeModule } from "expo"

export { default as DailyAppBlockerPicker } from "./src/picker"

export type DailyAppBlockerAuthorizationStatus =
  | "approved"
  | "denied"
  | "notDetermined"
  | "unsupported"

export type DailyAppBlockerState = {
  authorizationStatus: DailyAppBlockerAuthorizationStatus
  enabled: boolean
  selectedCount: number
}

type NativeDailyAppBlocker = {
  getState(): Promise<DailyAppBlockerState>
  presentPicker(): Promise<DailyAppBlockerState>
  requestAuthorization(): Promise<DailyAppBlockerState>
  setEnabled(enabled: boolean): Promise<DailyAppBlockerState>
  sync(goalCompleted: boolean, localDate: string): Promise<void>
}

const nativeModule = requireOptionalNativeModule<NativeDailyAppBlocker>(
  "PumprDailyAppBlocker"
)

const UNSUPPORTED_STATE = {
  authorizationStatus: "unsupported",
  enabled: false,
  selectedCount: 0,
} satisfies DailyAppBlockerState

export function getDailyAppBlockerState() {
  return nativeModule?.getState() ?? Promise.resolve(UNSUPPORTED_STATE)
}

/** Opens Apple's own "Select Apps & Websites" sheet and resolves once closed. */
export function presentDailyAppBlockerPicker() {
  return nativeModule?.presentPicker() ?? Promise.resolve(UNSUPPORTED_STATE)
}

export function requestDailyAppBlockerAuthorization() {
  return (
    nativeModule?.requestAuthorization() ?? Promise.resolve(UNSUPPORTED_STATE)
  )
}

export function setDailyAppBlockerEnabled(enabled: boolean) {
  return nativeModule?.setEnabled(enabled) ?? Promise.resolve(UNSUPPORTED_STATE)
}

export function syncDailyAppBlocker(goalCompleted: boolean, localDate: string) {
  return nativeModule?.sync(goalCompleted, localDate) ?? Promise.resolve()
}
