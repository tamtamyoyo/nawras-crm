interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  email?: boolean
  phone?: boolean
  url?: boolean
  number?: boolean
  min?: number
  max?: number
  custom?: (value: unknown) => string | null
  message?: string
}

interface ValidationSchema {
  [fieldName: string]: ValidationRule
}

interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
  firstError?: string
}

interface FormValidationOptions {
  validateOnChange?: boolean
  validateOnBlur?: boolean
  showFirstErrorOnly?: boolean
  debounceMs?: number
}

class FormValidationService {
  private validationSchemas: Map<string, ValidationSchema> = new Map()
  private validationResults: Map<string, ValidationResult> = new Map()
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map()

  /**
   * Register a validation schema for a form
   */
  registerSchema(formId: string, schema: ValidationSchema): void {
    this.validationSchemas.set(formId, schema)
  }

  /**
   * Validate a single field
   */
  validateField(value: unknown, rules: ValidationRule): string | null {
    // Required validation
    if (rules.required && this.isEmpty(value)) {
      return rules.message || 'This field is required'
    }

    // Skip other validations if field is empty and not required
    if (this.isEmpty(value) && !rules.required) {
      return null
    }

    const stringValue = String(value || '')

    // Email validation
    if (rules.email && !this.isValidEmail(stringValue)) {
      return rules.message || 'Please enter a valid email address'
    }

    // Phone validation
    if (rules.phone && !this.isValidPhone(stringValue)) {
      return rules.message || 'Please enter a valid phone number'
    }

    // URL validation
    if (rules.url && !this.isValidUrl(stringValue)) {
      return rules.message || 'Please enter a valid URL'
    }

    // Number validation
    if (rules.number && !this.isValidNumber(value)) {
      return rules.message || 'Please enter a valid number'
    }

    // Min/Max for numbers
    if (rules.number && typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        return rules.message || `Value must be at least ${rules.min}`
      }
      if (rules.max !== undefined && value > rules.max) {
        return rules.message || `Value must be no more than ${rules.max}`
      }
    }

    // Length validations
    if (rules.minLength && stringValue.length < rules.minLength) {
      return rules.message || `Must be at least ${rules.minLength} characters long`
    }

    if (rules.maxLength && stringValue.length > rules.maxLength) {
      return rules.message || `Must be no more than ${rules.maxLength} characters long`
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(stringValue)) {
      return rules.message || 'Invalid format'
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value)
      if (customError) {
        return customError
      }
    }

    return null
  }

  /**
   * Validate entire form
   */
  validateForm(formId: string, formData: Record<string, any>): ValidationResult {
    const schema = this.validationSchemas.get(formId)
    if (!schema) {
      console.warn(`No validation schema found for form: ${formId}`)
      return { isValid: true, errors: {} }
    }

    const errors: Record<string, string> = {}
    let firstError: string | undefined

    for (const [fieldName, rules] of Object.entries(schema)) {
      const fieldValue = formData[fieldName]
      const error = this.validateField(fieldValue, rules)
      
      if (error) {
        errors[fieldName] = error
        if (!firstError) {
          firstError = error
        }
      }
    }

    const result: ValidationResult = {
      isValid: Object.keys(errors).length === 0,
      errors,
      firstError
    }

    this.validationResults.set(formId, result)
    return result
  }

  /**
   * Validate form with debouncing
   */
  validateFormDebounced(
    formId: string,
    formData: Record<string, unknown>,
    callback: (result: ValidationResult) => void,
    debounceMs: number = 300
  ): void {
    const timerId = this.debounceTimers.get(formId)
    if (timerId) {
      clearTimeout(timerId)
    }

    const newTimerId = setTimeout(() => {
      const result = this.validateForm(formId, formData)
      callback(result)
      this.debounceTimers.delete(formId)
    }, debounceMs)

    this.debounceTimers.set(formId, newTimerId)
  }

  /**
   * Get validation result for a form
   */
  getValidationResult(formId: string): ValidationResult | null {
    return this.validationResults.get(formId) || null
  }

  /**
   * Clear validation results for a form
   */
  clearValidation(formId: string): void {
    this.validationResults.delete(formId)
    const timerId = this.debounceTimers.get(formId)
    if (timerId) {
      clearTimeout(timerId)
      this.debounceTimers.delete(formId)
    }
  }

  /**
   * Get field error message
   */
  getFieldError(formId: string, fieldName: string): string | null {
    const result = this.validationResults.get(formId)
    return result?.errors[fieldName] || null
  }

  /**
   * Check if field has error
   */
  hasFieldError(formId: string, fieldName: string): boolean {
    return !!this.getFieldError(formId, fieldName)
  }

  /**
   * Utility methods
   */
  private isEmpty(value: unknown): boolean {
    if (value === null || value === undefined) return true
    if (typeof value === 'string') return value.trim() === ''
    if (Array.isArray(value)) return value.length === 0
    if (typeof value === 'object') return Object.keys(value).length === 0
    return false
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private isValidPhone(phone: string): boolean {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '')
    // Check if it's a valid length (7-15 digits)
    return digitsOnly.length >= 7 && digitsOnly.length <= 15
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  private isValidNumber(value: unknown): boolean {
    if (typeof value === 'number') return !isNaN(value) && isFinite(value)
    if (typeof value === 'string') {
      const num = parseFloat(value)
      return !isNaN(num) && isFinite(num)
    }
    return false
  }

  /**
   * Common validation schemas
   */
  static getCommonSchemas() {
    return {
      customer: {
        name: {
          required: true,
          minLength: 2,
          maxLength: 100,
          message: 'Customer name is required and must be 2-100 characters'
        },
        email: {
          required: true,
          email: true,
          message: 'Valid email address is required'
        },
        phone: {
          phone: true,
          message: 'Please enter a valid phone number'
        },
        company: {
          maxLength: 100,
          message: 'Company name must be less than 100 characters'
        }
      },
      lead: {
        title: {
          required: true,
          minLength: 3,
          maxLength: 200,
          message: 'Lead title is required and must be 3-200 characters'
        },
        customer_id: {
          required: true,
          message: 'Please select a customer'
        },
        value: {
          number: true,
          min: 0,
          message: 'Lead value must be a positive number'
        },
        probability: {
          number: true,
          min: 0,
          max: 100,
          message: 'Probability must be between 0 and 100'
        }
      },
      deal: {
        title: {
          required: true,
          minLength: 3,
          maxLength: 200,
          message: 'Deal title is required and must be 3-200 characters'
        },
        customer_id: {
          required: true,
          message: 'Please select a customer'
        },
        value: {
          required: true,
          number: true,
          min: 0,
          message: 'Deal value is required and must be a positive number'
        },
        expected_close_date: {
          required: true,
          custom: (value: string) => {
            if (!value) return 'Expected close date is required'
            const date = new Date(value)
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            if (date < today) return 'Expected close date cannot be in the past'
            return null
          }
        }
      },
      proposal: {
        title: {
          required: true,
          minLength: 3,
          maxLength: 200,
          message: 'Proposal title is required and must be 3-200 characters'
        },
        deal_id: {
          required: true,
          message: 'Please select a deal'
        },
        valid_until: {
          required: true,
          custom: (value: string) => {
            if (!value) return 'Valid until date is required'
            const date = new Date(value)
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            if (date <= today) return 'Valid until date must be in the future'
            return null
          }
        }
      },
      contact: {
        name: {
          required: true,
          minLength: 2,
          maxLength: 100,
          message: 'Contact name is required and must be 2-100 characters'
        },
        email: {
          email: true,
          message: 'Please enter a valid email address'
        },
        phone: {
          phone: true,
          message: 'Please enter a valid phone number'
        },
        customer_id: {
          required: true,
          message: 'Please select a customer'
        }
      }
    }
  }

  /**
   * Initialize common schemas
   */
  initializeCommonSchemas(): void {
    const schemas = FormValidationService.getCommonSchemas()
    Object.entries(schemas).forEach(([formId, schema]) => {
      this.registerSchema(formId, schema)
    })
  }

  /**
   * Real-time validation hook for React components
   */
  createValidationHook(formId: string, initialData: Record<string, any> = {}) {
    return {
      validate: (data: Record<string, any>) => this.validateForm(formId, data),
      validateField: (fieldName: string, value: unknown) => {
        const schema = this.validationSchemas.get(formId)
        if (!schema || !schema[fieldName]) return null
        return this.validateField(value, schema[fieldName])
      },
      getError: (fieldName: string) => this.getFieldError(formId, fieldName),
      hasError: (fieldName: string) => this.hasFieldError(formId, fieldName),
      clear: () => this.clearValidation(formId)
    }
  }
}

// Create a singleton instance
const formValidationService = new FormValidationService()

// Initialize common schemas
formValidationService.initializeCommonSchemas()

export default formValidationService
export { FormValidationService }
export type { ValidationRule, ValidationSchema, ValidationResult, FormValidationOptions }