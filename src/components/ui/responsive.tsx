import * as React from "react"
import { cn } from "../../lib/utils"

interface ResponsiveProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const Responsive = React.forwardRef<HTMLDivElement, ResponsiveProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Responsive.displayName = "Responsive"

const ResponsiveGrid = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    cols?: {
      default?: number
      sm?: number
      md?: number
      lg?: number
      xl?: number
    }
  }
>(({ className, cols = { default: 1 }, children, ...props }, ref) => {
  const gridClasses = [
    cols.default && `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
  ].filter(Boolean).join(" ")

  return (
    <div
      ref={ref}
      className={cn("grid gap-4", gridClasses, className)}
      {...props}
    >
      {children}
    </div>
  )
})
ResponsiveGrid.displayName = "ResponsiveGrid"

const ResponsiveStack = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    direction?: "row" | "column"
    spacing?: "sm" | "md" | "lg"
  }
>(({ className, direction = "column", spacing = "md", children, ...props }, ref) => {
  const spacingClasses = {
    sm: direction === "row" ? "space-x-2" : "space-y-2",
    md: direction === "row" ? "space-x-4" : "space-y-4",
    lg: direction === "row" ? "space-x-6" : "space-y-6",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "flex",
        direction === "row" ? "flex-row" : "flex-col",
        spacingClasses[spacing],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
ResponsiveStack.displayName = "ResponsiveStack"

const ResponsiveCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
ResponsiveCard.displayName = "ResponsiveCard"

const ResponsiveContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    width?: string | number
    height?: string | number
  }
>(({ className, width = "100%", height = 300, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("w-full", className)}
      style={{ width, height }}
      {...props}
    >
      {children}
    </div>
  )
})
ResponsiveContainer.displayName = "ResponsiveContainer"

export { Responsive, ResponsiveGrid, ResponsiveStack, ResponsiveCard, ResponsiveContainer }