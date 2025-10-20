import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

// /**
//  * Button component variants using semantic tokens
//  * 
//  * Connectors: Used across UI for actions, integrates with Tailwind semantic colors defined in tailwind.config.js
//  * IA prompt: Suggest variant mapping for accessibility (contrast, focus states)
//  * 
//  * Example:
//  * <Button variant="destructive" size="sm">Delete</Button>
//  */
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-theme-background disabled:pointer-events-none disabled:opacity-50 border",
  {
    variants: {
      variant: {
        default: "bg-theme-card text-foreground hover:bg-theme-surface hover:text-foreground border-theme-border hover:border-accent/30 focus-visible:ring-accent/50",
        destructive:
          "bg-theme-card text-muted-foreground hover:bg-destructive/20 hover:text-destructive border-theme-border hover:border-destructive/30 focus-visible:ring-destructive/50",
        outline:
          // Filled accent for outline variant: blue on light, green/teal on dark
          "bg-accent text-accent-foreground hover:bg-accent/90 border-accent hover:border-accent focus-visible:ring-accent/50",
        secondary:
          "bg-theme-card text-muted-foreground hover:bg-accent/20 hover:text-accent border-theme-border hover:border-accent/40 focus-visible:ring-accent/50",
        ghost: "bg-transparent text-foreground hover:bg-theme-surface hover:text-foreground border-transparent focus-visible:ring-accent/50",
        link: "bg-transparent text-accent underline-offset-4 hover:underline border-transparent",
        // Primary: solid accent fill (blue on bright, green/teal on dark)
        primary: "bg-accent text-accent-foreground hover:bg-accent/90 border-accent hover:border-accent focus-visible:ring-accent/50"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-lg px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      // Change default to primary to meet spec: blue (light) / green (dark)
      variant: "primary",
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
