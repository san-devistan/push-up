import DeviceActivity
import ExpoModulesCore
import FamilyControls
import Foundation
import ManagedSettings
import SwiftUI

private struct DailyAppBlockerState: Record {
  @Field var authorizationStatus = "notDetermined"
  @Field var enabled = false
  @Field var selectedCount = 0
}

private enum DailyAppBlockerError: LocalizedError {
  case notAuthorized

  var errorDescription: String? {
    "Screen Time access is required to block apps."
  }
}

private enum DailyAppBlockerStore {
  static let activity = DeviceActivityName("pumpr.daily-goal")
  static let defaults = UserDefaults(suiteName: "group.com.leocombaret.pumpr") ?? .standard
  static let managedSettings = ManagedSettingsStore(named: .init("pumpr.daily-goal"))

  private static let completedDateKey = "dailyAppBlocker.completedDate"
  private static let enabledKey = "dailyAppBlocker.enabled"
  private static let selectionKey = "dailyAppBlocker.selection"

  static func state() -> DailyAppBlockerState {
    let status = authorizationStatus()
    let authorized = status == "approved"
    if !authorized, defaults.bool(forKey: enabledKey) {
      defaults.set(false, forKey: enabledKey)
      DeviceActivityCenter().stopMonitoring([activity])
      clearShields()
    }

    var state = DailyAppBlockerState()
    state.authorizationStatus = status
    state.enabled = authorized && defaults.bool(forKey: enabledKey)
    state.selectedCount = selectedCount(selection())
    return state
  }

  static func authorizationStatus() -> String {
    let status = AuthorizationCenter.shared.authorizationStatus
    if status == .approved {
      return "approved"
    }
    if #available(iOS 26.4, *), status == .approvedWithDataAccess {
      return "approved"
    }
    return status == .denied ? "denied" : "notDetermined"
  }

  static func selection() -> FamilyActivitySelection {
    guard
      let data = defaults.data(forKey: selectionKey),
      let selection = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data)
    else {
      return FamilyActivitySelection()
    }
    return selection
  }

  static func saveSelection(_ selection: FamilyActivitySelection) {
    if let data = try? JSONEncoder().encode(selection) {
      defaults.set(data, forKey: selectionKey)
    }
    applyShields(localDate: currentLocalDate())
  }

  static func selectedCount(_ selection: FamilyActivitySelection) -> Int {
    selection.applicationTokens.count
      + selection.categoryTokens.count
      + selection.webDomainTokens.count
  }

  static func setEnabled(_ enabled: Bool) throws {
    guard !enabled || authorizationStatus() == "approved" else {
      throw DailyAppBlockerError.notAuthorized
    }

    defaults.set(enabled, forKey: enabledKey)

    if enabled {
      try ensureMonitoring()
      applyShields(localDate: currentLocalDate())
    } else {
      DeviceActivityCenter().stopMonitoring([activity])
      clearShields()
    }
  }

  static func sync(goalCompleted: Bool, localDate: String) throws {
    if goalCompleted {
      defaults.set(localDate, forKey: completedDateKey)
    } else {
      defaults.removeObject(forKey: completedDateKey)
    }

    guard defaults.bool(forKey: enabledKey), authorizationStatus() == "approved" else {
      clearShields()
      return
    }

    try ensureMonitoring()
    applyShields(localDate: localDate)
  }

  private static func ensureMonitoring() throws {
    let center = DeviceActivityCenter()
    guard !center.activities.contains(activity) else {
      return
    }

    let schedule = DeviceActivitySchedule(
      intervalStart: DateComponents(hour: 0, minute: 0),
      intervalEnd: DateComponents(hour: 23, minute: 59),
      repeats: true
    )
    try center.startMonitoring(activity, during: schedule)
  }

  private static func applyShields(localDate: String) {
    let shouldShield = defaults.bool(forKey: enabledKey)
      && defaults.string(forKey: completedDateKey) != localDate
    let selection = selection()

    guard shouldShield else {
      clearShields()
      return
    }

    managedSettings.shield.applications = selection.applicationTokens.isEmpty
      ? nil
      : selection.applicationTokens
    managedSettings.shield.applicationCategories = selection.categoryTokens.isEmpty
      ? nil
      : .specific(selection.categoryTokens)
    managedSettings.shield.webDomains = selection.webDomainTokens.isEmpty
      ? nil
      : selection.webDomainTokens
  }

  private static func clearShields() {
    managedSettings.clearAllSettings()
  }

  private static func currentLocalDate() -> String {
    let components = Calendar.current.dateComponents([.year, .month, .day], from: Date())
    return String(
      format: "%04d-%02d-%02d",
      components.year ?? 0,
      components.month ?? 0,
      components.day ?? 0
    )
  }
}

@MainActor
private final class DailyAppBlockerPickerModel: ObservableObject {
  @Published var footerText: String?
  @Published var headerText: String?
  @Published var selection: FamilyActivitySelection {
    didSet {
      DailyAppBlockerStore.saveSelection(selection)
      onSelectionChange?(DailyAppBlockerStore.selectedCount(selection))
    }
  }

  var onSelectionChange: ((Int) -> Void)?

  init() {
    selection = DailyAppBlockerStore.selection()
  }
}

@available(iOS 16.0, *)
private struct DailyAppBlockerPickerContent: View {
  @ObservedObject var model: DailyAppBlockerPickerModel

  var body: some View {
    FamilyActivityPicker(
      headerText: model.headerText,
      footerText: model.footerText,
      selection: $model.selection
    )
  }
}

private final class DailyAppBlockerPickerView: ExpoView {
  let onSelectionChange = EventDispatcher()

  private let model = DailyAppBlockerPickerModel()
  private let hostingController: UIHostingController<DailyAppBlockerPickerContent>

  required init(appContext: AppContext? = nil) {
    hostingController = UIHostingController(
      rootView: DailyAppBlockerPickerContent(model: model)
    )
    super.init(appContext: appContext)

    model.onSelectionChange = { [weak self] selectedCount in
      self?.onSelectionChange(["selectedCount": selectedCount])
    }
    hostingController.view.backgroundColor = .clear
    addSubview(hostingController.view)
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    hostingController.view.frame = bounds
  }

  func setHeaderText(_ text: String?) {
    model.headerText = text
  }

  func setFooterText(_ text: String?) {
    model.footerText = text
  }
}

public final class DailyAppBlockerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PumprDailyAppBlocker")

    AsyncFunction("getState") { () -> DailyAppBlockerState in
      DailyAppBlockerStore.state()
    }.runOnQueue(.main)

    AsyncFunction("requestAuthorization") { () async throws -> DailyAppBlockerState in
      try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
      return DailyAppBlockerStore.state()
    }

    AsyncFunction("setEnabled") { (enabled: Bool) throws -> DailyAppBlockerState in
      try DailyAppBlockerStore.setEnabled(enabled)
      return DailyAppBlockerStore.state()
    }.runOnQueue(.main)

    AsyncFunction("sync") { (goalCompleted: Bool, localDate: String) throws in
      try DailyAppBlockerStore.sync(goalCompleted: goalCompleted, localDate: localDate)
    }.runOnQueue(.main)

    View(DailyAppBlockerPickerView.self) {
      Events("onSelectionChange")

      Prop("headerText") { (view: DailyAppBlockerPickerView, text: String?) in
        view.setHeaderText(text)
      }

      Prop("footerText") { (view: DailyAppBlockerPickerView, text: String?) in
        view.setFooterText(text)
      }
    }
  }
}
