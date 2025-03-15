/**
 * Application Configuration Module
 * ===============================
 *
 * This module provides a centralized configuration system for the application.
 * It combines environment variables and default application settings.
 */

import { ApplicationConfiguration } from './configuration.types.js';
import { loadEnvironmentConfiguration } from './environment.config.js';
import { StructuredLoggingUtility } from '../utilities/structured.logging.utility.js';

// Singleton instance of the application configuration
let configurationInstance: ApplicationConfiguration | null = null;

/**
 * Gets the application configuration, loading it if not already loaded
 * 
 * @returns The application configuration
 */
export function getApplicationConfiguration(): ApplicationConfiguration {
  if (!configurationInstance) {
    // Load environment variables
    const envConfig = loadEnvironmentConfiguration();
    
    // Create the complete configuration by adding non-environment settings
    configurationInstance = {
      ...envConfig,
      
      // Add additional configuration values here
      maxRetries: 3,
      apiTimeoutMs: 10000
    };
    
    StructuredLoggingUtility.recordInfoEntry('Application configuration initialized');
    
    // Set the log level based on configuration
    StructuredLoggingUtility.setLogLevel(configurationInstance!.logLevel);
  }
  
  // Configuration is guaranteed to be initialized at this point
  return configurationInstance!;
}

/**
 * Resets the configuration singleton (mainly for testing)
 */
export function resetApplicationConfiguration(): void {
  configurationInstance = null;
  StructuredLoggingUtility.recordDebugEntry('Application configuration reset');
}