/**
 * Configuration Types Module
 * =========================
 *
 * This module defines interfaces for application configuration
 * with typed properties for both environment variables and
 * other configuration settings.
 */

/**
 * Rate limiting configuration
 */
export interface RateLimitingConfiguration {
  /** Whether rate limiting is enabled */
  enabled: boolean;
  
  /** Minimum remaining requests before throttling */
  minRemaining: number;
  
  /** Time buffer in ms to add to rate limit reset time */
  resetBufferMs: number;
}

/**
 * Environment configuration loaded from environment variables
 */
export interface ApplicationEnvironmentConfiguration {
  /** GitHub authentication token */
  githubToken: string;
  
  /** Logging level (debug, info, warn, error, fatal) */
  logLevel: string;
  
  /** Name of the MCP server */
  serverName: string;
  
  /** Version of the MCP server */
  serverVersion: string;
  
  /** Timeout for API calls in milliseconds */
  apiTimeoutMs: number;
  
  /** Rate limiting configuration */
  rateLimiting: RateLimitingConfiguration;
}

/**
 * Complete application configuration including 
 * both environment variables and other settings
 */
export interface ApplicationConfiguration extends ApplicationEnvironmentConfiguration {
  // Additional configuration properties that aren't from environment variables
  
  /** Maximum number of retries for API calls */
  maxRetries: number;
}