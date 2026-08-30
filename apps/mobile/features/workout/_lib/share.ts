import { formatDuration } from "@/features/workout/_lib/format"
import type { WorkoutSession } from "@/features/workout/_lib/storage"
import { formatNumber, translate, type Language } from "@/lib/i18n"
import * as Sharing from "expo-sharing"
import { Alert, Share as NativeShare, type View } from "react-native"
import { captureRef, releaseCapture } from "react-native-view-shot"

function getShareMessage(
  session: WorkoutSession,
  successRate: number,
  language: Language
) {
  const reps = `${formatNumber(language, session.validReps)}/${formatNumber(
    language,
    session.targetReps
  )}`
  const success = formatNumber(language, successRate / 100, {
    maximumFractionDigits: 0,
    style: "percent",
  })

  return `${reps} ${translate(language, "share.pushups")} · ${success} ${translate(language, "common.success")} · ${formatDuration(session.totalDurationMs)} · pumpr.`
}

async function capturePerformanceCard(
  card: View | null,
  session: WorkoutSession,
  suffix: string,
  language: Language
) {
  if (!card) {
    throw new Error(translate(language, "share.cardUnavailable"))
  }

  return captureRef(card, {
    fileName: `pumpr-${session.localDate}${suffix}`,
    format: "png",
    result: "tmpfile",
  })
}

export async function sharePerformanceCard(
  card: View | null,
  session: WorkoutSession,
  successRate: number,
  language: Language
) {
  if (!card || !(await Sharing.isAvailableAsync())) {
    await NativeShare.share({
      message: getShareMessage(session, successRate, language),
      title: `pumpr. — ${translate(language, "share.share")}`,
    })
    return
  }

  const captureUri = await capturePerformanceCard(card, session, "", language)

  try {
    await Sharing.shareAsync(captureUri, {
      UTI: "public.png",
      dialogTitle: translate(language, "share.share"),
      mimeType: "image/png",
    })
  } finally {
    releaseCapture(captureUri)
  }
}

export async function saveTransparentCard(
  card: View | null,
  session: WorkoutSession,
  language: Language
) {
  const MediaLibrary = await import("expo-media-library")
  const permission = await MediaLibrary.requestPermissionsAsync(true, ["photo"])

  if (!permission.granted) {
    Alert.alert(
      translate(language, "share.photosTitle"),
      translate(language, "share.photosBody")
    )
    return
  }

  const captureUri = await capturePerformanceCard(
    card,
    session,
    "-transparent",
    language
  )

  try {
    await MediaLibrary.Asset.create(captureUri)
  } finally {
    releaseCapture(captureUri)
  }

  Alert.alert(
    translate(language, "share.pngTitle"),
    translate(language, "share.pngBody")
  )
}

export async function shareInstagramStory(
  card: View | null,
  appId: string,
  language: Language
) {
  if (!card) {
    throw new Error(translate(language, "share.cardUnavailable"))
  }

  const [stickerImage, { default: SocialShare, Social }] = await Promise.all([
    captureRef(card, { format: "png", result: "data-uri" }),
    import("react-native-share"),
  ])

  await SocialShare.shareSingle({
    appId,
    backgroundBottomColor: "#000000",
    backgroundTopColor: "#000000",
    social: Social.InstagramStories,
    stickerImage,
    useInternalStorage: true,
  })
}
