import * as Haptics from "expo-haptics"

export function hapticHard() {
  if (process.env.EXPO_OS === "ios") {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
  } else if (process.env.EXPO_OS === "android") {
    void Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Long_Press)
  }
}

export const hapticSuccess = hapticHard
export const hapticFailure = hapticHard
export const impactKnock = hapticHard
export const selectionTick = hapticHard
