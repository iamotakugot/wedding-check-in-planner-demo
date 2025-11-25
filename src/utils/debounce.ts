/**
 * Debounce utility function
 */

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Creates a debounced function that returns a promise
 */
export function debounceAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeout: NodeJS.Timeout | null = null;
  let resolve: ((value: ReturnType<T>) => void) | null = null;
  let reject: ((reason?: unknown) => void) | null = null;

  return function executedFunction(...args: Parameters<T>): Promise<ReturnType<T>> {
    return new Promise<ReturnType<T>>((res, rej) => {
      if (timeout) {
        clearTimeout(timeout);
      }

      resolve = res;
      reject = rej;

      timeout = setTimeout(async () => {
        timeout = null;
        try {
          const result = await func(...args);
          resolve?.(result as ReturnType<T>);
        } catch (error) {
          reject?.(error);
        }
      }, wait);
    });
  };
}

