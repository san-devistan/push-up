import AVFoundation
import Foundation
import ImageIO
import NitroModules
import Vision
import VisionCamera

final class AppleFaceDetector: HybridAppleFaceDetectorSpec {
  private let lock = NSLock()
  private var detectedFace: DetectedFace?
  private var detectionError: String?

  var face: DetectedFace? {
    lock.lock()
    defer { lock.unlock() }
    return detectedFace
  }

  var error: String? {
    lock.lock()
    defer { lock.unlock() }
    return detectionError
  }

  func processFrame(frame: any HybridFrameSpec) throws {
    guard
      let nativeFrame = frame as? any NativeFrame,
      let sampleBuffer = nativeFrame.sampleBuffer,
      let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer)
    else {
      update(face: nil, error: "Face detector could not read the camera frame.")
      return
    }

    let request = VNDetectFaceRectanglesRequest()
    let handler = VNImageRequestHandler(
      cvPixelBuffer: pixelBuffer,
      orientation: Self.cgOrientation(
        orientation: frame.orientation,
        isMirrored: frame.isMirrored
      ),
      options: [:]
    )

    do {
      try handler.perform([request])
      guard let result = request.results, result.count == 1, let observation = result.first else {
        update(face: nil, error: nil)
        return
      }

      let frameWidth = Double(CVPixelBufferGetWidth(pixelBuffer))
      let frameHeight = Double(CVPixelBufferGetHeight(pixelBuffer))
      let bounds = observation.boundingBox
      let radiansToDegrees = 180.0 / Double.pi

      update(
        face: DetectedFace(
          frameHeight: frameHeight,
          frameWidth: frameWidth,
          height: Double(bounds.height) * frameHeight,
          rollAngle: (observation.roll?.doubleValue ?? 0) * radiansToDegrees,
          width: Double(bounds.width) * frameWidth,
          yawAngle: (observation.yaw?.doubleValue ?? 0) * radiansToDegrees
        ),
        error: nil
      )
    } catch {
      update(face: nil, error: error.localizedDescription)
    }
  }

  func reset() throws {
    update(face: nil, error: nil)
  }

  private func update(face: DetectedFace?, error: String?) {
    lock.lock()
    detectedFace = face
    detectionError = error
    lock.unlock()
  }

  private static func cgOrientation(
    orientation: CameraOrientation,
    isMirrored: Bool
  ) -> CGImagePropertyOrientation {
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
