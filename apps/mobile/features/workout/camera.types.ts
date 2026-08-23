export type FaceObservation = {
  frameHeight: number
  frameWidth: number
  height: number
  rollAngle: number
  width: number
  yawAngle: number
}

export type FaceCameraProps = {
  isActive: boolean
  onError: (message: string) => void
  onFace: (face: FaceObservation | null) => void
}
