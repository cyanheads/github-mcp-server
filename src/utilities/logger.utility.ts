/**
 * Logger Utility Module
 * =====================
 *
 * This module provides standardized logging functionality across the application.
 * It leverages Winston for structured logging with support for multiple outputs
 * and configurable formats.
 */

import fs from "fs";
import path from "path";
import winston from "winston";
import { ErrorSeverityLevel } from '../types/error.definition.types.js';

/**
 * Supported log levels
 */
export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

/**
 * Log format types
 */
export type LogFormat = "json" | "simple" | "detailed";

/**
 * Logger configuration options
 */
export interface LoggerConfig {
  /** Log level (debug, info, warn, error, fatal) */
  level?: LogLevel;
  /** Directory for log files */
  logDir?: string;
  /** Format for log output */
  format?: LogFormat;
  /** Whether to log to console (should be false) */
  console?: boolean;
  /** Whether to log to files */
  files?: boolean;
  /** Custom file names for log files */
  fileNames?: {
    combined?: string;
    error?: string;
    warn?: string;
    info?: string;
    debug?: string;
  };
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: "info",
  logDir: "logs",
  format: "detailed",
  console: false, // Never log to console by default
  files: true,
  fileNames: {
    combined: "combined.log",
    error: "error.log",
    warn: "warn.log",
    info: "info.log",
    debug: "debug.log"
  }
};

/**
 * Maps ErrorSeverityLevel to Winston log levels
 */
const severityToLogLevel = (severity: ErrorSeverityLevel): string => {
  switch (severity) {
    case ErrorSeverityLevel.SEVERITY_INFO:
      return 'info';
    case ErrorSeverityLevel.SEVERITY_WARN:
      return 'warn';
    case ErrorSeverityLevel.SEVERITY_ERROR:
      return 'error';
    case ErrorSeverityLevel.SEVERITY_FATAL:
      return 'error'; // Winston doesn't have 'fatal', so map to 'error'
    default:
      return 'info';
  }
};

/**
 * Logger class with configuration options
 * Implements the Singleton pattern for consistent logging across the application
 */
export class Logger {
  private static instance: Logger;
  // Initialize with a minimal logger to avoid TypeScript errors
  private logger: winston.Logger = winston.createLogger({ 
    transports: [] // Initialize with no transports to avoid any console logging
  });
  private config: LoggerConfig;
  
  /**
   * Private constructor (use getInstance instead)
   * @param config Initial logger configuration
   */
  private constructor(config: LoggerConfig = {}) {
    // Merge provided config with defaults
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      fileNames: {
        ...DEFAULT_CONFIG.fileNames,
        ...config.fileNames
      }
    };
    
    this.initializeLogger();
  }

  /**
   * Get or create the singleton logger instance
   * @param config Optional configuration to override defaults
   * @returns The logger instance
   */
  public static getInstance(config?: LoggerConfig): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    } else if (config) {
      // Update configuration if provided
      Logger.instance.configure(config);
    }
    return Logger.instance;
  }

  /**
   * Updates logger configuration
   * @param config New configuration options
   */
  public configure(config: LoggerConfig): void {
    // Merge new config with current config
    this.config = {
      ...this.config,
      ...config,
      fileNames: {
        ...this.config.fileNames,
        ...config.fileNames
      }
    };
    
    // Reinitialize the logger with new config
    this.initializeLogger();
  }

  /**
   * Initialize or reinitialize the Winston logger
   */
  private initializeLogger(): void {
    // Create logs directory if it doesn't exist and file logging is enabled
    if (this.config.files && this.config.logDir) {
      if (!fs.existsSync(this.config.logDir)) {
        try {
          fs.mkdirSync(this.config.logDir, { recursive: true });
        } catch (error) {
          // Silently continue - we'll use a silent transport as fallback
        }
      }
    }

    // Create log formats based on configuration
    const logFormat = this.createLogFormat(this.config.format);
    
    // Initialize transports array with a silent transport to avoid "no transports" warning
    const transports: winston.transport[] = [
      new winston.transports.Console({
        silent: true, // Silent transport that doesn't output logs
        format: logFormat
      })
    ];
    
    // Add file transports if enabled
    if (this.config.files && this.config.logDir) {
      try {
        const fileNames = this.config.fileNames || DEFAULT_CONFIG.fileNames;
        
        // Combined log file
        if (fileNames?.combined) {
          transports.push(new winston.transports.File({
            filename: path.join(this.config.logDir, fileNames.combined),
            format: logFormat
          }));
        }
        
        // Level-specific log files
        if (fileNames?.error) {
          transports.push(new winston.transports.File({
            filename: path.join(this.config.logDir, fileNames.error),
            level: 'error',
            format: logFormat
          }));
        }
        
        if (fileNames?.warn) {
          transports.push(new winston.transports.File({
            filename: path.join(this.config.logDir, fileNames.warn),
            level: 'warn',
            format: logFormat
          }));
        }
        
        if (fileNames?.info) {
          transports.push(new winston.transports.File({
            filename: path.join(this.config.logDir, fileNames.info),
            level: 'info',
            format: logFormat
          }));
        }
        
        if (fileNames?.debug) {
          transports.push(new winston.transports.File({
            filename: path.join(this.config.logDir, fileNames.debug),
            level: 'debug',
            format: logFormat
          }));
        }
      } catch (error) {
        // Silently continue with just the silent transport if file transports fail
      }
    }

    // Create the Winston logger
    this.logger = winston.createLogger({
      level: this.config.level || DEFAULT_CONFIG.level,
      format: winston.format.json(),
      defaultMeta: { service: 'github-mcp-server' },
      transports
    });
  }

  /**
   * Create the appropriate log format based on configuration
   * @param format Format type string
   * @returns Winston format
   */
  private createLogFormat(format: LogFormat = "detailed"): winston.Logform.Format {
    switch (format) {
      case "json":
        return winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        );
        
      case "simple":
        return winston.format.combine(
          winston.format.timestamp(),
          winston.format.printf((info: winston.Logform.TransformableInfo) => {
            return `[${info.timestamp}] ${info.level}: ${info.message}`;
          })
        );
        
      case "detailed":
      default:
        return winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.printf((info: winston.Logform.TransformableInfo) => {
            const contextStr = info.context ? `\n  Context: ${JSON.stringify(info.context, null, 2)}` : "";
            const stackStr = info.stack ? `\n  Stack: ${info.stack}` : "";
            return `[${info.timestamp}] ${info.level}: ${info.message}${contextStr}${stackStr}`;
          })
        );
    }
  }

  /**
   * Log a debug message
   * @param message The message to log
   * @param context Optional context object
   */
  public debug(message: string, context?: Record<string, unknown>): void {
    this.logger.debug(message, { context });
  }

  /**
   * Log an info message
   * @param message The message to log
   * @param context Optional context object
   */
  public info(message: string, context?: Record<string, unknown>): void {
    this.logger.info(message, { context });
  }

  /**
   * Log a warning message
   * @param message The message to log
   * @param context Optional context object
   */
  public warn(message: string, context?: Record<string, unknown>): void {
    this.logger.warn(message, { context });
  }

  /**
   * Log an error message
   * @param message The message to log
   * @param context Optional context object
   */
  public error(message: string, context?: Record<string, unknown>): void {
    this.logger.error(message, { context });
  }

  /**
   * Log a fatal error message (maps to error in Winston)
   * @param message The message to log
   * @param context Optional context object
   */
  public fatal(message: string, context?: Record<string, unknown>): void {
    this.logger.error(message, { context, level: 'fatal' });
  }

  /**
   * Log an exception with full stack trace
   * @param message The error message
   * @param error The error object
   * @param context Additional context
   */
  public exception(message: string, error: Error, context?: Record<string, unknown>): void {
    this.logger.error(message, {
      context,
      stack: error.stack,
      error: {
        name: error.name,
        message: error.message
      }
    });
  }

  /**
   * Log based on error severity level
   * @param severity The error severity level
   * @param message The message to log
   * @param context Optional context object
   */
  public logWithSeverity(severity: ErrorSeverityLevel, message: string, context?: Record<string, unknown>): void {
    const level = severityToLogLevel(severity);
    this.logger.log(level, message, { context });
  }

  /**
   * Create a child logger with additional default context
   * @param defaultContext Default context to include with all log messages
   * @returns A child logger instance
   */
  public createChildLogger(defaultContext: Record<string, unknown>): ChildLogger {
    return new ChildLogger(this, defaultContext);
  }
}

/**
 * Child logger that includes default context with all log messages
 */
export class ChildLogger {
  /**
   * Create a new child logger
   * @param parent Parent logger
   * @param defaultContext Default context to include with all log messages
   */
  constructor(
    private parent: Logger,
    private defaultContext: Record<string, unknown>
  ) {}

  /**
   * Merge provided context with default context
   * @param context Additional context
   * @returns Merged context
   */
  private mergeContext(context?: Record<string, unknown>): Record<string, unknown> {
    return {
      ...this.defaultContext,
      ...context
    };
  }

  /**
   * Log a debug message
   * @param message The message to log
   * @param context Additional context
   */
  public debug(message: string, context?: Record<string, unknown>): void {
    this.parent.debug(message, this.mergeContext(context));
  }

  /**
   * Log an info message
   * @param message The message to log
   * @param context Additional context
   */
  public info(message: string, context?: Record<string, unknown>): void {
    this.parent.info(message, this.mergeContext(context));
  }

  /**
   * Log a warning message
   * @param message The message to log
   * @param context Additional context
   */
  public warn(message: string, context?: Record<string, unknown>): void {
    this.parent.warn(message, this.mergeContext(context));
  }

  /**
   * Log an error message
   * @param message The message to log
   * @param context Additional context
   */
  public error(message: string, context?: Record<string, unknown>): void {
    this.parent.error(message, this.mergeContext(context));
  }

  /**
   * Log a fatal error message
   * @param message The message to log
   * @param context Additional context
   */
  public fatal(message: string, context?: Record<string, unknown>): void {
    this.parent.fatal(message, this.mergeContext(context));
  }

  /**
   * Log an exception with full stack trace
   * @param message The error message
   * @param error The error object
   * @param context Additional context
   */
  public exception(message: string, error: Error, context?: Record<string, unknown>): void {
    this.parent.exception(message, error, this.mergeContext(context));
  }

  /**
   * Log based on error severity level
   * @param severity The error severity level
   * @param message The message to log
   * @param context Optional context object
   */
  public logWithSeverity(severity: ErrorSeverityLevel, message: string, context?: Record<string, unknown>): void {
    this.parent.logWithSeverity(severity, message, this.mergeContext(context));
  }
}

// Create default logger instance with file logging but no console logging
export const logger = Logger.getInstance({
  console: false, // Ensure no console logging
  files: true,
  logDir: "logs",
  format: "detailed"
});

export default logger;