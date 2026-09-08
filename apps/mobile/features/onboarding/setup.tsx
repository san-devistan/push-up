import { PhysicalCameraTrace } from "@/components/camera-trace"
import { CheckIcon } from "@/components/icons"
import { NumericText } from "@/components/numeric-text"
import { SpeechBubble } from "@/components/speech-bubble"
import { Button } from "@/components/ui/button"
import TrackingIllustration from "@/features/onboarding/_components/tracking-illustration"
import AppBlockerStep from "@/features/onboarding/app-blocker"
import ScheduleStep from "@/features/onboarding/schedule"
import ScreenTimeStep from "@/features/onboarding/screen-time"
import { completeOnboarding } from "@/features/onboarding/storage"
import WhyPushUpsStep from "@/features/onboarding/why"
import WorkoutAvatar from "@/features/workout/_components/avatar"
import { ConnectProviders } from "@/features/workout/_components/connect"
import { Slab } from "@/features/workout/_components/figures"
import { usePlan } from "@/features/workout/_hooks/use-plan"
import {
  goalAtIndex,
  LAST_GOAL_INDEX,
  nearestGoalIndex,
} from "@/features/workout/_lib/goal"
import type { TrainingPlan } from "@/features/workout/_lib/storage"
import { useI18n } from "@/hooks/use-i18n"
import { authClient } from "@/lib/auth-client"
import { selectionTick } from "@/lib/haptics"
import { useRouter } from "expo-router"
import { Slider, Text } from "panelui-native"
import { useState, type Dispatch, type SetStateAction } from "react"
import { ScrollView, StyleSheet, View } from "react-native"
import Animated, {
  FadeInRight,
  FadeOutLeft,
  ReduceMotion,
} from "react-native-reanimated"
import { SafeAreaView } from "react-native-safe-area-context"
import { useCSSVariable } from "uniwind"

const HAS_APP_BLOCKER_STEP = process.env.EXPO_OS === "ios"
const ALL_STEPS = [
  "account",
  "goal",
  "camera",
  "appBlocker",
  "screenTime",
  "schedule",
  "why",
] as const

type StepKey = (typeof ALL_STEPS)[number]

/**
 * The running order. Keying the flow by name rather than by index is what lets
 * the App Blocker drop out on Android — and any future step slot in — without
 * every `step === 3` elsewhere in the file quietly meaning something else.
 */
const STEPS: StepKey[] = ALL_STEPS.filter(
  (step) => step !== "appBlocker" || HAS_APP_BLOCKER_STEP
)
const STEP_COUNT = STEPS.length
const LAST_STEP = STEP_COUNT - 1
/** Steps that own the vertical gesture themselves, so the page must not scroll. */
const FIXED_STEPS = new Set<StepKey>(["appBlocker", "schedule"])
const formatGoalIndex = (index: number) => String(goalAtIndex(index))
const styles = StyleSheet.create({
  accountHeroAvatar: {
    backgroundColor: "transparent",
    height: 224,
    width: 224,
  },
  accountHeroAvatarFrame: { height: 224, width: 224 },
  accountHeroName: { fontSize: 64, lineHeight: 76 },
  content: { flexGrow: 1, gap: 24, padding: 20 },
  goal: { fontSize: 96, lineHeight: 104 },
  screen: { flex: 1 },
  transition: { flex: 1 },
})
const ENTER = FadeInRight.duration(240).reduceMotion(ReduceMotion.System)
const EXIT = FadeOutLeft.duration(160).reduceMotion(ReduceMotion.System)
const ACCOUNT_AVATAR_DOM_PROPS = {
  scrollEnabled: false,
  style: styles.accountHeroAvatar,
}

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

function getContinueAsGuest(
  isAnonymous: boolean,
  onNext: () => void,
  setError: Dispatch<SetStateAction<string | null>>,
  setPending: Dispatch<SetStateAction<boolean>>
) {
  return () => {
    if (isAnonymous) {
      onNext()
      return
    }

    setError(null)
    setPending(true)
    void authClient.signIn
      .anonymous()
      .then(({ error }) => error?.message ?? null)
      .catch(() => "Could not start guest session. Check your connection.")
      .then((error) => {
        setPending(false)
        setError(error)
        if (error === null) onNext()
        return error
      })
  }
}

function AccountStep({ onNext }: { onNext: () => void }) {
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const primaryForeground = useCSSVariable("--color-primary-foreground")
  const [guestError, setGuestError] = useState<string | null>(null)
  const [guestPending, setGuestPending] = useState(false)
  const isAnonymous = session?.user.isAnonymous === true
  const connected = session && !isAnonymous
  const identity = session?.user.email ?? session?.user.name
  const continueAsGuest = getContinueAsGuest(
    isAnonymous,
    onNext,
    setGuestError,
    setGuestPending
  )

  return (
    <View className="flex-1 justify-between gap-8">
      <View className="flex-1 gap-4">
        <View className="ml-2 items-start">
          <Text
            adjustsFontSizeToFit
            className="font-heading text-foreground"
            numberOfLines={1}
            style={styles.accountHeroName}
          >
            pumpr.
          </Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <View className="relative" style={styles.accountHeroAvatarFrame}>
            <WorkoutAvatar
              dom={ACCOUNT_AVATAR_DOM_PROPS}
              expression="upward-side-glance"
            />
            <SpeechBubble className="absolute top-1 -right-5">
              hello.
            </SpeechBubble>
          </View>
        </View>
      </View>

      <View className="gap-5">
        <View className="gap-3">
          <Text className="font-heading text-4xl leading-[44px]">
            Your reps. Your record.
          </Text>
          <Text className="text-lg text-muted-foreground">
            Connect to sync across devices, or start instantly as a guest.
          </Text>
        </View>

        {connected ? (
          <View className="gap-3">
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
                  <Text className="text-sm text-muted-foreground">
                    {identity}
                  </Text>
                ) : null}
              </View>
            </Slab>
            <Button
              className="h-14 rounded-full bg-foreground"
              labelClassName="font-heading lowercase text-lg text-background"
              onPress={onNext}
              size="lg"
            >
              next.
            </Button>
          </View>
        ) : (
          <View className="gap-1">
            <ConnectProviders onConnected={onNext} />
            <Button
              disabled={sessionPending}
              labelClassName="font-semibold underline"
              loading={guestPending}
              onPress={continueAsGuest}
              variant="ghost"
            >
              continue as guest.
            </Button>
            {guestError ? (
              <Text selectable className="text-center text-sm text-destructive">
                {guestError}
              </Text>
            ) : null}
          </View>
        )}
      </View>
    </View>
  )
}

function getSetTarget(
  updatePlan: (patch: Partial<TrainingPlan>) => void,
  selected: number
) {
  return (index: number) => {
    if (index === selected) return
    selected = index
    selectionTick()
    updatePlan({ targetReps: goalAtIndex(index) })
  }
}

function GoalStep() {
  const { t } = useI18n()
  const { plan, updatePlan } = usePlan()
  const targetIndex = nearestGoalIndex(plan.targetReps)
  const setTarget = getSetTarget(updatePlan, targetIndex)

  return (
    <View className="flex-1 gap-8">
      <View className="gap-3">
        <Text className="font-heading text-4xl leading-[44px]">
          Pick a goal you can repeat.
        </Text>
        <Text className="text-lg text-muted-foreground">
          Choose a number you can reach every day. Consistency matters more than
          starting big.
        </Text>
      </View>

      <View className="items-center gap-4 py-6">
        <NumericText
          className="text-foreground"
          style={styles.goal}
          value={plan.targetReps}
        />
        <Text className="font-mono text-xs tracking-[3px] text-muted-foreground uppercase">
          every day
        </Text>
      </View>

      <View className="flex-1 justify-center">
        <Slider
          formatValue={formatGoalIndex}
          headerClassName="hidden"
          label={t("accessibility.dailyGoal")}
          max={LAST_GOAL_INDEX}
          onValueChange={setTarget}
          step={1}
          value={targetIndex}
        />
      </View>
    </View>
  )
}

function CameraStep() {
  return (
    <View className="flex-1 gap-5">
      <View className="gap-3">
        <Text className="font-heading text-4xl leading-[44px]">
          Your phone counts every rep.
        </Text>
        <Text className="text-lg text-muted-foreground">
          pumpr. uses on-device pose tracking to count your push-ups. Place your
          phone flat on the ground with the camera facing you.
        </Text>
      </View>

      <TrackingIllustration />

      <Text className="text-center text-sm text-muted-foreground">
        Tracking stays on your device. No video leaves your phone.
      </Text>
    </View>
  )
}

function StepContent({ onNext, step }: { onNext: () => void; step: StepKey }) {
  if (step === "account") {
    return <AccountStep onNext={onNext} />
  }

  if (step === "goal") {
    return <GoalStep />
  }

  if (step === "camera") {
    return <CameraStep />
  }

  if (step === "appBlocker") {
    return <AppBlockerStep />
  }

  if (step === "screenTime") {
    return <ScreenTimeStep />
  }

  if (step === "schedule") {
    return <ScheduleStep />
  }

  return <WhyPushUpsStep />
}

function getNext(
  router: ReturnType<typeof useRouter>,
  step: number,
  setStep: Dispatch<SetStateAction<number>>
) {
  return () => {
    if (step < LAST_STEP) {
      setStep((current) => current + 1)
      return
    }

    completeOnboarding()
    router.replace("/")
  }
}

export default function OnboardingSetup() {
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const step = STEPS[index] ?? "account"
  const next = getNext(router, index, setIndex)
  const isLast = index === LAST_STEP

  return (
    <View style={styles.screen}>
      {step === "camera" ? <PhysicalCameraTrace /> : null}
      <SafeAreaView style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
          scrollEnabled={!FIXED_STEPS.has(step)}
        >
          <ProgressRail step={index} />
          <Animated.View
            entering={ENTER}
            exiting={EXIT}
            key={step}
            style={styles.transition}
          >
            <StepContent onNext={next} step={step} />
          </Animated.View>
          {index > 0 ? (
            <Button
              className="h-14 rounded-full bg-foreground"
              labelClassName="font-heading lowercase text-lg text-background"
              onPress={next}
              sfx={isLast ? "success" : undefined}
              size="lg"
            >
              {isLast ? "see my plan." : "next."}
            </Button>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}
