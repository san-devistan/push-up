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
  case noPresenter

  var errorDescription: String? {
    switch self {
    case .notAuthorized:
      return "Screen Time access is required to block apps."
    case .noPresenter:
      return "The app picker could not be opened."
    }
  }
}

@MainActor
private func topViewController() -> UIViewController? {
  let window = UIApplication.shared.connectedScenes
    .compactMap { $0 as? UIWindowScene }
    .flatMap(\.windows)
    .first { $0.isKeyWindow }
  var top = window?.rootViewController

  while let presented = top?.presentedViewController {
    top = presented
  }

  return top
}

private enum DailyAppBlockerStore {
  static let activity = DeviceActivityName("pumpr.daily-goal")
  static let defaults = UserDefaults(suiteName: "group.com.rukahiga.pumpr") ?? .standard
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

/// Drives Apple's own picker sheet. The picker is a SwiftUI modifier, so it
/// needs a host in the view hierarchy; the host itself stays invisible and is
/// torn down once the sheet closes.
@MainActor
private final class FamilyPickerPresenter: ObservableObject {
  @Published var isPresented = true
  @Published var selection: FamilyActivitySelection
  private var onFinish: ((FamilyActivitySelection) -> Void)?

  init(
    selection: FamilyActivitySelection,
    onFinish: @escaping (FamilyActivitySelection) -> Void
  ) {
    self.selection = selection
    self.onFinish = onFinish
  }

  func finish() {
    guard let onFinish else {
      return
    }

    self.onFinish = nil
    onFinish(selection)
  }
}

@available(iOS 16.0, *)
private struct FamilyPickerSheet: View {
  @ObservedObject var presenter: FamilyPickerPresenter

  var body: some View {
    Color.clear.familyActivityPicker(
      isPresented: Binding(
        get: { presenter.isPresented },
        set: { presented in
          presenter.isPresented = presented
          if !presented {
            presenter.finish()
          }
        }
      ),
      selection: $presenter.selection
    )
  }
}

public final class DailyAppBlockerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PumprDailyAppBlocker")

    AsyncFunction("getState") { () -> DailyAppBlockerState in
      DailyAppBlockerStore.state()
    }.runOnQueue(.main)

    AsyncFunction("requestAuthorization") { () async throws -> DailyAppBlockerState in
      // The Screen Time consent sheet is UI: request it on the main actor,
      // otherwise the call can resolve without ever presenting the prompt.
      do {
        try await Task { @MainActor in
          try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
        }.value
      } catch FamilyControlsError.authorizationCanceled {
        // The user closed the sheet. That is an answer, not a failure: the returned state
        // says "not authorized" and the screen keeps offering the button.
      }
      return await MainActor.run { DailyAppBlockerStore.state() }
    }

    AsyncFunction("presentPicker") { () async throws -> DailyAppBlockerState in
      try await withCheckedThrowingContinuation { continuation in
        Task { @MainActor in
          guard let presentingController = topViewController() else {
            continuation.resume(throwing: DailyAppBlockerError.noPresenter)
            return
          }

          var host: UIHostingController<FamilyPickerSheet>?
          let presenter = FamilyPickerPresenter(
            selection: DailyAppBlockerStore.selection()
          ) { selection in
            DailyAppBlockerStore.saveSelection(selection)
            let state = DailyAppBlockerStore.state()
            // Let Apple's sheet finish its own dismissal before the invisible
            // host goes away, otherwise the transition stutters.
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
              host?.presentingViewController?.dismiss(animated: false)
              continuation.resume(returning: state)
            }
          }

          let controller = UIHostingController(
            rootView: FamilyPickerSheet(presenter: presenter)
          )
          host = controller
          controller.view.backgroundColor = .clear
          controller.modalPresentationStyle = .overFullScreen
          presentingController.present(controller, animated: false)
        }
      }
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
