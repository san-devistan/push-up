/* eslint-disable react-perf/jsx-no-new-function-as-prop, react-perf/jsx-no-new-object-as-prop -- React Compiler stabilizes the local WebView bridge props. */
import definition from "@/features/workout/_components/pumpr.avatar.json"
import {
  renderAvatarDefinition,
  validateAvatarDefinition,
} from "@bible-strong/avatar-core"
import type { DOMProps } from "expo/dom"
import { useId, useState, type ComponentProps } from "react"
import { StyleSheet, View } from "react-native"
import Svg, { ClipPath, Defs, G, Path } from "react-native-svg"

import AvatarDOM from "./avatar.dom"

type AvatarProps = Omit<ComponentProps<typeof AvatarDOM>, "onReady">

const styles = StyleSheet.create({
  fallback: { zIndex: 1 },
})
const FALLBACK_STYLE = [StyleSheet.absoluteFill, styles.fallback]
const parsedDefinition = validateAvatarDefinition(definition)

if (!parsedDefinition.ok) {
  throw new Error(
    `Invalid avatar definition: ${parsedDefinition.errors[0]?.message}`
  )
}

const avatarDefinition = parsedDefinition.value

function AvatarFallback({ expression }: { expression: string }) {
  const clipPathId = `${useId().replaceAll(":", "")}-head`
  const scene = renderAvatarDefinition(avatarDefinition, expression)

  return (
    <Svg
      accessible={false}
      pointerEvents="none"
      style={FALLBACK_STYLE}
      viewBox="-150 -150 300 300"
    >
      <Defs>
        <ClipPath id={clipPathId}>
          <Path d={scene.geometry.headPath} />
        </ClipPath>
      </Defs>
      {scene.geometry.backPaths.map((path) => (
        <Path d={path} fill={scene.colors.body} key={`back-${path}`} />
      ))}
      <Path d={scene.geometry.headPath} fill={scene.colors.body} />
      <G clipPath={`url(#${clipPathId})`} fill={scene.colors.eyes}>
        <Path
          d={scene.geometry.leftPath}
          opacity={scene.geometry.leftVisible ? 1 : 0}
        />
        <Path
          d={scene.geometry.rightPath}
          opacity={scene.geometry.rightVisible ? 1 : 0}
        />
      </G>
      {scene.geometry.frontPaths.map((path) => (
        <Path d={path} fill={scene.colors.body} key={`front-${path}`} />
      ))}
    </Svg>
  )
}

export default function WorkoutAvatar({
  animation,
  dom,
  expression,
}: AvatarProps) {
  const [ready, setReady] = useState(false)
  const handleReady = async () => setReady(true)
  const handleLoadStart = (
    ...args: Parameters<NonNullable<DOMProps["onLoadStart"]>>
  ) => {
    setReady(false)
    dom?.onLoadStart?.(...args)
  }
  const webViewDom = {
    ...dom,
    onLoadStart: handleLoadStart,
    style: StyleSheet.absoluteFill,
  }
  const fallbackExpression =
    expression ??
    definition.animations[animation ?? "idle"].steps[0]?.expression ??
    "neutral"

  return (
    <View style={dom?.style}>
      <AvatarDOM
        animation={animation}
        dom={webViewDom}
        expression={expression}
        onReady={handleReady}
      />
      {ready ? null : <AvatarFallback expression={fallbackExpression} />}
    </View>
  )
}
