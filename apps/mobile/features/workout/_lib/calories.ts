const CALORIES_PER_ATTEMPT = 0.32

export function getEstimatedCalories(attempts: number) {
  // ponytail: fixed estimate until bodyweight/tempo exists in user settings.
  return Math.max(0, attempts) * CALORIES_PER_ATTEMPT
}

export function formatCalories(calories: number) {
  return calories >= 10
    ? `${Math.round(calories).toLocaleString()} kcal`
    : `${calories.toFixed(1)} kcal`
}
