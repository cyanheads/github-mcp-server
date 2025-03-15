/**
 * Environment Configuration Module
 * ================================
 *
 * This module handles loading and validating environment variables
 * required for the application to function properly.
 */

import { config } from 'dotenv';
import { StructuredLoggingUtility } from '../utilities/structured.logging.utility.js';
import { ApplicationErrorHandlingUtility } from '../utilities/error.handling.utility.js';
import { ErrorCategoryType, ErrorSeverityLevel } from '../types/error.definition.types.js';
import { ApplicationEnvironmentConfiguration } from './configuration.types.js';

/**
 * Configuration keys type
 */
type ConfigKey = 'LOG_LEVEL' | 'SERVER_NAME' | 'SERVER_VERSION' | 'API_TIMEOUT_MS' | 
                'RATE_LIMIT_ENABLED' | 'MIN_RATE_LIMIT_REMAINING' | 'RATE_LIMIT_RESET_BUFFER_MS';

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Record<ConfigKey, string> = {
  LOG_LEVEL: 'info',
  SERVER_NAME: 'github-mcp-server',
  SERVER_VERSION: '0.2.0',
  API_TIMEOUT_MS: '10000',
  RATE_LIMIT_ENABLED: 'true',
  MIN_RATE_LIMIT_REMAINING: '50',
  RATE_LIMIT_RESET_BUFFER_MS: '5000'
};

/**
 * Validates a GitHub token format
 * 
 * @param token - The GitHub token to validate
 * @returns Boolean indicating if token format is valid
 */
function validateGitHubToken(token: string): boolean {
  // GitHub personal access tokens typically start with 'ghp_' and are 40+ chars
  // OAuth tokens typically start with 'gho_'
  // App installation tokens start with 'ghs_' or 'ghu_'
  const validPrefixes = ['ghp_', 'gho_', 'ghs_', 'ghu_'];
  const hasValidPrefix = validPrefixes.some(prefix => token.startsWith(prefix));
  
  // Basic validation: check for prefix and minimum length
  // Token length varies based on type, but should be at least 36 characters
  const isValidLength = token.length >= 36;
  
  // If token doesn't have a standard prefix, check if it might be a classic token
  // Classic tokens are 40 hex characters
  const couldBeClassicToken = /^[a-f0-9]{40}$/i.test(token);
  
  // Token is valid if it has a valid prefix and length OR if it's a classic token
  return (hasValidPrefix && isValidLength) || couldBeClassicToken;
}

/**
 * Gets an environment variable with validation
 * 
 * @param key - The environment variable key
 * @param required - Whether the variable is required
 * @param defaultValue - Default value if not provided
 * @returns The environment variable value or default
 * @throws Error if a required variable is missing
 */
function getEnvVariable(key: ConfigKey, required: boolean, defaultValue?: string): string {
  const value = process.env[key] || defaultValue || DEFAULT_CONFIG[key];
  
  if (required && !value) {
    const errorMessage = `${key} environment variable is required`;
    StructuredLoggingUtility.recordFatalEntry(errorMessage);
    throw new Error(errorMessage);
  }
  
  return value || '';
}

/**
 * Gets a non-configuration environment variable
 * and performs additional validation for specific variables
 * 
 * @param key - The environment variable key
 * @param required - Whether the variable is required
 * @param defaultValue - Default value if not provided
 * @returns The environment variable value or default
 * @throws Error if a required variable is missing
 */
function getNonConfigEnvVariable(key: string, required: boolean, defaultValue?: string): string {
  let value = process.env[key] || defaultValue;
  
  if (required && !value) {
    const errorMessage = `${key} environment variable is required`;
    StructuredLoggingUtility.recordFatalEntry(errorMessage, { key });
    throw new Error(errorMessage);
  }
  
  // Special validation for GitHub token
  if (key === 'GITHUB_TOKEN' && value) {
    if (!validateGitHubToken(value)) {
      const errorMessage = 'GITHUB_TOKEN appears to be invalid, check format and permissions';
      StructuredLoggingUtility.recordFatalEntry(errorMessage, { 
        tokenLength: value.length,
        tokenPrefix: value.substring(0, 4),
        hint: 'GitHub tokens should follow specific format patterns'
      });
      
      throw ApplicationErrorHandlingUtility.createAuthenticationError(errorMessage);
    }    
  }
  
  return value || '';
}

/**
 * Parse numeric environment variable
 * 
 * @param value - The string value to parse
 * @param fallback - Fallback value if parsing fails
 * @returns The parsed number or fallback
 */
function parseNumericEnv(value: string, fallback: number): number {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    StructuredLoggingUtility.recordWarnEntry(`Failed to parse numeric value, using fallback`, {
      value,
      fallback
    });
    return fallback;
  }
  return parsed;
}

/**
 * Parse boolean environment variable
 * 
 * @param value - The string value to parse
 * @param fallback - Fallback value if parsing fails
 * @returns The parsed boolean or fallback
 */
function parseBooleanEnv(value: string, fallback: boolean): boolean {
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  
  StructuredLoggingUtility.recordWarnEntry(`Failed to parse boolean value, using fallback`, {
    value,
    fallback
  });
  return fallback;
}

/**
 * Loads and validates environment variables
 * @returns Validated environment configuration
 * @throws Error if required environment variables are missing
 */
export function loadEnvironmentConfiguration(): ApplicationEnvironmentConfiguration {
  // Load environment variables from .env file
  config();
  
  // Get required variables
  const githubToken = getNonConfigEnvVariable('GITHUB_TOKEN', true);

  // Log token information (securely)
  StructuredLoggingUtility.recordInfoEntry('GitHub token loaded', {
    tokenType: githubToken.substring(0, 4),
    tokenLength: githubToken.length,
    tokenExpiryCheck: 'Performed'
  });
  
  // Get optional variables with defaults
  const logLevel = getEnvVariable('LOG_LEVEL', false);
  const serverName = getEnvVariable('SERVER_NAME', false);
  const serverVersion = getEnvVariable('SERVER_VERSION', false);
  
  // API and rate limiting configuration
  const apiTimeoutMs = parseNumericEnv(
    getEnvVariable('API_TIMEOUT_MS', false),
    10000
  );
  
  const rateLimitEnabled = parseBooleanEnv(
    getEnvVariable('RATE_LIMIT_ENABLED', false),
    true
  );
  
  const minRateLimitRemaining = parseNumericEnv(
    getEnvVariable('MIN_RATE_LIMIT_REMAINING', false),
    50
  );
  
  const rateLimitResetBufferMs = parseNumericEnv(
    getEnvVariable('RATE_LIMIT_RESET_BUFFER_MS', false),
    5000
  );
  
  StructuredLoggingUtility.recordInfoEntry('Environment configuration loaded', {
    logLevel,
    serverName,
    serverVersion,
    apiTimeoutMs,
    rateLimitEnabled,
    minRateLimitRemaining
  });
  
  // Return validated configuration
  return {
    githubToken,
    logLevel,
    serverName,
    serverVersion,
    apiTimeoutMs,
    rateLimiting: {
      enabled: rateLimitEnabled,
      minRemaining: minRateLimitRemaining,
      resetBufferMs: rateLimitResetBufferMs
    }
  };
}