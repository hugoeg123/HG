import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-theme-background disabled:pointer-events-none disabled:opacity-50 border",
  {
    variants: {
      variant: {
        default: "bg-theme-card text-gray-300 hover:bg-theme-surface hover:text-white border-transparent hover:border-teal-500/30 focus-visible:ring-teal-500/50",
        destructive:
          "bg-theme-card text-gray-300 hover:bg-red-600/20 hover:text-red-300 border-transparent hover:border-red-500/30 focus-visible:ring-red-500/50",
        outline:
          "bg-theme-card text-gray-300 hover:bg-theme-surface hover:text-white border-transparent hover:border-gray-600/30 focus-visible:ring-gray-600/50",
        secondary:
          "bg-theme-card text-gray-300 hover:bg-blue-600/20 hover:text-blue-300 border-transparent hover:border-blue-500/30 focus-visible:ring-blue-500/50",
        ghost: "bg-transparent text-gray-400 hover:bg-theme-surface hover:text-gray-300 border-transparent",
        link: "bg-transparent text-teal-400 hover:text-teal-300 underline-offset-4 hover:underline border-transparent",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-lg px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
