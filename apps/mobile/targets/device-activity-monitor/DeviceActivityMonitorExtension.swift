
import DeviceActivity
import FamilyControls
import Foundation
import ManagedSettings

final class DeviceActivityMonitorExtension: DeviceActivityMonitor {
  private let defaults = UserDefaults(suiteName: "group.com.leocombaret.pumpr")
  private let store = ManagedSettingsStore(named: .init("pumpr.daily-goal"))

  override func intervalDidStart(for activity: DeviceActivityName) {
    super.intervalDidStart(for: activity)
    applyShields()
  }

  private func applyShields() {
    guard
      defaults?.bool(forKey: "dailyAppBlocker.enabled") == true,
      defaults?.string(forKey: "dailyAppBlocker.completedDate") != localDate(),
      let data = defaults?.data(forKey: "dailyAppBlocker.selection"),
      let selection = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data)
    else {
      store.clearAllSettings()
      return
    }

    store.shield.applications = selection.applicationTokens.isEmpty
      ? nil
      : selection.applicationTokens
    store.shield.applicationCategories = selection.categoryTokens.isEmpty
      ? nil
      : .specific(selection.categoryTokens)
    store.shield.webDomains = selection.webDomainTokens.isEmpty
      ? nil
      : selection.webDomainTokens
  }

  private func localDate() -> String {
    let components = Calendar.current.dateComponents([.year, .month, .day], from: Date())
    return String(
      format: "%04d-%02d-%02d",
      components.year ?? 0,
      components.month ?? 0,
      components.day ?? 0
    )
  }
}
