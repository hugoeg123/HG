import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-theme-background disabled:pointer-events-none disabled:opacity-50 border",
  {
    variants: {
      variant: {
        default: "bg-teal-600/20 hover:bg-teal-600/30 border-teal-600/30 hover:border-teal-500 text-teal-400 focus-visible:ring-teal-500/50",
        destructive:
          "bg-red-600/20 hover:bg-red-600/30 border-red-600/30 hover:border-red-500 text-red-400 focus-visible:ring-red-500/50",
        outline:
          "border-gray-700/30 bg-gray-700/10 hover:bg-gray-700/20 hover:border-gray-600 text-gray-300 focus-visible:ring-gray-600/50",
        secondary:
          "bg-blue-600/20 hover:bg-blue-600/30 border-blue-600/30 hover:border-blue-500 text-blue-400 focus-visible:ring-blue-500/50",
        ghost: "border-transparent hover:bg-gray-700/20 hover:text-gray-300 text-gray-400",
        link: "text-teal-400 underline-offset-4 hover:underline border-transparent",
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
