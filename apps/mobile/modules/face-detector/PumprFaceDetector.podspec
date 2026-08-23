Pod::Spec.new do |s|
  s.name           = 'PumprFaceDetector'
  s.version        = '1.0.0'
  s.summary        = 'Apple Vision face detection for pumpr.'
  s.description    = 'On-device face observations for the iOS workout camera.'
  s.author         = 'pumpr.'
  s.homepage       = 'https://github.com/leocombaret/push-up'
  s.platforms      = { :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true
  s.swift_version = '5.9'

  s.frameworks = ['AVFoundation', 'Vision']
  s.dependency 'React-callinvoker'
  s.dependency 'React-jsi'
  s.dependency 'VisionCamera'

  s.source_files = 'ios/**/*.{h,m,mm,swift,hpp,cpp}'

  load 'nitrogen/generated/ios/PumprFaceDetector+autolinking.rb'
  add_nitrogen_files(s)

  install_modules_dependencies(s)
end
