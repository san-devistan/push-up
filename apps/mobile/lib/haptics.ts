import * as Haptics from "expo-haptics"

export function hapticHard() {
  if (process.env.EXPO_OS === "ios") {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
  } else if (process.env.EXPO_OS === "android") {
    void Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Long_Press)
  }
}

export function hapticSuccess() {
  if (process.env.EXPO_OS === "ios") {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  } else if (process.env.EXPO_OS === "android") {
    void Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm)
  }
}

export function hapticFailure() {
  if (process.env.EXPO_OS === "ios") {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
  } else if (process.env.EXPO_OS === "android") {
    void Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Reject)
  }
}
