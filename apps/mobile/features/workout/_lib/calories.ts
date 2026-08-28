const CALORIES_PER_REP = 0.32

export function getEstimatedCalories(validReps: number) {
  // ponytail: fixed estimate until bodyweight/tempo exists in user settings.
  return Math.max(0, validReps) * CALORIES_PER_REP
}
