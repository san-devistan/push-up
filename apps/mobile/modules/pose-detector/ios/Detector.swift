import AVFoundation
import Foundation
import MLImage
import MLKitPoseDetection
import MLKitVision
import NitroModules
import UIKit
import VisionCamera

final class PumprPoseDetector: HybridPumprPoseDetectorSpec {
  private static let landmarkTypes: [PoseLandmarkType] = [
    .nose,
    .leftEyeInner,
    .leftEye,
    .leftEyeOuter,
    .rightEyeInner,
    .rightEye,
    .rightEyeOuter,
    .leftEar,
    .rightEar,
    .mouthLeft,
    .mouthRight,
    .leftShoulder,
    .rightShoulder,
    .leftElbow,
    .rightElbow,
    .leftWrist,
    .rightWrist,
    .leftPinkyFinger,
    .rightPinkyFinger,
    .leftIndexFinger,
    .rightIndexFinger,
    .leftThumb,
    .rightThumb,
    .leftHip,
    .rightHip,
    .leftKnee,
    .rightKnee,
    .leftAnkle,
    .rightAnkle,
    .leftHeel,
    .rightHeel,
    .leftToe,
    .rightToe,
  ]

  private let detector: PoseDetector
  private let lock = NSLock()
  private var detectedLandmarks: [DetectedLandmark] = []
  private var detectionError: String?

  override init() {
    let options = PoseDetectorOptions()
    options.detectorMode = .stream
    detector = PoseDetector.poseDetector(options: options)
    super.init()
  }

  var error: String? {
    lock.lock()
    defer { lock.unlock() }
    return detectionError
  }

  var landmarks: [DetectedLandmark] {
    lock.lock()
    defer { lock.unlock() }
    return detectedLandmarks
  }

  func processFrame(frame: any HybridFrameSpec) throws {
    guard
      let nativeFrame = frame as? any NativeFrame,
      let sampleBuffer = nativeFrame.sampleBuffer,
      let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer),
      let image = MLImage(sampleBuffer: sampleBuffer)
    else {
      update(landmarks: [], error: "Pose detector could not read the camera frame.")
      return
    }

    image.orientation = Self.imageOrientation(
      orientation: frame.orientation,
      isMirrored: frame.isMirrored
    )

    let semaphore = DispatchSemaphore(value: 0)
    var detectedPoses: [Pose] = []
    var detectedError: Error?

    detector.process(image) { poses, error in
      detectedPoses = poses ?? []
      detectedError = error
      semaphore.signal()
    }
    semaphore.wait()

    if let detectedError {
      update(landmarks: [], error: detectedError.localizedDescription)
      return
    }

    guard detectedPoses.count == 1, let pose = detectedPoses.first else {
      update(landmarks: [], error: nil)
      return
    }

    let rotated = frame.orientation == .left || frame.orientation == .right
    let frameWidth = Double(
      rotated ? CVPixelBufferGetHeight(pixelBuffer) : CVPixelBufferGetWidth(pixelBuffer)
    )
    let frameHeight = Double(
      rotated ? CVPixelBufferGetWidth(pixelBuffer) : CVPixelBufferGetHeight(pixelBuffer)
    )
    let landmarks = Self.landmarkTypes.map { type in
      let landmark = pose.landmark(ofType: type)
      return DetectedLandmark(
        visibility: Double(landmark.inFrameLikelihood),
        x: Double(landmark.position.x) / frameWidth,
        y: Double(landmark.position.y) / frameHeight,
        z: Double(landmark.position.z)
      )
    }

    update(landmarks: landmarks, error: nil)
  }

  func reset() throws {
    update(landmarks: [], error: nil)
  }

  private func update(landmarks: [DetectedLandmark], error: String?) {
    lock.lock()
    detectedLandmarks = landmarks
    detectionError = error
    lock.unlock()
  }

  private static func imageOrientation(
    orientation: CameraOrientation,
    isMirrored: Bool
  ) -> UIImage.Orientation {
    switch orientation {
    case .up:
      return isMirrored ? .upMirrored : .up
    case .down:
      return isMirrored ? .downMirrored : .down
    case .left:
      return isMirrored ? .rightMirrored : .left
    case .right:
      return isMirrored ? .leftMirrored : .right
    @unknown default:
      return .up
    }
  }
}
