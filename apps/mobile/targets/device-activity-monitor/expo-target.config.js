/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = () => ({
  type: "device-activity-monitor",
  name: "DailyAppBlockerMonitor",
  displayName: "pumpr. App Blocker",
  bundleIdentifier: ".daily-app-blocker-monitor",
  deploymentTarget: "16.4",
  frameworks: ["DeviceActivity", "FamilyControls", "ManagedSettings"],
  entitlements: {
    "com.apple.developer.family-controls": true,
    "com.apple.security.application-groups": ["group.com.leocombaret.pumpr"],
  },
})
