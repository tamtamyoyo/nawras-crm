import { useState, useCallback } from 'react'

export interface LoadingState {
  loading: boolean
  error: string | null
}

export const useLoading = (initialLoading = false) => {
  const [loading, setLoading] = useState(initialLoading)
  const [error, setError] = useState<string | null>(null)

  const startLoading = useCallback(() => {
    setLoading(true)
    setError(null)
  }, [])

  const stopLoading = useCallback(() => {
    setLoading(false)
  }, [])

  const setLoadingError = useCallback((errorMessage: string) => {
    setLoading(false)
    setError(errorMessage)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const withLoading = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    errorMessage?: string
  ): Promise<T | null> => {
    try {
      startLoading()
      const result = await asyncFn()
      stopLoading()
      return result
    } catch (err) {
      const message = errorMessage || (err instanceof Error ? err.message : 'An error occurred')
      setLoadingError(message)
      return null
    }
  }, [startLoading, stopLoading, setLoadingError])

  return {
    loading,
    error,
    startLoading,
    stopLoading,
    setLoadingError,
    clearError,
    withLoading
  }
}