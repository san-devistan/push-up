import { ProGate } from "@/features/billing/_components/pro-gate"
import SessionPage from "@/features/workout/_pages/session"

export default function SessionRoute() {
  return (
    <ProGate>
      <SessionPage />
    </ProGate>
  )
}
