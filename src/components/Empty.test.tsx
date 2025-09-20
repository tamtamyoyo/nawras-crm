import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Empty from './Empty'

describe('Empty', () => {
  it('should render empty component with correct text', () => {
    render(<Empty />)
    
    expect(screen.getByText('Empty')).toBeInTheDocument()
  })

  it('should have correct CSS classes', () => {
    render(<Empty />)
    
    const emptyElement = screen.getByText('Empty')
    expect(emptyElement).toHaveClass('flex', 'h-full', 'items-center', 'justify-center')
  })

  it('should render as a div element', () => {
    render(<Empty />)
    
    const emptyElement = screen.getByText('Empty')
    expect(emptyElement.tagName).toBe('DIV')
  })
})