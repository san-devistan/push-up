import type { SetupFraming, TrainingHint } from "@/features/workout/_lib/setup"
import type { TranslationKey } from "@/lib/i18n"

const REP_EXPRESSIONS = [
  "neutral",
  "joyful-wide",
  "playful-right",
  "surprised-wide-left",
  "joyful-down-right",
] as const

const FRAMING_GUIDANCE = {
  ready: { expression: "skeptical-left", message: "setup.perfect" },
  unknown: { expression: "uneasy-left", message: "setup.noBody" },
} as const satisfies Record<
  SetupFraming,
  { expression: string; message: TranslationKey }
>

const PHONE_GUIDANCE = {
  expression: "angry-brows",
  message: "hint.layPhoneFlat",
} as const satisfies { expression: string; message: TranslationKey }

const TRACKING_GUIDANCE = {
  bodyCamera: FRAMING_GUIDANCE.unknown,
  layPhoneFlat: PHONE_GUIDANCE,
} as const satisfies Record<
  TrainingHint,
  { expression: string; message: TranslationKey }
>

export function getSetupGuidance(
  framing: SetupFraming,
  phoneFlat: boolean | null
) {
  return phoneFlat === false ? PHONE_GUIDANCE : FRAMING_GUIDANCE[framing]
}

export function getRepExpression(validReps: number) {
  return REP_EXPRESSIONS[validReps % REP_EXPRESSIONS.length]
}

export function getTrackingGuidance(hint: TrainingHint | null) {
  return hint === null ? null : TRACKING_GUIDANCE[hint]
}
