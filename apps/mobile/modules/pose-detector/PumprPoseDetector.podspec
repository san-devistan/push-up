Pod::Spec.new do |s|
  s.name           = 'PumprPoseDetector'
  s.version        = '1.0.0'
  s.summary        = 'Google ML Kit pose detection for pumpr.'
  s.description    = 'On-device pose landmarks for the workout camera.'
  s.author         = 'pumpr.'
  s.homepage       = 'https://github.com/leocombaret/push-up'
  s.platforms      = { :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true
  s.swift_version = '5.9'

  s.dependency 'GoogleMLKit/PoseDetection', '9.0.0'
  s.dependency 'React-callinvoker'
  s.dependency 'React-jsi'
  s.dependency 'VisionCamera'

  s.source_files = 'ios/**/*.{h,m,mm,swift,hpp,cpp}'

  load 'nitrogen/generated/ios/PumprPoseDetector+autolinking.rb'
  add_nitrogen_files(s)

  install_modules_dependencies(s)
end
