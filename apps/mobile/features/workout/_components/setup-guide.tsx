import { NumericText } from "@/components/numeric-text"
import type { PhoneInclinationDisplay } from "@/features/workout/_hooks/use-phone-inclination"
import type { SetupFraming } from "@/features/workout/_lib/setup"
import { useI18n } from "@/hooks/use-i18n"
import type { TranslationKey } from "@/lib/i18n"
import { CheckIcon, Text } from "panelui-native"
import { StyleSheet, View, type ViewStyle } from "react-native"
import Svg, { Circle, Line, Path, Rect } from "react-native-svg"

const READY_COLOR = "#319f5b"
const TEXT_COLOR = "#ffffff"
const MUTED_COLOR = "rgba(255, 255, 255, 0.35)"
const BODY_SCALE: Record<SetupFraming, number> = {
  close: 1.2,
  far: 0.65,
  "off-center": 0.9,
  ready: 0.9,
  unknown: 0.9,
}
const DISTANCE_STATUS: Partial<Record<SetupFraming, TranslationKey>> = {
  close: "setup.tooClose",
  far: "setup.tooFar",
  "off-center": "setup.reposition",
  ready: "setup.perfect",
}

const styles = StyleSheet.create({
  check: { marginLeft: 4 },
  column: { alignItems: "center", gap: 3, width: 72 },
  distanceFrame: {
    alignItems: "center",
    borderColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 7,
    borderStyle: "dashed",
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 62,
  },
  distanceFrameReady: { borderColor: READY_COLOR },
  header: {
    alignItems: "center",
    flexDirection: "row",
    height: 14,
    justifyContent: "center",
  },
  label: {
    color: "rgba(255, 255, 255, 0.55)",
    fontSize: 9,
    letterSpacing: 0.8,
    lineHeight: 12,
  },
  panel: {
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    borderCurve: "continuous",
    borderRadius: 24,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  readout: {
    fontSize: 11,
    fontVariant: ["tabular-nums"],
    lineHeight: 14,
    textAlign: "center",
  },
  readoutRow: { alignItems: "center", flexDirection: "row" },
  visual: {
    alignItems: "center",
    height: 42,
    justifyContent: "center",
    width: 64,
  },
})

function getPhoneStyle(degrees: number): ViewStyle {
  return { transform: [{ rotate: `${degrees}deg` }] }
}

function getBodyStyle(framing: SetupFraming): ViewStyle {
  return {
    opacity: framing === "unknown" ? 0.55 : 1,
    transform: [
      { scale: BODY_SCALE[framing] },
      { translateY: framing === "off-center" ? -5 : 0 },
    ],
  }
}

function PhoneGlyph({ color, degrees }: { color: string; degrees: number }) {
  return (
    <View style={styles.visual}>
      <View style={getPhoneStyle(degrees)}>
        <Svg height={38} viewBox="0 0 38 38" width={38}>
          <Rect
            fill="none"
            height={30}
            rx={5}
            stroke={color}
            strokeWidth={2.5}
            width={17}
            x={10.5}
            y={4}
          />
          <Line
            stroke={color}
            strokeLinecap="round"
            strokeWidth={2}
            x1={16}
            x2={22}
            y1={8}
            y2={8}
          />
          <Circle cx={19} cy={29.5} fill={color} r={1.4} />
        </Svg>
      </View>
    </View>
  )
}

function BodyGlyph({
  color,
  framing,
}: {
  color: string
  framing: SetupFraming
}) {
  return (
    <View style={getBodyStyle(framing)}>
      <Svg height={34} viewBox="0 0 64 38" width={58}>
        <Circle cx={55} cy={8} fill={color} r={4} />
        <Path
          d="M50 13 30 17 9 30"
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={4}
        />
        <Line
          stroke={color}
          strokeLinecap="round"
          strokeWidth={3}
          x1={44}
          x2={42}
          y1={15}
          y2={30}
        />
      </Svg>
    </View>
  )
}

export default function SetupGuide({
  framing,
  phone,
}: {
  framing: SetupFraming
  phone: PhoneInclinationDisplay
}) {
  const { t } = useI18n()
  const angleAvailable = phone.type === "available"
  const angleReady = angleAvailable && phone.upright
  const angleColor = angleReady
    ? READY_COLOR
    : angleAvailable
      ? TEXT_COLOR
      : MUTED_COLOR
  const distanceReady = framing === "ready"
  const distanceColor =
    framing === "unknown"
      ? MUTED_COLOR
      : distanceReady
        ? READY_COLOR
        : TEXT_COLOR

  return (
    <View pointerEvents="none" style={styles.panel}>
      <View style={styles.column}>
        <View style={styles.header}>
          <Text style={styles.label}>{t("setup.angle")}</Text>
          {angleReady ? (
            <CheckIcon color={READY_COLOR} size={12} style={styles.check} />
          ) : null}
        </View>
        <PhoneGlyph
          color={angleColor}
          degrees={angleAvailable ? phone.degrees : 0}
        />
        {angleAvailable ? (
          <View style={styles.readoutRow}>
            <NumericText
              style={StyleSheet.compose(styles.readout, { color: angleColor })}
              value={phone.degrees}
            />
            <Text
              style={StyleSheet.compose(styles.readout, { color: angleColor })}
            >
              °
            </Text>
          </View>
        ) : (
          <Text
            style={StyleSheet.compose(styles.readout, { color: angleColor })}
          >
            —
          </Text>
        )}
      </View>
      <View style={styles.column}>
        <View style={styles.header}>
          <Text style={styles.label}>{t("setup.distance")}</Text>
          {distanceReady ? (
            <CheckIcon color={READY_COLOR} size={12} style={styles.check} />
          ) : null}
        </View>
        <View style={styles.visual}>
          <View
            style={StyleSheet.compose(
              styles.distanceFrame,
              distanceReady ? styles.distanceFrameReady : undefined
            )}
          >
            <BodyGlyph color={distanceColor} framing={framing} />
          </View>
        </View>
        <Text
          style={StyleSheet.compose(styles.readout, { color: distanceColor })}
        >
          {DISTANCE_STATUS[framing] ? t(DISTANCE_STATUS[framing]) : "—"}
        </Text>
      </View>
    </View>
  )
}
