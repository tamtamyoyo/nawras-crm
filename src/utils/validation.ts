import { z } from 'zod'
import { useState } from 'react'

// Common validation schemas
export const emailSchema = z.string().email('Invalid email format')
export const phoneSchema = z.string().regex(/^[+]?[1-9]?\d{1,14}$/, 'Invalid phone number format')
export const urlSchema = z.string().url('Invalid URL format')
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number')

// Customer validation schema
export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: emailSchema,
  phone: phoneSchema.optional(),
  company: z.string().max(100, 'Company name too long').optional(),
  address: z.string().max(500, 'Address too long').optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
  status: z.enum(['active', 'inactive', 'prospect']).default('active')
})

// Lead validation schema
export const leadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: emailSchema,
  phone: phoneSchema.optional(),
  company: z.string().max(100, 'Company name too long').optional(),
  source: z.string().max(50, 'Source too long').optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).default('new'),
  notes: z.string().max(1000, 'Notes too long').optional(),
  value: z.number().min(0, 'Value must be positive').optional()
})

// Deal validation schema
export const dealSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  customer_id: z.string().uuid('Invalid customer ID'),
  value: z.number().min(0, 'Value must be positive'),
  stage: z.enum(['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).default('prospecting'),
  probability: z.number().min(0, 'Probability must be 0-100').max(100, 'Probability must be 0-100').default(50),
  expected_close_date: z.string().refine((date) => {
    const parsed = new Date(date)
    return !isNaN(parsed.getTime()) && parsed >= new Date()
  }, 'Expected close date must be a valid future date'),
  description: z.string().max(1000, 'Description too long').optional(),
  notes: z.string().max(1000, 'Notes too long').optional()
})

// Proposal validation schema
export const proposalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  customer_id: z.string().uuid('Invalid customer ID'),
  deal_id: z.string().uuid('Invalid deal ID').optional(),
  content: z.string().min(1, 'Content is required'),
  total_amount: z.number().min(0, 'Amount must be positive'),
  status: z.enum(['draft', 'sent', 'viewed', 'accepted', 'rejected']).default('draft'),
  valid_until: z.string().refine((date) => {
    const parsed = new Date(date)
    return !isNaN(parsed.getTime()) && parsed >= new Date()
  }, 'Valid until date must be a valid future date'),
  terms: z.string().max(2000, 'Terms too long').optional()
})

// Invoice validation schema
export const invoiceSchema = z.object({
  invoice_number: z.string().min(1, 'Invoice number is required').max(50, 'Invoice number too long'),
  customer_id: z.string().uuid('Invalid customer ID'),
  deal_id: z.string().uuid('Invalid deal ID').optional(),
  proposal_id: z.string().uuid('Invalid proposal ID').optional(),
  amount: z.number().min(0, 'Amount must be positive'),
  tax_amount: z.number().min(0, 'Tax amount must be positive').default(0),
  total_amount: z.number().min(0, 'Total amount must be positive'),
  due_date: z.string().refine((date) => {
    const parsed = new Date(date)
    return !isNaN(parsed.getTime())
  }, 'Due date must be a valid date'),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).default('draft'),
  description: z.string().max(1000, 'Description too long').optional(),
  notes: z.string().max(1000, 'Notes too long').optional()
})

// User profile validation schema
export const userProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: emailSchema,
  phone: phoneSchema.optional(),
  company: z.string().max(100, 'Company name too long').optional(),
  role: z.string().max(50, 'Role too long').optional()
})

// Search/filter validation schemas
export const searchSchema = z.object({
  query: z.string().max(100, 'Search query too long').optional(),
  page: z.number().min(1, 'Page must be positive').default(1),
  limit: z.number().min(1, 'Limit must be positive').max(100, 'Limit too large').default(10),
  sort_by: z.string().max(50, 'Sort field too long').optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc')
})

// Sanitization functions
export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

export const sanitizeString = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ')
}

export const sanitizeNumber = (input: unknown): number | null => {
  const num = parseFloat(String(input))
  return isNaN(num) ? null : num
}

export const sanitizeBoolean = (input: unknown): boolean => {
  if (typeof input === 'boolean') return input
  if (typeof input === 'string') {
    return input.toLowerCase() === 'true'
  }
  return Boolean(input)
}

// Validation helper functions
export const validateAndSanitize = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } => {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => {
        const path = err.path.join('.')
        return path ? `${path}: ${err.message}` : err.message
      })
      return { success: false, errors }
    }
    return { success: false, errors: ['Validation failed'] }
  }
}

export const validateField = <T>(
  schema: z.ZodSchema<T>,
  value: unknown
): { isValid: boolean; error?: string } => {
  try {
    schema.parse(value)
    return { isValid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0]?.message || 'Invalid value' }
    }
    return { isValid: false, error: 'Validation failed' }
  }
}

// Form validation hook
export const useFormValidation = <T>(
  schema: z.ZodSchema<T>,
  initialData: Partial<T> = {}
) => {
  const [data, setData] = useState<Partial<T>>(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})

  const validateSingleField = (field: keyof T, value: unknown) => {
    try {
      // Create a partial schema for single field validation
      const partialData = { [field]: value } as Partial<T>
      const result = schema.safeParse({ ...data, ...partialData })
      if (result.success) {
        setErrors(prev => ({ ...prev, [field]: '' }))
        return true
      } else {
        const fieldError = result.error.errors.find(err => err.path.includes(field as string))
        if (fieldError) {
          setErrors(prev => ({ ...prev, [field]: fieldError.message }))
        }
        return false
      }
    } catch {
      setErrors(prev => ({ ...prev, [field]: 'Validation error' }))
      return false
    }
  }

  const validateAll = (): boolean => {
    const result = validateAndSanitize(schema, data)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      const errorResult = result as { success: false; errors: string[] }
      if (errorResult.errors) {
        errorResult.errors.forEach(error => {
          const [field, message] = error.split(': ')
          if (field && message) {
            fieldErrors[field] = message
          }
        })
      }
      setErrors(fieldErrors)
      return false
    }
    setErrors({})
    return true
  }

  const setValue = (field: keyof T, value: unknown) => {
    setData(prev => ({ ...prev, [field]: value }))
    if (touchedFields[field as string]) {
      validateSingleField(field, value)
    }
  }

  const setFieldTouched = (field: keyof T) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }))
    validateSingleField(field, data[field])
  }

  const reset = () => {
    setData(initialData)
    setErrors({})
    setTouchedFields({})
  }

  return {
    data,
    errors,
    touched: touchedFields,
    setValue,
    setTouched: setFieldTouched,
    validateAll,
    reset,
    isValid: Object.keys(errors).length === 0
  }
}

// Export validation schemas
export const validationSchemas = {
  customer: customerSchema,
  lead: leadSchema,
  deal: dealSchema,
  proposal: proposalSchema,
  invoice: invoiceSchema,
  userProfile: userProfileSchema,
  search: searchSchema
}