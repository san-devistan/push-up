import { repsPerSession } from "@/features/workout/_lib/goal"
import type { TrainingPlan } from "@/features/workout/_lib/storage"
import * as Notifications from "expo-notifications"
import { Platform } from "react-native"

const CHANNEL_ID = "daily-training"

export type ReminderState = "ask" | "denied" | "off" | "on" | "unsupported"

const isSupported = Platform.OS === "android" || Platform.OS === "ios"

Notifications.setNotificationHandler({
  handleNotification: () =>
    Promise.resolve({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
})

async function ensureChannel() {
  if (Platform.OS !== "android") {
    return
  }

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    importance: Notifications.AndroidImportance.HIGH,
    name: "Daily training",
  })
}

async function permission(prompt: boolean) {
  const current = await Notifications.getPermissionsAsync()

  if (current.granted) {
    return "on" as const
  }

  if (!prompt) {
    return current.canAskAgain ? ("ask" as const) : ("denied" as const)
  }

  const requested = await Notifications.requestPermissionsAsync()

  if (requested.granted) {
    return "on" as const
  }

  return requested.canAskAgain ? ("ask" as const) : ("denied" as const)
}

async function reschedule(
  plan: TrainingPlan,
  prompt: boolean
): Promise<ReminderState> {
  if (!isSupported) {
    return "unsupported"
  }

  await Notifications.cancelAllScheduledNotificationsAsync()

  if (!plan.reminderEnabled) {
    return "off"
  }

  const granted = await permission(prompt)

  if (granted !== "on") {
    return granted
  }

  await ensureChannel()
  const reps = repsPerSession(plan.targetReps, plan.reminderTimes.length)

  await Promise.all(
    plan.reminderTimes.map((time) =>
      Notifications.scheduleNotificationAsync({
        content: {
          body: `${reps} push-ups. Keep the streak alive.`,
          title: "Time to train",
        },
        trigger: {
          channelId: CHANNEL_ID,
          hour: time.hour,
          minute: time.minute,
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
        },
      })
    )
  )

  return "on"
}

let pending: Promise<ReminderState> = Promise.resolve("off")

export function syncDailyReminder(plan: TrainingPlan, prompt = false) {
  pending = pending
    .catch(() => "off" as const)
    .then(() => reschedule(plan, prompt))

  return pending
}
