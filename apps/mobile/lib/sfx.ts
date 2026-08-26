import { Asset } from "expo-asset"
import { createAudioPlayer, setAudioModeAsync } from "expo-audio"

const SFX_CUES = [
  "press",
  "select",
  "open",
  "close",
  "forward",
  "toggle-on",
  "toggle-off",
  "expand",
  "collapse",
  "long-press",
  "snap",
  "recording",
  "start",
  "error",
  "delete",
  "success",
  "achievement",
] as const

export type SfxCue = (typeof SFX_CUES)[number]

const MASTER_VOLUME = 0.7
const SFX = {
  close: require("uisfx/sounds/minimal/close.mp3"),
  collapse: require("uisfx/sounds/minimal/collapse.mp3"),
  achievement: require("uisfx/sounds/minimal/achievement.mp3"),
  delete: require("uisfx/sounds/minimal/delete.mp3"),
  error: require("uisfx/sounds/minimal/error.mp3"),
  expand: require("uisfx/sounds/minimal/expand.mp3"),
  forward: require("uisfx/sounds/minimal/forward.mp3"),
  "long-press": require("uisfx/sounds/minimal/long-press.mp3"),
  open: require("uisfx/sounds/minimal/open.mp3"),
  press: require("uisfx/sounds/minimal/press.mp3"),
  recording: require("uisfx/sounds/minimal/recording.mp3"),
  select: require("uisfx/sounds/minimal/select.mp3"),
  snap: require("uisfx/sounds/minimal/snap.mp3"),
  start: require("uisfx/sounds/minimal/start.mp3"),
  success: require("uisfx/sounds/minimal/success.mp3"),
  "toggle-off": require("uisfx/sounds/minimal/toggle-off.mp3"),
  "toggle-on": require("uisfx/sounds/minimal/toggle-on.mp3"),
} satisfies Record<SfxCue, number>

const player = createAudioPlayer(null, {
  keepAudioSessionActive: true,
  updateInterval: 10_000,
})
const sources = new Map<SfxCue, string>()
let soundEnabled = true

async function prepareCue(index: number): Promise<void> {
  const cue = SFX_CUES[index]
  if (!cue) return

  const asset = await Asset.fromModule(SFX[cue]).downloadAsync()
  sources.set(cue, asset.localUri ?? asset.uri)
  return prepareCue(index + 1)
}

async function prepareSfx() {
  try {
    await setAudioModeAsync({
      allowsRecording: false,
      interruptionMode: "mixWithOthers",
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
    })

    player.volume = MASTER_VOLUME
    await prepareCue(0)
  } catch {
    return
  }
}

requestIdleCallback(() => void prepareSfx())

export function setSfxEnabled(enabled: boolean) {
  soundEnabled = enabled
}

function startSfx(cue: SfxCue, enabled: boolean, loop: boolean) {
  if (!enabled) return

  const source = sources.get(cue)
  if (!source) return

  try {
    player.pause()
    player.loop = loop
    player.replace({ uri: source })
    player.play()
  } catch {
    return
  }
}

export function playSfx(cue: SfxCue, enabled = soundEnabled) {
  startSfx(cue, enabled, false)
}

export function loopSfx(cue: SfxCue, enabled = soundEnabled) {
  startSfx(cue, enabled, true)
}

export function stopSfx() {
  player.pause()
  player.loop = false
}
