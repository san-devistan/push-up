import { NumericText } from "@/components/numeric-text"
import ScheduleStep from "@/features/onboarding/schedule"
import { completeOnboarding } from "@/features/onboarding/storage"
import { ConnectProviders } from "@/features/workout/_components/connect"
import { Slab } from "@/features/workout/_components/figures"
import GoalSlider from "@/features/workout/_components/goal-slider"
import { usePlan } from "@/features/workout/_hooks/use-plan"
import type { PoseLandmark } from "@/features/workout/_lib/counter"
import type { TrainingPlan } from "@/features/workout/_lib/storage"
import PoseCamera from "@/features/workout/camera"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "expo-router"
import {
  Button,
  CheckIcon,
  ChevronLeftIcon,
  ShieldCheckIcon,
  SparklesIcon,
  Text,
} from "panelui-native"
import { useState, type Dispatch, type SetStateAction } from "react"
import { ScrollView, StyleSheet, View } from "react-native"
import Animated, {
  FadeIn,
  FadeInRight,
  FadeOutLeft,
  ReduceMotion,
} from "react-native-reanimated"
import { SafeAreaView } from "react-native-safe-area-context"
import { useCSSVariable } from "uniwind"

const STEP_COUNT = 4
const GOAL_PRESETS = [10, 20, 30, 50] as const
const styles = StyleSheet.create({
  camera: { borderCurve: "continuous", borderRadius: 28, height: 300 },
  content: { flexGrow: 1, gap: 24, padding: 20 },
  goal: { fontSize: 96, lineHeight: 104 },
  screen: { flex: 1 },
  transition: { flex: 1 },
})
const ENTER = FadeInRight.duration(240).reduceMotion(ReduceMotion.System)
const EXIT = FadeOutLeft.duration(160).reduceMotion(ReduceMotion.System)

function ProgressRail({ step }: { step: number }) {
  return (
    <View
      accessibilityLabel={`Step ${step + 1} of ${STEP_COUNT}`}
      className="flex-row gap-2"
    >
      {Array.from({ length: STEP_COUNT }, (_, index) => (
        <View
          className={
            index <= step
              ? "h-1 flex-1 rounded-full bg-primary"
              : "h-1 flex-1 rounded-full bg-muted"
          }
          key={index}
        />
      ))}
    </View>
  )
}

function Header({ onBack, step }: { onBack: () => void; step: number }) {
  return (
    <View className="gap-5">
      <View className="flex-row items-center justify-between">
        {step > 0 ? (
          <Button
            accessibilityLabel="Previous step"
            className="h-10 w-10 rounded-full"
            onPress={onBack}
            size="icon"
            variant="ghost"
          >
            <ChevronLeftIcon />
          </Button>
        ) : (
          <View className="size-10" />
        )}
        <Text className="font-heading text-sm">pumpr.</Text>
        <View className="w-10 flex-row items-end justify-end">
          <NumericText
            className="text-xs text-muted-foreground"
            value={step + 1}
          />
          <Text className="text-xs text-muted-foreground">/</Text>
          <NumericText
            className="text-xs text-muted-foreground"
            value={STEP_COUNT}
          />
        </View>
      </View>
      <ProgressRail step={step} />
    </View>
  )
}

function AccountStep() {
  const { data: session } = authClient.useSession()
  const mutedForeground = useCSSVariable("--color-muted-foreground")
  const primaryForeground = useCSSVariable("--color-primary-foreground")
  const connected = session && !session.user.isAnonymous
  const identity = session?.user.email ?? session?.user.name

  return (
    <View className="flex-1 gap-8">
      <View className="gap-3">
        <Text className="font-heading text-4xl leading-[44px]">
          Your reps. Your record.
        </Text>
        <Text className="text-lg text-muted-foreground">
          Connect to sync across devices, or start instantly as a guest.
        </Text>
      </View>

      {connected ? (
        <Slab className="flex-row items-center gap-3">
          <View className="size-10 items-center justify-center rounded-full bg-primary">
            <CheckIcon
              color={
                typeof primaryForeground === "string"
                  ? primaryForeground
                  : undefined
              }
            />
          </View>
          <View className="flex-1 gap-1">
            <Text className="font-semibold">Progress sync is on</Text>
            {identity ? (
              <Text className="text-sm text-muted-foreground">{identity}</Text>
            ) : null}
          </View>
        </Slab>
      ) : (
        <ConnectProviders />
      )}

      <View className="flex-row items-center gap-3 rounded-2xl bg-muted p-4">
        <ShieldCheckIcon
          color={
            typeof mutedForeground === "string" ? mutedForeground : undefined
          }
        />
        <Text className="flex-1 text-sm text-muted-foreground">
          Guest workouts stay on this phone until you connect.
        </Text>
      </View>
    </View>
  )
}

function getSetTarget(updatePlan: (patch: Partial<TrainingPlan>) => void) {
  return (targetReps: number) => updatePlan({ targetReps })
}

function getSelectTarget(
  targetReps: number,
  updatePlan: (patch: Partial<TrainingPlan>) => void
) {
  return () => updatePlan({ targetReps })
}

function GoalStep() {
  const { plan, updatePlan } = usePlan()
  const setTarget = getSetTarget(updatePlan)

  return (
    <View className="flex-1 gap-8">
      <View className="gap-3">
        <Text className="font-heading text-4xl leading-[44px]">
          Set an honest daily target.
        </Text>
        <Text className="text-lg text-muted-foreground">
          You can raise it whenever the work gets easy.
        </Text>
      </View>

      <View className="items-center gap-4 py-6">
        <NumericText
          className="text-primary"
          style={styles.goal}
          value={plan.targetReps}
        />
        <Text className="font-mono text-xs tracking-[3px] text-muted-foreground uppercase">
          reps every day
        </Text>
      </View>

      <View className="gap-4">
        <GoalSlider onChange={setTarget} value={plan.targetReps} />
        <View className="flex-row gap-2">
          {GOAL_PRESETS.map((targetReps) => (
            <Button
              className="flex-1"
              key={targetReps}
              onPress={getSelectTarget(targetReps, updatePlan)}
              size="sm"
              variant={plan.targetReps === targetReps ? "primary" : "outline"}
            >
              <NumericText
                className={
                  plan.targetReps === targetReps
                    ? "text-primary-foreground"
                    : "text-foreground"
                }
                value={targetReps}
              />
            </Button>
          ))}
        </View>
      </View>
    </View>
  )
}

function CameraStep({
  error,
  onError,
  onLandmarks,
  poseSeen,
}: {
  error: string | null
  onError: (message: string) => void
  onLandmarks: (landmarks: readonly PoseLandmark[]) => void
  poseSeen: boolean
}) {
  const primaryForeground = useCSSVariable("--color-primary-foreground")

  return (
    <View className="flex-1 gap-5">
      <View className="gap-3">
        <Text className="font-heading text-4xl leading-[44px]">
          Your phone counts. You move.
        </Text>
        <Text className="text-lg text-muted-foreground">
          Step back and move around. Tracking runs on your device.
        </Text>
      </View>

      <View className="overflow-hidden bg-black" style={styles.camera}>
        <PoseCamera
          isActive
          onError={onError}
          onLandmarks={onLandmarks}
          showDepthGuide={false}
          showSetupGuides
        />
        <View className="pointer-events-none absolute inset-x-4 bottom-4 flex-row items-center justify-between">
          <View className="rounded-full bg-black/70 px-4 py-2">
            <Text className="font-semibold text-sm text-white">
              {poseSeen ? "Body tracked" : "Looking for you"}
            </Text>
          </View>
          {poseSeen ? (
            <Animated.View
              className="size-10 items-center justify-center rounded-full bg-primary"
              entering={FadeIn.reduceMotion(ReduceMotion.System)}
            >
              <SparklesIcon
                color={
                  typeof primaryForeground === "string"
                    ? primaryForeground
                    : undefined
                }
              />
            </Animated.View>
          ) : null}
        </View>
      </View>

      {error ? (
        <Text selectable className="text-destructive">
          {error}
        </Text>
      ) : null}
      <Text className="text-center text-sm text-muted-foreground">
        No video or body landmarks leave your phone.
      </Text>
    </View>
  )
}

function StepContent({
  cameraError,
  onCameraError,
  onLandmarks,
  poseSeen,
  step,
}: {
  cameraError: string | null
  onCameraError: (message: string) => void
  onLandmarks: (landmarks: readonly PoseLandmark[]) => void
  poseSeen: boolean
  step: number
}) {
  if (step === 0) {
    return <AccountStep />
  }

  if (step === 1) {
    return <GoalStep />
  }

  if (step === 2) {
    return (
      <CameraStep
        error={cameraError}
        onError={onCameraError}
        onLandmarks={onLandmarks}
        poseSeen={poseSeen}
      />
    )
  }

  return <ScheduleStep />
}

function getLandmarksChange(setPoseSeen: Dispatch<SetStateAction<boolean>>) {
  return (landmarks: readonly PoseLandmark[]) =>
    setPoseSeen(landmarks.length > 0)
}

function getCameraErrorChange(
  setCameraError: Dispatch<SetStateAction<string | null>>
) {
  return (message: string) => setCameraError(message)
}

function getBack(setStep: Dispatch<SetStateAction<number>>) {
  return () => setStep((current) => Math.max(0, current - 1))
}

function getNext(
  router: ReturnType<typeof useRouter>,
  step: number,
  setStep: Dispatch<SetStateAction<number>>
) {
  return () => {
    if (step < STEP_COUNT - 1) {
      setStep((current) => current + 1)
      return
    }

    completeOnboarding()
    router.replace("/")
  }
}

export default function OnboardingSetup() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const [step, setStep] = useState(0)
  const [poseSeen, setPoseSeen] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const connected = Boolean(session && !session.user.isAnonymous)
  const onLandmarks = getLandmarksChange(setPoseSeen)
  const onCameraError = getCameraErrorChange(setCameraError)
  const back = getBack(setStep)
  const next = getNext(router, step, setStep)
  const action =
    step === 0 && !connected
      ? "Continue as guest"
      : step === STEP_COUNT - 1
        ? "Start training"
        : "Continue"

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Header onBack={back} step={step} />
        <Animated.View
          entering={ENTER}
          exiting={EXIT}
          key={step}
          style={styles.transition}
        >
          <StepContent
            cameraError={cameraError}
            onCameraError={onCameraError}
            onLandmarks={onLandmarks}
            poseSeen={poseSeen}
            step={step}
          />
        </Animated.View>
        <Button
          className="h-14 rounded-full"
          labelClassName="font-bold text-base"
          onPress={next}
          size="lg"
        >
          {action}
        </Button>
        {step === 2 ? (
          <Button onPress={next} variant="ghost">
            Skip camera for now
          </Button>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}
