import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "../../lib/utils"
import { Skeleton } from "./skeleton"

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size = "md", ...props }, ref) => {
    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-6 w-6",
      lg: "h-8 w-8",
    }

    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-center", className)}
        {...props}
      >
        <Loader2 className={cn("animate-spin", sizeClasses[size])} />
      </div>
    )
  }
)
LoadingSpinner.displayName = "LoadingSpinner"

interface LoadingDotsProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
}

const LoadingDots = React.forwardRef<HTMLDivElement, LoadingDotsProps>(
  ({ className, size = "md", ...props }, ref) => {
    const sizeClasses = {
      sm: "h-1 w-1",
      md: "h-2 w-2",
      lg: "h-3 w-3",
    }

    return (
      <div
        ref={ref}
        className={cn("flex items-center space-x-1", className)}
        {...props}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "bg-current rounded-full animate-pulse",
              sizeClasses[size]
            )}
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: "1s",
            }}
          />
        ))}
      </div>
    )
  }
)
LoadingDots.displayName = "LoadingDots"

interface LoadingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number
}

const LoadingCard = React.forwardRef<HTMLDivElement, LoadingCardProps>(
  ({ className, lines = 3, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("p-4 space-y-3 border rounded-lg", className)}
        {...props}
      >
        <Skeleton className="h-4 w-3/4" />
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-full" />
        ))}
        <Skeleton className="h-3 w-1/2" />
      </div>
    )
  }
)
LoadingCard.displayName = "LoadingCard"

interface LoadingTableProps extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number
  columns?: number
}

const LoadingTable = React.forwardRef<HTMLDivElement, LoadingTableProps>(
  ({ className, rows = 5, columns = 4, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-3", className)}
        {...props}
      >
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-3 w-full" />
            ))}
          </div>
        ))}
      </div>
    )
  }
)
LoadingTable.displayName = "LoadingTable"

interface PageLoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string
}

const PageLoadingOverlay = React.forwardRef<HTMLDivElement, PageLoadingOverlayProps>(
  ({ className, message = "Loading...", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm",
          className
        )}
        {...props}
      >
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    )
  }
)
PageLoadingOverlay.displayName = "PageLoadingOverlay"

interface StatsLoadingSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  count?: number
}

const StatsLoadingSkeleton = React.forwardRef<HTMLDivElement, StatsLoadingSkeletonProps>(
  ({ className, count = 4, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6", className)}
        {...props}
      >
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="p-6 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-12 w-12 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }
)
StatsLoadingSkeleton.displayName = "StatsLoadingSkeleton"

interface ChartLoadingSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  height?: string
}

const ChartLoadingSkeleton = React.forwardRef<HTMLDivElement, ChartLoadingSkeletonProps>(
  ({ className, height = "h-[300px]", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("p-6 border rounded-lg", className)}
        {...props}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className={cn("w-full", height)} />
        </div>
      </div>
    )
  }
)
ChartLoadingSkeleton.displayName = "ChartLoadingSkeleton"

export { 
  LoadingSpinner, 
  LoadingDots, 
  LoadingCard, 
  LoadingTable, 
  PageLoadingOverlay, 
  StatsLoadingSkeleton, 
  ChartLoadingSkeleton 
}