import { useCallback } from 'react'
import { toast } from 'sonner'

export interface ErrorHandlingOptions {
  showToast?: boolean
  toastMessage?: string
  logError?: boolean
  onError?: (error: Error) => void
}

export const useErrorHandling = () => {
  const handleError = useCallback((
    error: unknown,
    options: ErrorHandlingOptions = {}
  ) => {
    const {
      showToast = true,
      toastMessage,
      logError = true,
      onError
    } = options

    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    
    if (logError) {
      console.error('Error:', error)
    }

    if (showToast) {
      toast.error(toastMessage || errorMessage)
    }

    if (onError && error instanceof Error) {
      onError(error)
    }

    return errorMessage
  }, [])

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options: ErrorHandlingOptions = {}
  ): Promise<T | null> => {
    try {
      return await asyncFn()
    } catch (error) {
      handleError(error, options)
      return null
    }
  }, [handleError])

  const handleSuccess = useCallback((message: string) => {
    toast.success(message)
  }, [])

  const handleInfo = useCallback((message: string) => {
    toast.info(message)
  }, [])

  return {
    handleError,
    handleAsyncError,
    handleSuccess,
    handleInfo
  }
}