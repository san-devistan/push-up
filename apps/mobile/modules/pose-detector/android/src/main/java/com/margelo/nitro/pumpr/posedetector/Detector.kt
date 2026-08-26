package com.margelo.nitro.pumpr.posedetector

import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.pose.PoseDetection
import com.google.mlkit.vision.pose.defaults.PoseDetectorOptions
import com.margelo.nitro.camera.HybridFrameSpec
import com.margelo.nitro.camera.public.NativeFrame
import java.util.concurrent.TimeUnit

@Keep
@DoNotStrip
class PumprPoseDetector : HybridPumprPoseDetectorSpec() {
  private val detector = PoseDetection.getClient(
    PoseDetectorOptions.Builder()
      .setDetectorMode(PoseDetectorOptions.STREAM_MODE)
      .build()
  )
  private val lock = Any()
  private var detectedLandmarks: Array<DetectedLandmark> = emptyArray()
  private var detectionError: String? = null

  override val error: String?
    get() = synchronized(lock) { detectionError }

  override val landmarks: Array<DetectedLandmark>
    get() = synchronized(lock) { detectedLandmarks.copyOf() }

  override fun processFrame(frame: HybridFrameSpec) {
    val nativeFrame = frame as? NativeFrame
    val imageProxy = nativeFrame?.image
    val mediaImage = imageProxy?.image

    if (imageProxy == null || mediaImage == null) {
      update(emptyArray(), "Pose detector could not read the camera frame.")
      return
    }

    try {
      val rotation = imageProxy.imageInfo.rotationDegrees
      val image = InputImage.fromMediaImage(mediaImage, rotation)
      val pose = Tasks.await(detector.process(image), 200, TimeUnit.MILLISECONDS)
      val rotated = rotation == 90 || rotation == 270
      val frameWidth = (if (rotated) mediaImage.height else mediaImage.width).toDouble()
      val frameHeight = (if (rotated) mediaImage.width else mediaImage.height).toDouble()
      val landmarks = Array(33) {
        DetectedLandmark(visibility = 0.0, x = 0.0, y = 0.0, z = 0.0)
      }

      for (landmark in pose.allPoseLandmarks) {
        val index = landmark.landmarkType
        if (index !in landmarks.indices) continue

        landmarks[index] = DetectedLandmark(
          visibility = landmark.inFrameLikelihood.toDouble(),
          x = (landmark.position3D.x / frameWidth).coerceIn(0.0, 1.0),
          y = (landmark.position3D.y / frameHeight).coerceIn(0.0, 1.0),
          z = landmark.position3D.z.toDouble()
        )
      }

      update(landmarks, null)
    } catch (error: Exception) {
      update(emptyArray(), error.message ?: "Pose detection failed.")
    }
  }

  override fun reset() {
    update(emptyArray(), null)
  }

  private fun update(landmarks: Array<DetectedLandmark>, error: String?) {
    synchronized(lock) {
      detectedLandmarks = landmarks
      detectionError = error
    }
  }
}
