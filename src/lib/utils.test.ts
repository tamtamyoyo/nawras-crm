import { describe, it, expect } from 'vitest'
import { cn, formatCurrency, formatDate, formatDateTime } from './utils'

describe('Utils', () => {
  describe('cn function', () => {
    it('should merge class names correctly', () => {
      const result = cn('class1', 'class2')
      expect(result).toBe('class1 class2')
    })

    it('should handle conditional classes', () => {
      const showConditional = true
      const showHidden = false
      const result = cn('base', showConditional ? 'conditional' : '', showHidden ? 'hidden' : '')
      expect(result).toBe('base conditional')
    })

    it('should handle undefined and null values', () => {
      const result = cn('base', undefined, null, 'valid')
      expect(result).toBe('base valid')
    })

    it('should handle empty strings', () => {
      const result = cn('base', '', 'valid')
      expect(result).toBe('base valid')
    })

    it('should handle arrays of classes', () => {
      const result = cn(['class1', 'class2'], 'class3')
      expect(result).toBe('class1 class2 class3')
    })

    it('should handle objects with boolean values', () => {
      const result = cn({
        'always-present': true,
        'conditionally-present': true,
        'never-present': false
      })
      expect(result).toBe('always-present conditionally-present')
    })

    it('should merge conflicting Tailwind classes correctly', () => {
      // This tests the clsx + tailwind-merge functionality
      const result = cn('px-2 py-1', 'px-4')
      expect(result).toBe('py-1 px-4') // px-4 should override px-2
    })

    it('should handle complex combinations', () => {
      const isActive = true
      const isDisabled = false
      const size = 'large'
      
      const result = cn(
        'base-class',
        {
          'active': isActive,
          'disabled': isDisabled
        },
        size === 'large' ? 'text-lg' : '',
        'final-class'
      )
      
      expect(result).toBe('base-class active text-lg final-class')
    })

    it('should return empty string for no arguments', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('should handle nested arrays and objects', () => {
      const result = cn(
        'base',
        ['array1', 'array2'],
        {
          'object1': true,
          'object2': false
        },
        [['nested', 'array']]
      )
      
      expect(result).toContain('base')
      expect(result).toContain('array1')
      expect(result).toContain('array2')
      expect(result).toContain('object1')
      expect(result).not.toContain('object2')
      expect(result).toContain('nested')
      expect(result).toContain('array')
    })
  })

  describe('formatCurrency function', () => {
    it('should format positive numbers as currency', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
    })

    it('should format zero as currency', () => {
      expect(formatCurrency(0)).toBe('$0.00')
    })

    it('should format negative numbers as currency', () => {
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56')
    })

    it('should format large numbers with commas', () => {
      expect(formatCurrency(1234567.89)).toBe('$1,234,567.89')
    })

    it('should handle decimal precision', () => {
      expect(formatCurrency(10.1)).toBe('$10.10')
      expect(formatCurrency(10)).toBe('$10.00')
    })
  })

  describe('formatDate function', () => {
    it('should format Date object', () => {
      const date = new Date('2024-01-15')
      const result = formatDate(date)
      expect(result).toBe('Jan 15, 2024')
    })

    it('should format date string', () => {
      const result = formatDate('2024-01-15')
      expect(result).toBe('Jan 15, 2024')
    })

    it('should format ISO date string', () => {
      const result = formatDate('2024-01-15T10:30:00Z')
      expect(result).toBe('Jan 15, 2024')
    })
  })

  describe('formatDateTime function', () => {
    it('should format Date object with time', () => {
      const date = new Date('2024-01-15T14:30:00')
      const result = formatDateTime(date)
      expect(result).toMatch(/Jan 15, 2024.*2:30 PM/)
    })

    it('should format date string with time', () => {
      const result = formatDateTime('2024-01-15T14:30:00')
      expect(result).toMatch(/Jan 15, 2024.*2:30 PM/)
    })

    it('should handle different time zones consistently', () => {
      const result = formatDateTime('2024-01-15T00:00:00Z')
      expect(result).toContain('Jan')
      expect(result).toContain('2024')
    })
  })
})