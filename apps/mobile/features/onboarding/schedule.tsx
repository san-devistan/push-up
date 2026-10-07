import { SolidBellIcon } from "@/components/icons"
import { TimePicker, type TimeValue } from "@/components/ui/time-picker"
import { usePreferences } from "@/features/preferences/_hooks/use-preferences"
import { usePlan } from "@/features/workout/_hooks/use-plan"
import { formatClock } from "@/features/workout/_lib/format"
import type { TrainingPlan } from "@/features/workout/_lib/storage"
import { useI18n } from "@/hooks/use-i18n"
import { hapticFeedback } from "@/lib/haptics"
import { Switch, Text } from "panelui-native"
import { useState } from "react"
import { StyleSheet, View } from "react-native"

const DEFAULT_TRAINING_TIME = { hour: 18, minute: 30 }
const styles = StyleSheet.create({
  time: { fontSize: 96, lineHeight: 120 },
})

function getChangeTime(
  plan: TrainingPlan,
  updatePlan: (patch: Partial<TrainingPlan>) => void
) {
  return (time: TimeValue) =>
    updatePlan({ reminderTimes: [time, ...plan.reminderTimes.slice(1)] })
}

function getSetReminderEnabled(
  updatePlan: (patch: Partial<TrainingPlan>) => void
) {
  return (reminderEnabled: boolean) => {
    hapticFeedback(reminderEnabled ? "toggle-on" : "toggle-off")
    updatePlan({ reminderEnabled })
  }
}

export default function ScheduleStep() {
  const { clockFormat } = usePreferences()
  const { locale, t } = useI18n()
  const { plan, updatePlan } = usePlan()
  const time = plan.reminderTimes[0] ?? DEFAULT_TRAINING_TIME
  const [previewTime, setPreviewTime] = useState(time)
  const setReminderEnabled = getSetReminderEnabled(updatePlan)

  return (
    <View className="flex-1 gap-8">
      <View className="gap-3">
        <Text className="font-heading text-4xl leading-[44px]">
          {t("onboarding.scheduleTitle")}
        </Text>
        <Text className="text-lg text-muted-foreground">
          {t("onboarding.scheduleBody")}
        </Text>
        <View className="flex-row items-center justify-between pt-2">
          <View className="flex-row items-center gap-2">
            <SolidBellIcon size={18} />
            <Text className="font-semibold">{t("plan.notification")}</Text>
          </View>
          <Switch
            onValueChange={setReminderEnabled}
            value={plan.reminderEnabled}
          />
        </View>
      </View>

      <View className="flex-1">
        <View className="flex-1 items-center justify-center">
          <Text
            adjustsFontSizeToFit
            className="text-center font-heading text-foreground tabular-nums"
            numberOfLines={1}
            style={styles.time}
          >
            {formatClock(
              previewTime.hour,
              previewTime.minute,
              locale,
              clockFormat
            )}
          </Text>
        </View>
        <TimePicker
          className="w-full px-1"
          hourCycle={clockFormat === "24" ? 24 : 12}
          layout="ruler"
          locale={locale}
          onPreviewValueChange={setPreviewTime}
          onValueChange={getChangeTime(plan, updatePlan)}
          presentation="inline"
          readout="none"
          value={time}
        />
      </View>
    </View>
  )
}
