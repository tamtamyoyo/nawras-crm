import React from 'react'

// Hook for responsive breakpoints
export function useResponsive() {
  const [breakpoint, setBreakpoint] = React.useState<'sm' | 'md' | 'lg' | 'xl' | '2xl' | null>(null)

  React.useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      if (width >= 1536) setBreakpoint('2xl')
      else if (width >= 1280) setBreakpoint('xl')
      else if (width >= 1024) setBreakpoint('lg')
      else if (width >= 768) setBreakpoint('md')
      else if (width >= 640) setBreakpoint('sm')
      else setBreakpoint(null)
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  return {
    breakpoint,
    isSm: breakpoint === 'sm',
    isMd: breakpoint === 'md',
    isLg: breakpoint === 'lg',
    isXl: breakpoint === 'xl',
    is2Xl: breakpoint === '2xl',
    isSmUp: breakpoint && ['sm', 'md', 'lg', 'xl', '2xl'].includes(breakpoint),
    isMdUp: breakpoint && ['md', 'lg', 'xl', '2xl'].includes(breakpoint),
    isLgUp: breakpoint && ['lg', 'xl', '2xl'].includes(breakpoint),
    isXlUp: breakpoint && ['xl', '2xl'].includes(breakpoint)
  }
}