/**
 * Promise Utility Module
 * =====================
 *
 * This module provides utility functions for working with promises,
 * including safe timeout handling and cancellation support.
 */

import { StructuredLoggingUtility } from './structured.logging.utility.js';

/**
 * Interface for a cancellable timeout
 */
export interface CancellableTimeout {
  /** Promise that resolves when the timeout completes */
  promise: Promise<void>;
  /** Function to cancel the timeout */
  cancel: () => void;
}

/**
 * Creates a timeout promise that can be safely cancelled to prevent memory leaks
 * 
 * @param ms - Timeout duration in milliseconds
 * @param description - Optional description for logging
 * @returns A cancellable timeout object
 */
export function createSafeTimeout(ms: number, description?: string): CancellableTimeout {
  // Track if the timeout has been cancelled
  let timeoutId: NodeJS.Timeout;
  let cancelled = false;
  
  // Create the promise
  const promise = new Promise<void>((resolve) => {
    timeoutId = setTimeout(() => {
      // Only resolve if not cancelled
      if (!cancelled) {
        if (description) {
          StructuredLoggingUtility.recordDebugEntry(`Timeout completed: ${description}`, { 
            durationMs: ms 
          });
        }
        resolve();
      }
    }, ms);
  });
  
  // Create the cancel function
  const cancel = () => {
    if (!cancelled) {
      cancelled = true;
      clearTimeout(timeoutId);
      
      if (description) {
        StructuredLoggingUtility.recordDebugEntry(`Timeout cancelled: ${description}`, { 
          durationMs: ms 
        });
      }
    }
  };
  
  return { promise, cancel };
}

/**
 * Wraps a promise with a timeout, rejecting if the promise takes too long
 * 
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param timeoutMessage - Message to use for timeout error
 * @returns Promise that resolves with the original result or rejects on timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>, 
  timeoutMs: number, 
  timeoutMessage: string = 'Operation timed out'
): Promise<T> {
  // Create a timeout promise that rejects
  const timeout = new Promise<never>((_, reject) => {
    const timeoutId = setTimeout(() => {
      clearTimeout(timeoutId);
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });
  
  // Race the original promise against the timeout
  return Promise.race([promise, timeout]);
}

/**
 * Creates a promise that completes when all given promises complete, regardless of their success or failure
 * 
 * @param promises - Array of promises to wait for
 * @returns Promise that resolves when all input promises have either resolved or rejected
 */
export async function allSettled<T>(promises: Promise<T>[]): Promise<Array<{ status: 'fulfilled' | 'rejected'; value?: T; reason?: any; }>> {
  return Promise.all(
    promises.map(p => p
      .then(value => ({ status: 'fulfilled' as const, value }))
      .catch(reason => ({ status: 'rejected' as const, reason }))
    )
  );
}

/**
 * Executes a promise with a retry mechanism for transient failures
 * 
 * @param operation - Function that returns a promise
 * @param retryOptions - Retry configuration options
 * @returns Promise with the operation result
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  retryOptions: {
    maxRetries: number;
    baseDelayMs: number;
    shouldRetry?: (error: unknown) => boolean;
    onRetry?: (error: unknown, attempt: number) => Promise<void>;
  }
): Promise<T> {
  const { maxRetries, baseDelayMs, shouldRetry = () => true, onRetry } = retryOptions;
  
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      if (attempt < maxRetries && shouldRetry(error)) {
        // Calculate backoff delay
        const delay = baseDelayMs * Math.pow(2, attempt);
        
        StructuredLoggingUtility.recordDebugEntry('Operation failed, retrying', {
          attempt,
          nextAttemptIn: delay,
          error: error instanceof Error ? error.message : String(error)
        });
        
        // Wait before retry
        // If a custom retry handler is provided, use it
        if (onRetry) {
          await onRetry(error, attempt);
          continue;
        }
        
        // Otherwise use standard exponential backoff
        const timeout = createSafeTimeout(delay, `Retry delay (attempt ${attempt + 1})`);
        await timeout.promise;
        continue;
      }
      
      // We're out of retries or shouldRetry returned false
      throw lastError;
    }
  }
  
  // This should never happen (loop will either return or throw)
  throw lastError;
}