import { ProGate } from "@/features/billing/_components/pro-gate"
import SettingsPage from "@/features/workout/_pages/settings"

export default function SettingsRoute() {
  return (
    <ProGate>
      <SettingsPage />
    </ProGate>
  )
}
