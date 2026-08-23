export const MIN_TARGET_REPS = 1
export const MAX_TARGET_REPS = 200

export function normalizeTargetReps(value: number) {
  return Math.min(MAX_TARGET_REPS, Math.max(MIN_TARGET_REPS, value))
}

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

/**
 * The line of context under today's count: how far past the goal, or how the
 * day stands against yesterday. Null when there is nothing worth saying — the
 * goal just met, or no yesterday to compare with.
 */
export function getDailyPace(reps: number, target: number, yesterday: number) {
  if (reps > target) {
    return { delta: reps - target, over: true }
  }
  if (reps === target || yesterday === 0) {
    return null
  }

  return { delta: reps - yesterday, over: false }
}

export const MAX_TRAINING_TIMES = 6

export function repsPerSession(total: number, sessions: number) {
  return Math.max(1, Math.ceil(total / Math.max(1, sessions)))
}
