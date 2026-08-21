import { usePreferences } from "@/features/preferences/_hooks/use-preferences"
import {
  syncDailyReminder,
  type ReminderState,
} from "@/features/workout/_lib/reminders"
import {
  loadPlan,
  normalizeTrainingPlan,
  savePlan,
  type TrainingPlan,
} from "@/features/workout/_lib/storage"
import type { Language } from "@/lib/i18n"
import * as React from "react"

type PlanContextValue = {
  enableReminders: () => void
  plan: TrainingPlan
  reminderState: ReminderState
  updatePlan: (patch: Partial<TrainingPlan>) => void
}

const PlanContext = React.createContext<PlanContextValue | null>(null)

function applyPlan(
  patched: TrainingPlan,
  language: Language,
  prompt: boolean,
  setPlan: React.Dispatch<React.SetStateAction<TrainingPlan>>,
  setReminderState: React.Dispatch<React.SetStateAction<ReminderState>>
) {
  const next = normalizeTrainingPlan(patched)

  setPlan(next)
  savePlan(next)
  void syncDailyReminder(next, language, prompt).then(setReminderState)
}

function getEnableReminders(
  language: Language,
  plan: TrainingPlan,
  setPlan: React.Dispatch<React.SetStateAction<TrainingPlan>>,
  setReminderState: React.Dispatch<React.SetStateAction<ReminderState>>
) {
  return () =>
    applyPlan(
      { ...plan, reminderEnabled: true },
      language,
      true,
      setPlan,
      setReminderState
    )
}

function getUpdatePlan(
  language: Language,
  plan: TrainingPlan,
  setPlan: React.Dispatch<React.SetStateAction<TrainingPlan>>,
  setReminderState: React.Dispatch<React.SetStateAction<ReminderState>>
) {
  return (patch: Partial<TrainingPlan>) =>
    applyPlan(
      { ...plan, ...patch },
      language,
      patch.reminderEnabled === true,
      setPlan,
      setReminderState
    )
}

function getPlanContextValue(
  enableReminders: () => void,
  plan: TrainingPlan,
  reminderState: ReminderState,
  updatePlan: (patch: Partial<TrainingPlan>) => void
) {
  return { enableReminders, plan, reminderState, updatePlan }
}

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const { language } = usePreferences()
  const [plan, setPlan] = React.useState(loadPlan)
  const [reminderState, setReminderState] =
    React.useState<ReminderState>("denied")

  React.useEffect(() => {
    void syncDailyReminder(loadPlan(), language).then(setReminderState)
  }, [language])

  const enableReminders = getEnableReminders(
    language,
    plan,
    setPlan,
    setReminderState
  )
  const updatePlan = getUpdatePlan(language, plan, setPlan, setReminderState)
  const value = getPlanContextValue(
    enableReminders,
    plan,
    reminderState,
    updatePlan
  )

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>
}

export function usePlan() {
  const value = React.use(PlanContext)

  if (!value) {
    throw new Error("usePlan must be used inside PlanProvider")
  }

  return value
}
