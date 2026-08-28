import type { TrainingHint } from "@/features/workout/_lib/setup"
import type { TranslationKey } from "@/lib/i18n"

const REP_EXPRESSIONS = [
  "neutral",
  "joyful-wide",
  "playful-right",
  "surprised-wide-left",
  "joyful-down-right",
] as const

const PHONE_GUIDANCE = {
  expression: "angry-brows",
  message: "hint.layPhoneFlat",
} as const satisfies { expression: string; message: TranslationKey }

const TRACKING_GUIDANCE = {
  bodyCamera: { expression: "uneasy-left", message: "setup.noBody" },
  layPhoneFlat: PHONE_GUIDANCE,
} as const satisfies Record<
  TrainingHint,
  { expression: string; message: TranslationKey }
>

export function getRepExpression(validReps: number) {
  return REP_EXPRESSIONS[validReps % REP_EXPRESSIONS.length]
}

export function getTrackingGuidance(hint: TrainingHint | null) {
  return hint === null ? null : TRACKING_GUIDANCE[hint]
}
