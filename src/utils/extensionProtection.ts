/**
 * Browser extension interference protection utility
 * Prevents browser extensions from interfering with application state
 */

/**
 * Protects the application from browser extension interference
 * This function can be called at critical points to ensure clean state
 */
export function protectFromExtensionInterference(): void {
  // For now, this is a placeholder function
  // In the future, this could include:
  // - Clearing potentially corrupted localStorage entries
  // - Resetting global variables that might be modified by extensions
  // - Validating critical application state
  
  // Currently just a no-op to maintain consistent API
  return;
}

/**
 * Checks if the current environment might be affected by browser extensions
 * @returns boolean indicating potential extension interference
 */
export function detectPotentialExtensionInterference(): boolean {
  // This could be expanded to detect common extension interference patterns
  return false;
}