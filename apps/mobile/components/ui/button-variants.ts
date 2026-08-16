import { cn } from "@/lib/utils"
import { cva } from "class-variance-authority"
import { Platform } from "react-native"

const buttonVariants = cva(
  cn(
    "group shrink-0 flex-row items-center justify-center gap-2 rounded-2xl border border-transparent bg-clip-padding shadow-none",
    Platform.select({
      web: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    })
  ),
  {
    variants: {
      variant: {
        default: cn(
          "bg-primary active:bg-primary/80",
          Platform.select({ web: "hover:bg-primary/80" })
        ),
        destructive: cn(
          "bg-destructive/10 active:bg-destructive/20 dark:bg-destructive/20 dark:active:bg-destructive/30",
          Platform.select({
            web: "hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
          })
        ),
        outline: cn(
          "border-border bg-background active:bg-muted dark:bg-transparent dark:active:bg-input/30",
          Platform.select({
            web: "hover:bg-muted hover:text-foreground dark:hover:bg-input/30",
          })
        ),
        secondary: cn(
          "bg-secondary active:bg-secondary/80",
          Platform.select({
            web: "hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]",
          })
        ),
        ghost: cn(
          "active:bg-muted dark:active:bg-muted/50",
          Platform.select({ web: "hover:bg-muted dark:hover:bg-muted/50" })
        ),
        link: "",
      },
      size: {
        default: cn(
          "h-11 px-4",
          Platform.select({
            web: "has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
          })
        ),
        xs: cn(
          "h-9 gap-1.5 px-3",
          Platform.select({
            web: "has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-4",
          })
        ),
        sm: cn(
          "h-10 gap-1.5 px-3.5",
          Platform.select({
            web: "has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
          })
        ),
        lg: cn(
          "h-12 gap-2 px-5",
          Platform.select({
            web: "has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
          })
        ),
        icon: "size-11",
        "icon-xs": "size-9",
        "icon-sm": "size-10",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const buttonTextVariants = cva(
  cn(
    "text-base font-medium text-foreground",
    Platform.select({ web: "pointer-events-none transition-colors" })
  ),
  {
    variants: {
      variant: {
        default: "text-primary-foreground",
        destructive: "text-destructive",
        outline: cn(
          "group-active:text-foreground",
          Platform.select({ web: "group-hover:text-foreground" })
        ),
        secondary: "text-secondary-foreground",
        ghost: "group-active:text-foreground",
        link: cn(
          "text-primary group-active:underline",
          Platform.select({
            web: "underline-offset-4 hover:underline group-hover:underline",
          })
        ),
      },
      size: {
        default: "",
        xs: "text-sm",
        sm: "text-sm",
        lg: "",
        icon: "",
        "icon-xs": "",
        "icon-sm": "",
        "icon-lg": "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export { buttonTextVariants, buttonVariants }
