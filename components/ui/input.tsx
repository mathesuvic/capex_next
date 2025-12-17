import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(
          // base
          "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base md:text-sm shadow-sm outline-none",
          "placeholder:text-muted-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          // themes
          "selection:bg-primary selection:text-primary-foreground dark:bg-input/30",
          // focus/invalid
          "transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/40",
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"

export { Input }
