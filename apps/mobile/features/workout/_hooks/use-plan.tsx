import {
  syncDailyReminder,
  type ReminderState,
} from "@/features/workout/_lib/reminders"
import {
  loadPlan,
  normalizeTrainingTimes,
  savePlan,
  type TrainingPlan,
} from "@/features/workout/_lib/storage"
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
  prompt: boolean,
  setPlan: React.Dispatch<React.SetStateAction<TrainingPlan>>,
  setReminderState: React.Dispatch<React.SetStateAction<ReminderState>>
) {
  const next = {
    ...patched,
    reminderTimes: normalizeTrainingTimes(patched.reminderTimes),
  }

  setPlan(next)
  savePlan(next)
  void syncDailyReminder(next, prompt).then(setReminderState)
}

function getEnableReminders(
  plan: TrainingPlan,
  setPlan: React.Dispatch<React.SetStateAction<TrainingPlan>>,
  setReminderState: React.Dispatch<React.SetStateAction<ReminderState>>
) {
  return () =>
    applyPlan(
      { ...plan, reminderEnabled: true },
      true,
      setPlan,
      setReminderState
    )
}

function getUpdatePlan(
  plan: TrainingPlan,
  setPlan: React.Dispatch<React.SetStateAction<TrainingPlan>>,
  setReminderState: React.Dispatch<React.SetStateAction<ReminderState>>
) {
  return (patch: Partial<TrainingPlan>) =>
    applyPlan(
      { ...plan, ...patch },
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
  const [plan, setPlan] = React.useState(loadPlan)
  const [reminderState, setReminderState] =
    React.useState<ReminderState>("denied")

  React.useEffect(() => {
    void syncDailyReminder(loadPlan()).then(setReminderState)
  }, [])

  const enableReminders = getEnableReminders(plan, setPlan, setReminderState)
  const updatePlan = getUpdatePlan(plan, setPlan, setReminderState)
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
