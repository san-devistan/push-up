import { useColorScheme } from "@/hooks/use-color-scheme"
import * as Lucide from "lucide-react-native"
import { useIconColor } from "panelui-native"
import Svg, { Path } from "react-native-svg"

export type IconProps = Lucide.LucideProps & { solid?: boolean }

function withPanelColor(Icon: Lucide.LucideIcon, solidByDefault = false) {
  return function ThemedIcon({ color, fill, solid, ...props }: IconProps) {
    const inheritedColor = useIconColor()
    const resolvedColor = color ?? inheritedColor
    const isDark = useColorScheme() === "dark"
    const shouldFill = solid ?? solidByDefault

    return (
      <Icon
        color={resolvedColor}
        fill={fill ?? (shouldFill && isDark ? resolvedColor : "none")}
        {...props}
      />
    )
  }
}

export function InstagramIcon({ color, fill, size = 24 }: IconProps) {
  const inheritedColor = useIconColor()
  const resolvedColor = fill ?? color ?? inheritedColor

  return (
    <Svg fill={resolvedColor} height={size} viewBox="0 0 32 32" width={size}>
      <Path d="M22.3 8.4c-.8 0-1.4.6-1.4 1.4s.6 1.4 1.4 1.4 1.4-.6 1.4-1.4-.6-1.4-1.4-1.4Z" />
      <Path d="M16 10.2a5.9 5.9 0 1 0 0 11.8 5.9 5.9 0 0 0 0-11.8Zm0 9.7a3.8 3.8 0 1 1 0-7.6 3.8 3.8 0 0 1 0 7.6Z" />
      <Path d="M20.8 4h-9.5C7.2 4 4 7.2 4 11.2v9.5c0 4 3.2 7.2 7.2 7.2h9.5c4 0 7.2-3.2 7.2-7.2v-9.5C28 7.2 24.8 4 20.8 4Zm4.9 16.8c0 2.7-2.2 5-5 5h-9.5c-2.7 0-5-2.2-5-5v-9.5c0-2.7 2.2-5 5-5h9.5c2.7 0 5 2.2 5 5v9.5Z" />
    </Svg>
  )
}

export const AlertTriangleIcon = withPanelColor(Lucide.AlertTriangleIcon)
export const ArmchairIcon = withPanelColor(Lucide.ArmchairIcon)
export const ArrowUpRightIcon = withPanelColor(Lucide.ArrowUpRightIcon)
export const BellIcon = withPanelColor(Lucide.BellIcon)
export const SolidBellIcon = withPanelColor(Lucide.BellIcon, true)
export const BicepsFlexedIcon = withPanelColor(Lucide.BicepsFlexedIcon)
export const CalendarDaysIcon = withPanelColor(Lucide.CalendarDaysIcon)
export const CheckIcon = withPanelColor(Lucide.CheckIcon)
export const ChevronDownIcon = withPanelColor(Lucide.ChevronDownIcon)
export const ChevronLeftIcon = withPanelColor(Lucide.ChevronLeftIcon)
export const ChevronRightIcon = withPanelColor(Lucide.ChevronRightIcon)
export const ChevronUpIcon = withPanelColor(Lucide.ChevronUpIcon)
export const ClockIcon = withPanelColor(Lucide.ClockIcon)
export const CrosshairIcon = withPanelColor(Lucide.CrosshairIcon)
export const EyeIcon = withPanelColor(Lucide.EyeIcon)
export const FlameIcon = withPanelColor(Lucide.FlameIcon)
export const HeartPulseIcon = withPanelColor(Lucide.HeartPulseIcon)
export const HouseIcon = withPanelColor(Lucide.HouseIcon)
export const InfoIcon = withPanelColor(Lucide.InfoIcon)
export const LockIcon = withPanelColor(Lucide.LockIcon)
const ThemedLogOutIcon = withPanelColor(Lucide.LogOutIcon)
export function LogOutIcon(props: IconProps) {
  return <ThemedLogOutIcon {...props} />
}
export const MenuIcon = withPanelColor(Lucide.MenuIcon)
export const MessageCircleIcon = withPanelColor(Lucide.MessageCircleIcon)
export const SolidMessageCircleIcon = withPanelColor(
  Lucide.MessageCircleIcon,
  true
)
export const MicIcon = withPanelColor(Lucide.MicIcon)
export const PlusIcon = withPanelColor(Lucide.PlusIcon)
export const PauseIcon = withPanelColor(Lucide.PauseIcon)
export const PlayIcon = withPanelColor(Lucide.PlayIcon)
export const RepeatIcon = withPanelColor(Lucide.RepeatIcon)
export const SettingsIcon = withPanelColor(Lucide.SettingsIcon)
export const ShareNodesIcon = withPanelColor(Lucide.Share2Icon)
export const ShieldCheckIcon = withPanelColor(Lucide.ShieldCheckIcon)
export const StarIcon = withPanelColor(Lucide.StarIcon)
export const SunIcon = withPanelColor(Lucide.SunIcon)
export const SolidSunIcon = withPanelColor(Lucide.SunIcon, true)
export const SmartphoneIcon = withPanelColor(Lucide.SmartphoneIcon)
export const TargetIcon = withPanelColor(Lucide.TargetIcon)
export const TimerIcon = withPanelColor(Lucide.TimerIcon)
export const TrashIcon = withPanelColor(Lucide.TrashIcon)
export const TrendingDownIcon = withPanelColor(Lucide.TrendingDownIcon)
export const TrendingUpIcon = withPanelColor(Lucide.TrendingUpIcon)
export const TrophyIcon = withPanelColor(Lucide.TrophyIcon)
export const Volume2Icon = withPanelColor(Lucide.Volume2Icon)
export const XIcon = withPanelColor(Lucide.XIcon)
export const ZapIcon = withPanelColor(Lucide.ZapIcon)
