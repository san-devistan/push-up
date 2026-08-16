export const MIN_TARGET_REPS = 1
export const MAX_TARGET_REPS = 500

function buildSteps() {
  const steps: number[] = []

  for (let value = MIN_TARGET_REPS; value <= 10; value += 1) {
    steps.push(value)
  }
  for (let value = 15; value <= 100; value += 5) {
    steps.push(value)
  }
  for (let value = 125; value <= MAX_TARGET_REPS; value += 25) {
    steps.push(value)
  }

  return steps
}

export const GOAL_STEPS = buildSteps()
export const LAST_GOAL_INDEX = GOAL_STEPS.length - 1

export function nearestGoalIndex(value: number) {
  let best = 0

  for (const [index, step] of GOAL_STEPS.entries()) {
    if (Math.abs(step - value) < Math.abs((GOAL_STEPS[best] ?? 0) - value)) {
      best = index
    }
  }

  return best
}

export function goalAtIndex(index: number) {
  return GOAL_STEPS[Math.min(LAST_GOAL_INDEX, Math.max(0, index))]
}

export const MAX_TRAINING_TIMES = 6

export function repsPerSession(total: number, sessions: number) {
  return Math.max(1, Math.ceil(total / Math.max(1, sessions)))
}
