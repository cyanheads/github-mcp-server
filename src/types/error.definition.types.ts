/**
 * Error Category Type Enumeration
 * Classifies errors by their source and domain for better error handling and reporting
 */
export enum ErrorCategoryType {
  CATEGORY_VALIDATION = 'VALIDATION',
  CATEGORY_AUTHENTICATION = 'AUTHENTICATION',
  CATEGORY_GITHUB_API = 'GITHUB_API',
  CATEGORY_SYSTEM = 'SYSTEM',
  CATEGORY_UNKNOWN = 'UNKNOWN'
}

/**
 * Error Severity Level Enumeration
 * Indicates the severity of errors for appropriate logging and response handling
 */
export enum ErrorSeverityLevel {
  SEVERITY_INFO = 'INFO',
  SEVERITY_WARN = 'WARN',
  SEVERITY_ERROR = 'ERROR',
  SEVERITY_FATAL = 'FATAL'
}

/**
 * Standardized Application Error Object
 * Represents a consistent error format used throughout the application
 * Provides comprehensive information about each error for debugging and reporting
 */
export interface StandardizedApplicationErrorObject {
  /** Human-readable description of the error */
  errorMessage: string;
  
  /** Machine-readable error code identifier */
  errorCode: string;
  
  /** Category identifying the error's domain */
  errorCategory: ErrorCategoryType;
  
  /** Severity level of the error */
  errorSeverity: ErrorSeverityLevel;
  
  /** ISO timestamp of when the error occurred */
  errorTimestamp: string;
  
  /** Additional context data relevant to the error */
  errorContext: Record<string, unknown>;
  
  /** Optional error stack trace for debugging */
  errorStack?: string;
}