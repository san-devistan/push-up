import { useColorScheme } from "@/hooks/use-color-scheme"
import * as Lucide from "lucide-react-native"
import { useIconColor } from "panelui-native"

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

export const AlertTriangleIcon = withPanelColor(Lucide.AlertTriangleIcon)
export const ArrowUpRightIcon = withPanelColor(Lucide.ArrowUpRightIcon)
export const BellIcon = withPanelColor(Lucide.BellIcon)
export const SolidBellIcon = withPanelColor(Lucide.BellIcon, true)
export const CalendarDaysIcon = withPanelColor(Lucide.CalendarDaysIcon)
export const CalendarIcon = withPanelColor(Lucide.CalendarIcon)
export const CheckIcon = withPanelColor(Lucide.CheckIcon)
export const ChevronDownIcon = withPanelColor(Lucide.ChevronDownIcon)
export const ChevronLeftIcon = withPanelColor(Lucide.ChevronLeftIcon)
export const ChevronRightIcon = withPanelColor(Lucide.ChevronRightIcon)
export const ChevronUpIcon = withPanelColor(Lucide.ChevronUpIcon)
export const CircleArrowUpRightIcon = withPanelColor(
  Lucide.CircleArrowOutUpRightIcon
)
export const CircleXIcon = withPanelColor(Lucide.CircleXIcon)
export const ClockIcon = withPanelColor(Lucide.ClockIcon)
export const CrosshairIcon = withPanelColor(Lucide.CrosshairIcon)
export const FlameIcon = withPanelColor(Lucide.FlameIcon)
export const InfoIcon = withPanelColor(Lucide.InfoIcon)
export const LockIcon = withPanelColor(Lucide.LockIcon)
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
export const SparklesIcon = withPanelColor(Lucide.SparklesIcon)
export const StarIcon = withPanelColor(Lucide.StarIcon)
export const SunIcon = withPanelColor(Lucide.SunIcon)
export const SolidSunIcon = withPanelColor(Lucide.SunIcon, true)
export const TargetIcon = withPanelColor(Lucide.TargetIcon)
export const TimerIcon = withPanelColor(Lucide.TimerIcon)
export const TrashIcon = withPanelColor(Lucide.TrashIcon)
export const TrendingUpIcon = withPanelColor(Lucide.TrendingUpIcon)
export const TrophyIcon = withPanelColor(Lucide.TrophyIcon)
export const XIcon = withPanelColor(Lucide.XIcon)
export const ZapIcon = withPanelColor(Lucide.ZapIcon)
