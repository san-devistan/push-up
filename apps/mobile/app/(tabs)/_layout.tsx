import { ProGate } from "@/features/billing/_components/pro-gate"
import { Stack } from "expo-router"

export default function HomeLayout() {
  return (
    <ProGate>
      <Stack />
    </ProGate>
  )
}
