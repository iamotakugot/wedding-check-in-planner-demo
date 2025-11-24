/**
 * Utility functions for ID generation
 */

/**
 * Generate a unique ID using crypto.randomUUID()
 * Falls back to timestamp-based ID if crypto.randomUUID() is not available
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: timestamp + random number
  return `${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
}

/**
 * Generate a short ID (for display purposes)
 * Format: G{timestamp}{random}
 */
export function generateShortId(prefix: string = 'G'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.floor(Math.random() * 1000000).toString(36);
  return `${prefix}${timestamp}${random}`;
}

