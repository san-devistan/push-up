import { CheckIcon, LockIcon } from "@/components/icons"
import { Surface } from "@/components/ui/surface"
import WorkoutAvatar from "@/features/workout/_components/avatar"
import { Text } from "panelui-native"
import { StyleSheet, View } from "react-native"
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgGradient,
  Path,
  Stop,
} from "react-native-svg"
import { useCSSVariable } from "uniwind"

const WEEKS_TO_GOAL = 4
const AVATAR_DOM_PROPS = {
  scrollEnabled: false,
  style: { backgroundColor: "transparent", height: 150, width: 150 },
}
const PLAN_ROWS = [
  "Daily goal",
  "Training time",
  "Streak target",
  "Level path",
  "App blocker",
] as const
const REASSURANCE = [
  "Counted on-device. No video ever leaves your phone.",
  "Chest, shoulders, triceps and core in one move.",
  "Cancel anytime in the App Store.",
] as const
const styles = StyleSheet.create({
  avatarFrame: { height: 150, width: 150 },
  chart: { height: 110, width: "100%" },
  hero: { paddingBottom: 8, paddingTop: 12 },
})

/** Round the daily goal up to the next ten: the target the plan builds toward. */
function goalTarget(targetReps: number) {
  return Math.max(10, Math.ceil(targetReps / 10) * 10)
}

function ProgressCurve() {
  const primary = useCSSVariable("--color-primary")
  const stroke = typeof primary === "string" ? primary : "#2f9e5a"

  return (
    <Svg preserveAspectRatio="none" style={styles.chart} viewBox="0 0 100 40">
      <Defs>
        <SvgGradient id="fill" x1="0" x2="0" y1="0" y2="1">
          <Stop offset="0" stopColor={stroke} stopOpacity={0.28} />
          <Stop offset="1" stopColor={stroke} stopOpacity={0} />
        </SvgGradient>
      </Defs>
      <Path
        d="M0 34 C 25 33, 40 30, 55 22 S 85 8, 100 6 L100 40 L0 40 Z"
        fill="url(#fill)"
      />
      <Path
        d="M0 34 C 25 33, 40 30, 55 22 S 85 8, 100 6"
        fill="none"
        stroke={stroke}
        strokeLinecap="round"
        strokeWidth={2.2}
      />
      <Circle cx={100} cy={6} fill={stroke} r={2.6} />
    </Svg>
  )
}

export function GoalHero({ targetReps }: { targetReps: number }) {
  const target = goalTarget(targetReps)

  return (
    <View className="items-center gap-2" style={styles.hero}>
      <Text className="text-center font-heading text-4xl leading-[44px] text-foreground">
        {`Your goal: ${target} push-ups a day`}
      </Text>
      <View className="flex-row items-center gap-2">
        <Text className="font-semibold text-muted-foreground">
          {`${targetReps} today`}
        </Text>
        <Text className="text-muted-foreground">→</Text>
        <Text className="font-semibold text-muted-foreground">
          {`${target} a day`}
        </Text>
        <Text className="text-muted-foreground">
          {`· over ${WEEKS_TO_GOAL} weeks`}
        </Text>
      </View>
      <ProgressCurve />
    </View>
  )
}

export function LockedPlan() {
  const foreground = useCSSVariable("--color-foreground")

  return (
    <Surface elevated padding="none">
      <View className="gap-4 p-5">
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1 flex-row items-center gap-2">
            <LockIcon
              color={typeof foreground === "string" ? foreground : undefined}
              size={18}
            />
            <Text
              adjustsFontSizeToFit
              className="font-semibold text-lg"
              minimumFontScale={0.8}
              numberOfLines={1}
            >
              Your personal training plan
            </Text>
          </View>
          <View className="rounded-full bg-muted px-3 py-1">
            <Text className="font-semibold text-xs text-muted-foreground">
              Locked
            </Text>
          </View>
        </View>
        <View className="h-px bg-border" />
        <View className="flex-row gap-4">
          <View
            className="relative overflow-hidden rounded-2xl bg-muted"
            style={styles.avatarFrame}
          >
            <WorkoutAvatar
              dom={AVATAR_DOM_PROPS}
              expression="upward-side-glance"
            />
            <View className="absolute top-2 left-2 rounded-full bg-background px-2 py-0.5">
              <Text className="font-mono font-semibold text-[10px]">
                WEEK 1
              </Text>
            </View>
          </View>
          <View className="flex-1 justify-between py-1">
            {PLAN_ROWS.map((row) => (
              <View
                className="flex-row items-center justify-between gap-3"
                key={row}
              >
                <Text className="font-medium">{row}</Text>
                <View className="h-4 w-16 rounded-full bg-muted" />
              </View>
            ))}
          </View>
        </View>
      </View>
    </Surface>
  )
}

export function Reassurance() {
  const primary = useCSSVariable("--color-primary")

  return (
    <View className="gap-2">
      {REASSURANCE.map((line) => (
        <View className="flex-row items-center gap-2" key={line}>
          <CheckIcon
            color={typeof primary === "string" ? primary : undefined}
            size={16}
          />
          <Text className="flex-1 text-sm text-muted-foreground">{line}</Text>
        </View>
      ))}
    </View>
  )
}
