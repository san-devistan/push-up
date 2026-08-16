import { TextClassContext } from "@/components/ui/text"
import { COMPONENT_TOKENS } from "@/lib/theme"
import { cn } from "@/lib/utils"
import type { LucideIcon, LucideProps } from "lucide-react-native"
import { cssInterop } from "nativewind"
import * as React from "react"

type IconProps = LucideProps & {
  as: LucideIcon
} & React.RefAttributes<LucideIcon>

function IconImpl({ as: IconComponent, ...props }: IconProps) {
  return <IconComponent {...props} />
}

cssInterop(IconImpl, {
  className: {
    target: "style",
    nativeStyleToProp: {
      height: "size",
      width: "size",
    },
  },
})

function Icon({
  as: IconComponent,
  className,
  size = COMPONENT_TOKENS.iconSize.sm,
  ...props
}: IconProps) {
  const textClass = React.use(TextClassContext)
  return (
    <IconImpl
      as={IconComponent}
      className={cn("text-foreground", textClass, className)}
      size={size}
      {...props}
    />
  )
}

export { Icon }
