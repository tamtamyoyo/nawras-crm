/**
 * Centralized error handling utilities for Supabase operations
 */

import { toast } from 'sonner';
import { devConfig } from '../config/development';

/**
 * Handles Supabase errors with consistent fallback behavior
 * @param error - The error from Supabase operation
 * @param context - Context description for logging
 * @returns boolean - true if should fallback to offline mode, false otherwise
 */
export function handleSupabaseError(error: any, context: string = 'Operation'): boolean {
  console.error(`❌ ${context} error:`, error);
  
  // Check if it's a connection/network error that should trigger offline fallback
  if (error?.message?.includes('Failed to fetch') || 
      error?.message?.includes('NetworkError') ||
      error?.message?.includes('fetch') ||
      error?.code === 'PGRST301' ||
      error?.code === 'PGRST116') {
    
    toast.info('Connection issue detected, switching to offline mode');
    return true; // Should fallback to offline
  }
  
  // For other errors, show error message but don't fallback
  if (error?.message) {
    toast.error(`${context} failed: ${error.message}`);
  } else {
    toast.error(`${context} failed`);
  }
  
  return false; // Don't fallback to offline
}

/**
 * Logs development information if dev logging is enabled
 * @param message - Message to log
 * @param data - Optional data to log
 */
export function logDev(message: string, data?: any): void {
  if (devConfig.enableAuthLogs) {
    if (data) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
}