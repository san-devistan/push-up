import { playSfx, type SfxCue } from "@/lib/sfx"
import * as Haptics from "expo-haptics"

function vibrateHard() {
  if (process.env.EXPO_OS === "ios") {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
  } else if (process.env.EXPO_OS === "android") {
    void Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Long_Press)
  }
}

export function hapticFeedback(cue: SfxCue, soundEnabled?: boolean) {
  vibrateHard()
  playSfx(cue, soundEnabled)
}

export function hapticHard() {
  hapticFeedback("press")
}

export function hapticSuccess() {
  hapticFeedback("success")
}

export function hapticOpen() {
  hapticFeedback("open")
}

export function selectionTick() {
  vibrateHard()
}
