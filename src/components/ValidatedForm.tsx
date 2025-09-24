import React, { useState, useEffect, useCallback } from 'react'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import formValidationService from '../services/formValidationService'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ValidationError {
  field: string
  message: string
  type: string
}

interface ValidatedFormProps {
  /** Form schema name */
  schema: string
  /** Initial form data */
  initialData?: Record<string, any>
  /** Form submission handler */
  onSubmit: (data: Record<string, any>) => Promise<void> | void
  /** Form change handler */
  onChange?: (data: Record<string, any>, isValid: boolean) => void
  /** Custom validation rules */
  customRules?: Record<string, any>
  /** Show validation on change */
  validateOnChange?: boolean
  /** Show validation on blur */
  validateOnBlur?: boolean
  /** Debounce validation delay */
  debounceMs?: number
  /** Custom className */
  className?: string
  /** Children render function */
  children: (props: {
    formData: Record<string, any>
    errors: ValidationError[]
    isValid: boolean
    isSubmitting: boolean
    handleChange: (field: string, value: any) => void
    handleBlur: (field: string) => void
    handleSubmit: (e: React.FormEvent) => void
    getFieldError: (field: string) => ValidationError | undefined
    hasFieldError: (field: string) => boolean
    clearFieldError: (field: string) => void
    clearAllErrors: () => void
  }) => React.ReactNode
}

const ValidatedForm: React.FC<ValidatedFormProps> = ({
  schema,
  initialData = {},
  onSubmit,
  onChange,
  customRules,
  validateOnChange = true,
  validateOnBlur = true,
  debounceMs = 300,
  className = '',
  children
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(initialData)
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [isValid, setIsValid] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())

  // Register custom rules if provided
  useEffect(() => {
    if (customRules) {
      Object.entries(customRules).forEach(([field, rules]) => {
        formValidationService.registerSchema(schema, { [field]: rules })
      })
    }
  }, [schema, customRules])

  // Validate form
  const validateForm = useCallback(async (data: Record<string, any>, field?: string) => {
    try {
      let result
      if (field) {
        // Validate entire form and extract field-specific error
        const formResult = formValidationService.validateForm(schema, data)
        const fieldError = formResult.errors[field]
        result = {
          isValid: !fieldError,
          errors: fieldError ? [{ message: fieldError, type: 'validation' }] : []
        }
      } else {
        result = formValidationService.validateForm(schema, data)
      }

      if (field) {
        // Update errors for specific field
        setErrors(prev => {
          const filtered = prev.filter(err => err.field !== field)
          if (!result.isValid && result.errors) {
            filtered.push(...result.errors.map(err => ({
              field,
              message: err.message,
              type: err.type
            })))
          }
          return filtered
        })
      } else {
        // Update all errors
        const newErrors: ValidationError[] = []
        if (!result.isValid && result.errors) {
          Object.entries(result.errors).forEach(([fieldName, fieldErrors]) => {
            if (Array.isArray(fieldErrors)) {
              fieldErrors.forEach(err => {
                newErrors.push({
                  field: fieldName,
                  message: err.message,
                  type: err.type
                })
              })
            }
          })
        }
        setErrors(newErrors)
        setIsValid(result.isValid)
      }

      return result
    } catch (error) {
      console.error('Validation error:', error)
      return { isValid: false, errors: [] }
    }
  }, [schema])

  // Debounced validation
  const debouncedValidate = useCallback(
    debounce((data: Record<string, any>, field?: string) => {
      validateForm(data, field)
    }, debounceMs),
    [validateForm, debounceMs]
  )

  // Handle field change
  const handleChange = useCallback((field: string, value: any) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)

    if (validateOnChange && touchedFields.has(field)) {
      debouncedValidate(newData, field)
    }

    // Call onChange callback
    if (onChange) {
      const currentIsValid = errors.filter(err => err.field !== field).length === 0
      onChange(newData, currentIsValid)
    }
  }, [formData, validateOnChange, touchedFields, debouncedValidate, onChange, errors])

  // Handle field blur
  const handleBlur = useCallback((field: string) => {
    setTouchedFields(prev => new Set([...prev, field]))

    if (validateOnBlur) {
      validateForm(formData, field)
    }
  }, [formData, validateOnBlur, validateForm])

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    // Defensive programming: check if event exists and has preventDefault
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault()
    }
    
    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      // Validate entire form
      const result = await validateForm(formData)
      
      if (result.isValid) {
        await onSubmit(formData)
      } else {
        // Mark all fields as touched to show errors
        setTouchedFields(new Set(Object.keys(formData)))
      }
    } catch (error) {
      console.error('Form submission error:', error)
      // Add submission error
      setErrors(prev => [...prev, {
        field: '_form',
        message: 'An error occurred while submitting the form. Please try again.',
        type: 'submission'
      }])
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, isSubmitting, validateForm, onSubmit])

  // Get field error
  const getFieldError = useCallback((field: string) => {
    return errors.find(err => err.field === field)
  }, [errors])

  // Check if field has error
  const hasFieldError = useCallback((field: string) => {
    return errors.some(err => err.field === field)
  }, [errors])

  // Clear field error
  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => prev.filter(err => err.field !== field))
  }, [])

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setErrors([])
  }, [])

  // Update validity when errors change
  useEffect(() => {
    setIsValid(errors.length === 0)
  }, [errors])

  return (
    <form onSubmit={handleSubmit} className={className}>
      {children({
        formData,
        errors,
        isValid,
        isSubmitting,
        handleChange,
        handleBlur,
        handleSubmit,
        getFieldError,
        hasFieldError,
        clearFieldError,
        clearAllErrors
      })}
    </form>
  )
}

// Validated Input Component
interface ValidatedInputProps {
  field: string
  label?: string
  type?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  formProps: {
    formData: Record<string, any>
    handleChange: (field: string, value: any) => void
    handleBlur: (field: string) => void
    getFieldError: (field: string) => ValidationError | undefined
    hasFieldError: (field: string) => boolean
  }
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  field,
  label,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  className = '',
  formProps
}) => {
  const { formData, handleChange, handleBlur, getFieldError, hasFieldError } = formProps
  const error = getFieldError(field)
  const hasError = hasFieldError(field)

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor={field} className={hasError ? 'text-red-600' : ''}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <Input
          id={field}
          type={type}
          value={formData[field] || ''}
          onChange={(e) => handleChange(field, e?.target?.value || '')}
          onBlur={() => handleBlur(field)}
          placeholder={placeholder}
          disabled={disabled}
          className={hasError ? 'border-red-500 focus:border-red-500' : ''}
        />
        
        {hasError && (
          <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
        )}
        
        {!hasError && formData[field] && (
          <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-600 flex items-center space-x-1">
          <AlertCircle className="h-3 w-3" />
          <span>{error.message}</span>
        </p>
      )}
    </div>
  )
}

// Validated Textarea Component
interface ValidatedTextareaProps {
  field: string
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  rows?: number
  className?: string
  formProps: {
    formData: Record<string, any>
    handleChange: (field: string, value: any) => void
    handleBlur: (field: string) => void
    getFieldError: (field: string) => ValidationError | undefined
    hasFieldError: (field: string) => boolean
  }
}

export const ValidatedTextarea: React.FC<ValidatedTextareaProps> = ({
  field,
  label,
  placeholder,
  required = false,
  disabled = false,
  rows = 3,
  className = '',
  formProps
}) => {
  const { formData, handleChange, handleBlur, getFieldError, hasFieldError } = formProps
  const error = getFieldError(field)
  const hasError = hasFieldError(field)

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor={field} className={hasError ? 'text-red-600' : ''}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <Textarea
          id={field}
          value={formData[field] || ''}
          onChange={(e) => handleChange(field, e?.target?.value || '')}
          onBlur={() => handleBlur(field)}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={hasError ? 'border-red-500 focus:border-red-500' : ''}
        />
        
        {hasError && (
          <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-600 flex items-center space-x-1">
          <AlertCircle className="h-3 w-3" />
          <span>{error.message}</span>
        </p>
      )}
    </div>
  )
}

// Validated Select Component
interface ValidatedSelectProps {
  field: string
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  options: { value: string; label: string }[]
  className?: string
  formProps: {
    formData: Record<string, any>
    handleChange: (field: string, value: any) => void
    handleBlur: (field: string) => void
    getFieldError: (field: string) => ValidationError | undefined
    hasFieldError: (field: string) => boolean
  }
}

export const ValidatedSelect: React.FC<ValidatedSelectProps> = ({
  field,
  label,
  placeholder,
  required = false,
  disabled = false,
  options,
  className = '',
  formProps
}) => {
  const { formData, handleChange, handleBlur, getFieldError, hasFieldError } = formProps
  const error = getFieldError(field)
  const hasError = hasFieldError(field)

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor={field} className={hasError ? 'text-red-600' : ''}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <Select
        value={formData[field] || ''}
        onValueChange={(value) => handleChange(field, value)}
        onOpenChange={(open) => !open && handleBlur(field)}
        disabled={disabled}
      >
        <SelectTrigger className={hasError ? 'border-red-500 focus:border-red-500' : ''}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {error && (
        <p className="text-sm text-red-600 flex items-center space-x-1">
          <AlertCircle className="h-3 w-3" />
          <span>{error.message}</span>
        </p>
      )}
    </div>
  )
}

// Form Summary Component
interface FormSummaryProps {
  errors: ValidationError[]
  isValid: boolean
  isSubmitting: boolean
  onClearErrors?: () => void
  className?: string
}

export const FormSummary: React.FC<FormSummaryProps> = ({
  errors,
  isValid,
  isSubmitting,
  onClearErrors,
  className = ''
}) => {
  const fieldErrors = errors.filter(err => err.field !== '_form')
  const formErrors = errors.filter(err => err.field === '_form')

  if (errors.length === 0) {
    return null
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Form-level errors */}
      {formErrors.map((error, index) => (
        <Alert key={index} variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ))}
      
      {/* Field errors summary */}
      {fieldErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Please fix the following errors:</p>
              <ul className="list-disc list-inside space-y-1">
                {fieldErrors.map((error, index) => (
                  <li key={index} className="text-sm">
                    <span className="font-medium">{error.field}:</span> {error.message}
                  </li>
                ))}
              </ul>
              {onClearErrors && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClearErrors}
                  className="mt-2"
                >
                  Clear Errors
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

// Submit Button Component
interface SubmitButtonProps {
  isValid: boolean
  isSubmitting: boolean
  children: React.ReactNode
  disabled?: boolean
  className?: string
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  isValid,
  isSubmitting,
  children,
  disabled = false,
  className = ''
}) => {
  return (
    <Button
      type="submit"
      disabled={disabled || !isValid || isSubmitting}
      className={className}
    >
      {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
      {children}
    </Button>
  )
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export default ValidatedForm