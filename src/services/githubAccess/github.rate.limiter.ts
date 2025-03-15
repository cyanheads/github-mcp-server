/**
 * GitHub Rate Limiter Module
 * ========================
 *
 * This module provides rate limiting functionality for GitHub API requests
 * to prevent hitting rate limits and handle rate limit responses gracefully.
 */

import { getApplicationConfiguration } from '../../configuration/index.export.js';
import { StructuredLoggingUtility } from '../../utilities/structured.logging.utility.js';
import { ApplicationErrorHandlingUtility } from '../../utilities/error.handling.utility.js';
import { asRecord } from '../../utilities/type.casting.utility.js';

/**
 * Simple mutex implementation to prevent race conditions
 */
class AsyncMutex {
  private _locking: Promise<void> = Promise.resolve();
  private _locked = false;

  /**
   * Acquires the mutex lock
   * @returns Promise that resolves when the lock is acquired
   */
  async acquire(): Promise<() => void> {
    // Wait for any ongoing operations to complete
    await this._locking;

    // Create a new promise to represent this lock
    let releaseFn: () => void;
    this._locked = true;
    
    // Set up the next locking promise
    this._locking = new Promise<void>(resolve => {
      releaseFn = () => {
        this._locked = false;
        resolve();
      };
    });

    // Return the release function
    return releaseFn!;
  }

  /**
   * Checks if the mutex is currently locked
   * @returns Whether the mutex is locked
   */
  get isLocked(): boolean {
    return this._locked;
  }
}

/**
 * Rate limit information
 */
interface RateLimitInfo {
  /** Number of requests remaining in the rate limit window */
  remaining: number;
  
  /** Timestamp when the rate limit resets (in ms since epoch) */
  resetTime: number;
  
  /** Maximum requests allowed per rate limit window */
  limit: number;
}

/**
 * Rate limiting service for GitHub API requests
 */
export class GitHubRateLimiter {
  private mutex = new AsyncMutex();
  private rateLimitInfo: RateLimitInfo = {
    remaining: 5000, // GitHub's default rate limit
    resetTime: Date.now() + 3600000, // Default assume 1 hour
    limit: 5000
  };
  
  private config = getApplicationConfiguration().rateLimiting;
  
  /**
   * Check if we should throttle requests based on rate limit state
   * 
   * @returns Promise that resolves when it's safe to proceed
   * @throws Error if rate limit prevents the request
   */
  async checkRateLimit(): Promise<void> {
    // Acquire lock to prevent race conditions
    const release = await this.mutex.acquire();
    
    try {
      if (!this.config.enabled) {
        return; // Rate limiting disabled
      }
      
      const now = Date.now();
      const resetTime = this.rateLimitInfo.resetTime;
      
      // If we've exceeded our safety threshold
      if (this.rateLimitInfo.remaining <= this.config.minRemaining) {
        const waitTime = resetTime - now + this.config.resetBufferMs;
        
        // If reset time is in the future, wait until reset
        if (waitTime > 0) {
          StructuredLoggingUtility.recordWarnEntry('Rate limit approached, throttling request', {
            remaining: this.rateLimitInfo.remaining,
            limit: this.rateLimitInfo.limit,
            resetInMs: waitTime
          });
          
          // If wait time is too long, throw an error instead of waiting
          if (waitTime > 60000) { // Don't wait more than 1 minute
            throw ApplicationErrorHandlingUtility.createGithubApiError(
              'GitHub API rate limit exceeded, cannot proceed with request',
              {
                remaining: this.rateLimitInfo.remaining,
                resetTime: new Date(resetTime).toISOString(),
                waitTime
              }
            );
          }
          
          // Wait until rate limit resets
          // Store timeout reference to prevent memory leaks
          const timeoutPromise = new Promise(resolve => {
            const timeoutId = setTimeout(() => {
              resolve(null);
              clearTimeout(timeoutId); // Cleanup the timeout
            }, waitTime);
          });
          
          await timeoutPromise;
          
          // Don't reset rate limit info manually
          // The next API call will update rate limit info from response headers
          StructuredLoggingUtility.recordInfoEntry('Waited for rate limit reset', {
            waitTimeMs: waitTime
          });
        }
      }
    } finally {
      // Always release the lock
      release();
    }
  }
  
  /**
   * Update rate limit information from API response headers
   * 
   * @param headers - Response headers from GitHub API
   */
  updateRateLimitFromHeaders(headers: Record<string, any>): void {
    // For updates, we need to ensure thread safety
    // We'll use a non-blocking approach by creating and then applying the update
    const remaining = headers['x-ratelimit-remaining'];
    const resetTime = headers['x-ratelimit-reset'];
    const limit = headers['x-ratelimit-limit'];
    
    if (remaining !== undefined && resetTime !== undefined && limit !== undefined) {
      // Create the new rate limit info
      const newRateLimitInfo = {
        remaining: parseInt(remaining, 10),
        resetTime: parseInt(resetTime, 10) * 1000, // Convert to milliseconds
        limit: parseInt(limit, 10)
      };
      
      // Apply the update safely in an async context
      this.safelyUpdateRateLimitInfo(newRateLimitInfo);
    }
  }
  
  /**
   * Safely updates rate limit info with mutex protection
   * 
   * @param newInfo - New rate limit information
   */
  private async safelyUpdateRateLimitInfo(newInfo: RateLimitInfo): Promise<void> {
    // Use mutex to prevent race conditions
    const release = await this.mutex.acquire();
    
    try {
      // Update the rate limit info
      this.rateLimitInfo = newInfo;
      StructuredLoggingUtility.recordDebugEntry('Rate limit info updated', asRecord(this.rateLimitInfo));
    } finally {
      // Always release the lock
      release();
    }
  }
  
  /**
   * Handle rate limit exceeded error
   * 
   * @param retryAfter - Optional retry-after header value
   * @returns Promise that resolves when it's safe to retry
   * @throws Error if retry isn't possible
   */
  async handleRateLimitExceeded(retryAfter?: string): Promise<void> {
    // Acquire lock to prevent race conditions
    const release = await this.mutex.acquire();
    
    try {
      let waitTime = this.config.resetBufferMs;
      
      // Use retry-after header if available
      if (retryAfter) {
        waitTime = parseInt(retryAfter, 10) * 1000;
      } else if (this.rateLimitInfo.resetTime > Date.now()) {
        waitTime = this.rateLimitInfo.resetTime - Date.now() + this.config.resetBufferMs;
      }
      
      StructuredLoggingUtility.recordWarnEntry('Rate limit exceeded, waiting to retry', {
        waitTimeMs: waitTime
      });
      
      // If wait time is too long, throw an error instead of waiting
      if (waitTime > 120000) { // Don't wait more than 2 minutes
        throw ApplicationErrorHandlingUtility.createGithubApiError(
          'GitHub API rate limit exceeded, retry not possible',
          {
            resetTime: new Date(this.rateLimitInfo.resetTime).toISOString(),
            waitTime
          }
        );
      }
      
      // Wait until we can retry with proper cleanup
      const timeoutPromise = new Promise(resolve => {
        const timeoutId = setTimeout(() => {
          resolve(null);
          clearTimeout(timeoutId); // Cleanup the timeout
        }, waitTime);
      });
      
      await timeoutPromise;
    } finally {
      // Always release the lock
      release();
    }
  }
}

/**
 * Singleton instance of the GitHub rate limiter
 */
let limiterInstance: GitHubRateLimiter | null = null;

/**
 * Gets the GitHub rate limiter instance
 * @returns GitHub rate limiter instance
 */
export function getGitHubRateLimiter(): GitHubRateLimiter {
  if (!limiterInstance) {
    limiterInstance = new GitHubRateLimiter();
  }
  return limiterInstance;
}