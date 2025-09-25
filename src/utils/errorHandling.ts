/**
 * Centralized error handling utilities for Supabase operations
 * Now uses the unified error handling service
 */

import errorHandlingService from '../services/errorHandlingService'

/**
 * Handles Supabase errors with consistent fallback behavior
 * @param error - The error from Supabase operation
 * @param context - Context description for logging
 * @returns boolean - true if should fallback to offline mode, false otherwise
 */
export function handleSupabaseError(error: unknown, context: string = 'Operation'): boolean {
  console.warn(`${context} failed:`, error)
  
  // Check if it's a network error or auth error that should trigger offline mode
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: string }).message.toLowerCase()
    return message.includes('network') || message.includes('fetch') || message.includes('connection')
  }
  
  return false
}

/**
 * Logs development information if dev logging is enabled
 * @param message - Message to log
 * @param data - Optional data to log
 */
export function logDev(message: string, data?: unknown): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV] ${message}`, data)
  }
}