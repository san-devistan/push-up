import { usePreferences } from "@/features/preferences/_hooks/use-preferences"
import {
  formatNumber,
  LOCALE_TAGS,
  translate,
  type TranslationKey,
  type TranslationParams,
} from "@/lib/i18n"

export function useI18n() {
  const { language } = usePreferences()

  return {
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) =>
      formatNumber(language, value, options),
    language,
    locale: LOCALE_TAGS[language],
    t: (key: TranslationKey, params?: TranslationParams) =>
      translate(language, key, params),
  }
}
