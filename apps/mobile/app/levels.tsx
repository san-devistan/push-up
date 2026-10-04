import { ProGate } from "@/features/billing/_components/pro-gate"
import LevelsPage from "@/features/workout/_pages/levels"

export default function LevelsRoute() {
  return (
    <ProGate>
      <LevelsPage />
    </ProGate>
  )
}
