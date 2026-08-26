import type { Activity } from "@/features/workout/_lib/activity"
import type { WorkoutSession } from "@/features/workout/_lib/storage"
import { createContext, use, useState, type ReactNode } from "react"

export type RecapState =
  | { type: "idle" }
  | {
      before: Activity | undefined
      session: WorkoutSession
      type: "presenting"
    }
  | { activity: Activity; type: "revealed" }

type RecapContextValue = {
  reveal: (activity: Activity) => void
  settle: () => void
  show: (session: WorkoutSession, before: Activity | undefined) => void
  state: RecapState
}

const RecapContext = createContext<RecapContextValue | null>(null)
const IDLE_RECAP = { type: "idle" } as const

function getRecapContextValue(
  state: RecapState,
  setState: (state: RecapState) => void
): RecapContextValue {
  return {
    reveal: (activity) => setState({ activity, type: "revealed" }),
    settle: () => setState(IDLE_RECAP),
    show: (session, before) =>
      setState({ before, session, type: "presenting" }),
    state,
  }
}

export function RecapProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RecapState>(IDLE_RECAP)
  const value = getRecapContextValue(state, setState)

  return <RecapContext.Provider value={value}>{children}</RecapContext.Provider>
}

export function useRecap() {
  const value = use(RecapContext)

  if (!value) {
    throw new Error("useRecap must be used inside RecapProvider")
  }

  return value
}
