import * as React from "react"
import { cn } from "../../lib/utils"

interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
}

const VisuallyHidden = React.forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)
VisuallyHidden.displayName = "VisuallyHidden"

interface SkipLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode
}

const SkipLink = React.forwardRef<HTMLAnchorElement, SkipLinkProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <a
        ref={ref}
        className={cn(
          "absolute left-0 top-0 z-50 -translate-y-full bg-background px-4 py-2 text-foreground transition-transform focus:translate-y-0",
          className
        )}
        {...props}
      >
        {children}
      </a>
    )
  }
)
SkipLink.displayName = "SkipLink"

interface FocusTrapProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  active?: boolean
}

const FocusTrap = React.forwardRef<HTMLDivElement, FocusTrapProps>(
  ({ className, children, active = true, ...props }, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const firstFocusableRef = React.useRef<HTMLElement>(null)
    const lastFocusableRef = React.useRef<HTMLElement>(null)

    React.useEffect(() => {
      if (!active || !containerRef.current) return

      const container = containerRef.current
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      firstFocusableRef.current = firstElement
      lastFocusableRef.current = lastElement

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }

      container.addEventListener('keydown', handleKeyDown)
      firstElement.focus()

      return () => {
        container.removeEventListener('keydown', handleKeyDown)
      }
    }, [active])

    return (
      <div
        ref={containerRef}
        className={className}
        {...props}
      >
        {children}
      </div>
    )
  }
)
FocusTrap.displayName = "FocusTrap"

interface AnnouncerProps {
  message: string
  priority?: 'polite' | 'assertive'
}

const Announcer: React.FC<AnnouncerProps> = ({ message, priority = 'polite' }) => {
  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  )
}

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  ariaLabel?: string
}

const AccessibleButton = React.forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ className, children, variant = 'default', size = 'default', ariaLabel, ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    
    const variantClasses = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline"
    }
    
    const sizeClasses = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10"
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        aria-label={ariaLabel}
        {...props}
      >
        {children}
      </button>
    )
  }
)
AccessibleButton.displayName = "AccessibleButton"

export { VisuallyHidden, SkipLink, FocusTrap, Announcer, AccessibleButton }