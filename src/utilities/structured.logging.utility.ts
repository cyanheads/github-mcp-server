/**
 * Structured Logging Utility Module
 * =================================
 *
 * This module provides standardized logging functionality across the application.
 * It enables consistent, structured log entries with severity levels and contextual data.
 */

import { ErrorSeverityLevel } from '../types/error.definition.types.js';

/**
 * Enumeration of log levels with numerical values for comparison
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

/**
 * Utility class providing structured logging functionality
 */
export class StructuredLoggingUtility {
  /** Current minimum log level that will be output */
  private static currentLogLevel: LogLevel = LogLevel.INFO;
  
  /**
   * Sets the minimum log level that will be output
   * 
   * @param level - The minimum log level as either a LogLevel enum value or string
   */
  static setLogLevel(level: LogLevel | string): void {
    if (typeof level === 'string') {
      switch (level.toLowerCase()) {
        case 'debug': this.currentLogLevel = LogLevel.DEBUG; break;
        case 'info': this.currentLogLevel = LogLevel.INFO; break;
        case 'warn': this.currentLogLevel = LogLevel.WARN; break;
        case 'error': this.currentLogLevel = LogLevel.ERROR; break;
        case 'fatal': this.currentLogLevel = LogLevel.FATAL; break;
        default: this.currentLogLevel = LogLevel.INFO;
      }
    } else {
      this.currentLogLevel = level;
    }
  }
  
  /**
   * Formats a log entry as a JSON string with consistent structure
   * 
   * @param level - The log level string
   * @param message - The log message
   * @param data - Optional additional contextual data
   * @returns A formatted log entry string
   */
  private static formatLogEntry(
    level: string,
    message: string,
    data?: Record<string, unknown>
  ): string {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...data
    };
    
    return JSON.stringify(logData);
  }
  
  /**
   * Records a debug-level log entry
   * 
   * @param message - The log message
   * @param data - Optional additional contextual data
   */
  static recordDebugEntry(message: string, data?: Record<string, unknown>): void {
    if (this.currentLogLevel <= LogLevel.DEBUG) {
      console.debug(this.formatLogEntry('DEBUG', message, data));
    }
  }
  
  /**
   * Records an info-level log entry
   * 
   * @param message - The log message
   * @param data - Optional additional contextual data
   */
  static recordInfoEntry(message: string, data?: Record<string, unknown>): void {
    if (this.currentLogLevel <= LogLevel.INFO) {
      console.info(this.formatLogEntry('INFO', message, data));
    }
  }
  
  /**
   * Records a warning-level log entry
   * 
   * @param message - The log message
   * @param data - Optional additional contextual data
   */
  static recordWarnEntry(message: string, data?: Record<string, unknown>): void {
    if (this.currentLogLevel <= LogLevel.WARN) {
      console.warn(this.formatLogEntry('WARN', message, data));
    }
  }
  
  /**
   * Records an error-level log entry
   * 
   * @param message - The log message
   * @param data - Optional additional contextual data
   */
  static recordErrorEntry(message: string, data?: Record<string, unknown>): void {
    if (this.currentLogLevel <= LogLevel.ERROR) {
      console.error(this.formatLogEntry('ERROR', message, data));
    }
  }
  
  /**
   * Records a fatal-level log entry
   * 
   * @param message - The log message
   * @param data - Optional additional contextual data
   */
  static recordFatalEntry(message: string, data?: Record<string, unknown>): void {
    if (this.currentLogLevel <= LogLevel.FATAL) {
      console.error(this.formatLogEntry('FATAL', message, data));
    }
  }
  
  /**
   * Records a log entry with the specified error severity level
   * 
   * @param severity - The error severity level
   * @param message - The log message
   * @param data - Optional additional contextual data
   */
  static recordErrorSeverity(
    severity: ErrorSeverityLevel,
    message: string,
    data?: Record<string, unknown>
  ): void {
    switch (severity) {
      case ErrorSeverityLevel.SEVERITY_INFO:
        this.recordInfoEntry(message, data);
        break;
      case ErrorSeverityLevel.SEVERITY_WARN:
        this.recordWarnEntry(message, data);
        break;
      case ErrorSeverityLevel.SEVERITY_ERROR:
        this.recordErrorEntry(message, data);
        break;
      case ErrorSeverityLevel.SEVERITY_FATAL:
        this.recordFatalEntry(message, data);
        break;
    }
  }
}