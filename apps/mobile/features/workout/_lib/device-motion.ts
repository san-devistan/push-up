import { requireOptionalNativeModule } from "expo"
import type { DeviceMotionSensor } from "expo-sensors/build/DeviceMotion"

export async function loadDeviceMotion(): Promise<DeviceMotionSensor | null> {
  if (!requireOptionalNativeModule("ExponentDeviceMotion")) return null

  return (await import("expo-sensors")).DeviceMotion
}
