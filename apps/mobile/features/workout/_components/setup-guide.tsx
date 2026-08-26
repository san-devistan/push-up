import { SpeechBubble } from "@/components/speech-bubble"
import type { PhoneInclinationDisplay } from "@/features/workout/_hooks/use-phone-inclination"
import { getSetupGuidance } from "@/features/workout/_lib/guidance"
import type { SetupFraming } from "@/features/workout/_lib/setup"
import { useI18n } from "@/hooks/use-i18n"
import { StyleSheet, View } from "react-native"

import WorkoutAvatar from "./avatar"

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
  const guidance = getSetupGuidance(
    framing,
    phone.type === "available" ? phone.flat : null
  )

  return (
    <View pointerEvents="none" style={styles.root}>
      <View style={styles.avatarFrame}>
        <WorkoutAvatar
          dom={AVATAR_DOM_PROPS}
          expression={guidance.expression}
        />
        <SpeechBubble className="absolute top-1 -right-3">
          {t(guidance.message)}
        </SpeechBubble>
      </View>
    </View>
  )
}
