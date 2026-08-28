Pod::Spec.new do |s|
  s.name = 'PumprDailyAppBlocker'
  s.version = '1.0.0'
  s.summary = 'Screen Time app blocking for pumpr.'
  s.description = 'Blocks user-selected apps until the daily push-up goal is complete.'
  s.author = 'pumpr.'
  s.homepage = 'https://github.com/leocombaret/push-up'
  s.platforms = { :ios => '16.4' }
  s.source = { git: '' }
  s.static_framework = true
  s.swift_version = '5.9'

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'DeviceActivity', 'FamilyControls', 'ManagedSettings', 'SwiftUI'
  s.source_files = 'ios/**/*.{h,m,mm,swift}'

  install_modules_dependencies(s)
end
