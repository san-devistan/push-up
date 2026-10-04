import { usePro } from "@/features/billing/_hooks/use-pro"
import { useI18n } from "@/hooks/use-i18n"
import {
  getDailyAppBlockerState,
  presentDailyAppBlockerPicker,
  requestDailyAppBlockerAuthorization,
  setDailyAppBlockerEnabled,
  type DailyAppBlockerState,
} from "@/modules/daily-app-blocker"
import { useEffect, useState } from "react"
import { Linking } from "react-native"

/**
 * Native rejections arrive as "UnexpectedException: … (at ExpoModulesCore/…swift:90)" — a
 * stack hint, not copy. Those get the translated fallback; a plain JS error keeps its text.
 */
function errorMessage(error: unknown, fallback: string) {
  if (
    !(error instanceof Error) ||
    /\(at [^)]+\.swift:\d+\)/.test(error.message)
  )
    return fallback
  return error.message
}

async function loadState(
  isActive: () => boolean,
  fallback: string,
  setError: (error: string | null) => void,
  setState: (state: DailyAppBlockerState) => void
) {
  try {
    const next = await getDailyAppBlockerState()
    if (isActive()) setState(next)
  } catch (cause) {
    if (isActive()) setError(errorMessage(cause, fallback))
  }
}

type BlockerUpdate = {
  canEnable: boolean
  current: DailyAppBlockerState | null
  fallback: string
  setError: (error: string | null) => void
  setPending: (pending: boolean) => void
  setState: (state: DailyAppBlockerState) => void
}

async function updateEnabled(
  enabled: boolean,
  {
    canEnable,
    current,
    fallback,
    setError,
    setPending,
    setState,
  }: BlockerUpdate
) {
  setPending(true)
  setError(null)
  try {
    let next = current ?? (await getDailyAppBlockerState())
    if (enabled && !canEnable) {
      setState(next)
      return
    }
    if (enabled && next.authorizationStatus !== "approved") {
      next = await requestDailyAppBlockerAuthorization()
    }
    if (!enabled || next.authorizationStatus === "approved") {
      next = await setDailyAppBlockerEnabled(enabled)
    }
    setState(next)
  } catch (cause) {
    setError(errorMessage(cause, fallback))
  } finally {
    setPending(false)
  }
}

/**
 * Ask for Screen Time if needed, then hand over to Apple's own picker sheet.
 * Once Pro is active, the blocker follows the selection: something picked
 * turns it on, an empty selection turns it off. Before Pro, it only saves it.
 */
async function chooseApps({
  canEnable,
  current,
  fallback,
  setError,
  setPending,
  setState,
}: BlockerUpdate) {
  setPending(true)
  setError(null)
  try {
    let next = current ?? (await getDailyAppBlockerState())

    if (next.authorizationStatus !== "approved") {
      next = await requestDailyAppBlockerAuthorization()
    }

    if (next.authorizationStatus === "approved") {
      next = await presentDailyAppBlockerPicker()

      if (canEnable && next.selectedCount > 0 && !next.enabled) {
        next = await setDailyAppBlockerEnabled(true)
      }
      if (next.selectedCount === 0 && next.enabled) {
        next = await setDailyAppBlockerEnabled(false)
      }
    }

    setState(next)
  } catch (cause) {
    setError(errorMessage(cause, fallback))
  } finally {
    setPending(false)
  }
}

export function useAppBlocker() {
  const { t } = useI18n()
  const { isLoading: proLoading, isPro } = usePro()
  const canEnable = !proLoading && isPro
  const errorFallback = t("appBlocker.error")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [state, setState] = useState<DailyAppBlockerState | null>(null)
  const update = {
    canEnable,
    current: state,
    fallback: errorFallback,
    setError,
    setPending,
    setState,
  }

  useEffect(() => {
    let active = true
    void loadState(() => active, errorFallback, setError, setState)
    return () => {
      active = false
    }
  }, [errorFallback])

  const setEnabled = (enabled: boolean) => void updateEnabled(enabled, update)

  return {
    authorize: () =>
      state?.authorizationStatus === "denied"
        ? void Linking.openSettings()
        : void chooseApps(update),
    error,
    pending,
    reload: () => void loadState(() => true, errorFallback, setError, setState),
    setEnabled,
    state,
  }
}

export type AppBlockerController = ReturnType<typeof useAppBlocker>
