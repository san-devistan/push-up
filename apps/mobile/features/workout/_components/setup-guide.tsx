import { SpeechBubble } from "@/components/speech-bubble"
import type { PhoneInclinationDisplay } from "@/features/workout/_hooks/use-phone-inclination"
import type { SetupFraming } from "@/features/workout/_lib/setup"
import { useI18n } from "@/hooks/use-i18n"
import type { TranslationKey } from "@/lib/i18n"
import { StyleSheet, View } from "react-native"

import WorkoutAvatar from "./avatar.dom"

type Guidance = {
  expression: Parameters<typeof WorkoutAvatar>[0]["expression"]
  message: TranslationKey
}

const FRAMING_GUIDANCE = {
  close: { expression: "suspicious-right", message: "setup.tooClose" },
  far: { expression: "suspicious-right", message: "setup.tooFar" },
  "off-center": {
    expression: "far-right-glance",
    message: "setup.reposition",
  },
  ready: { expression: "eyes-closed", message: "setup.perfect" },
  unknown: { expression: "shy-downward", message: "setup.noFace" },
} as const satisfies Record<SetupFraming, Guidance>

const PHONE_GUIDANCE = {
  expression: "skeptical-left",
  message: "hint.layPhoneFlat",
} as const satisfies Guidance

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: "transparent",
    height: 264,
    width: 264,
  },
  avatarFrame: { height: 264, width: 264 },
  root: {
    alignItems: "center",
    bottom: 104,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 64,
  },
})

const AVATAR_DOM_PROPS = {
  scrollEnabled: false,
  style: styles.avatar,
}

export default function SetupGuide({
  framing,
  phone,
}: {
  framing: SetupFraming
  phone: PhoneInclinationDisplay
}) {
  const { t } = useI18n()
  const guidance =
    framing !== "unknown" && phone.type === "available" && !phone.flat
      ? PHONE_GUIDANCE
      : FRAMING_GUIDANCE[framing]

  return (
    <View pointerEvents="none" style={styles.root}>
      <View style={styles.avatarFrame}>
        <WorkoutAvatar
          dom={AVATAR_DOM_PROPS}
          expression={guidance.expression}
        />
        <SpeechBubble className="absolute top-1 -right-3 max-w-52">
          {t(guidance.message)}
        </SpeechBubble>
      </View>
    </View>
  )
}
