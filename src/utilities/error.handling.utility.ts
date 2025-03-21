/**
 * Error Handling Utility Module
 * =============================
 *
 * This module provides standardized error handling functionality across the application.
 * It enables consistent error creation, formatting, and transformation.
 */

import {
  ErrorCategoryType,
  ErrorSeverityLevel,
  StandardizedApplicationErrorObject
} from '../types/error.definition.types.js';
import { OperationResult } from '../types/operation.result.types.js';
import { logger } from './logger.utility.js';

/**
 * Utility class providing standardized error handling functions
 */
export class ApplicationErrorHandlingUtility {
  /**
   * Creates a standardized error object with the specified properties
   *
   * @param message - Human-readable error message
   * @param code - Machine-readable error code
   * @param category - Error category for classification
   * @param severity - Error severity level
   * @param context - Additional context data for the error
   * @returns A standardized error object
   */
  static createStandardizedError(
    message: string,
    code: string,
    category: ErrorCategoryType,
    severity: ErrorSeverityLevel,
    context: Record<string, unknown> = {}
  ): StandardizedApplicationErrorObject {
    const errorObject = {
      errorMessage: message,
      errorCode: code,
      errorCategory: category,
      errorSeverity: severity,
      errorTimestamp: new Date().toISOString(),
      errorContext: context
    };
    
    // Log the error based on its severity
    if (logger) {
      logger.logWithSeverity(severity, message, { code, category, ...context });
    }
    
    return errorObject;
  }
  
  /**
   * Transforms an unknown exception into a standardized error object
   *
   * @param exception - The caught exception (can be any type)
   * @param defaultMessage - Default message to use if exception doesn't provide one
   * @returns A standardized error object
   */
  static wrapExceptionAsStandardizedError(
    exception: unknown,
    defaultMessage: string = 'An unexpected error occurred'
  ): StandardizedApplicationErrorObject {
    const errorMessage = exception instanceof Error ? exception.message : String(exception);
    const errorStack = exception instanceof Error ? exception.stack : undefined;

    // Log the exception
    if (exception instanceof Error) {
      logger.exception(defaultMessage, exception);
    } else {
      logger.error(errorMessage || defaultMessage, { originalError: exception });
    }
    
    return {
      errorMessage: errorMessage || defaultMessage,
      errorCode: 'UNEXPECTED_ERROR',
      errorCategory: ErrorCategoryType.CATEGORY_UNKNOWN,
      errorSeverity: ErrorSeverityLevel.SEVERITY_ERROR,
      errorTimestamp: new Date().toISOString(),
      errorContext: { originalError: exception },
      errorStack
    };
  }
  
  /**
   * Creates a failure result for an operation
   *
   * @param error - The error object
   * @returns An operation result indicating failure
   */
  static createFailureResult<DataType, ErrorType = StandardizedApplicationErrorObject>(
    error: ErrorType
  ): OperationResult<DataType, ErrorType> {
    return {
      resultSuccessful: false,
      resultError: error
    };
  }
  
  /**
   * Creates a success result for an operation
   *
   * @param data - The operation result data
   * @returns An operation result indicating success
   */
  static createSuccessResult<DataType>(
    data: DataType
  ): OperationResult<DataType> {
    return {
      resultSuccessful: true,
      resultData: data
    };
  }
  
  /**
   * Creates a standardized error for GitHub API errors
   *
   * @param message - Error message
   * @param context - Additional context for the error
   * @returns A standardized GitHub API error
   */
  static createGithubApiError(
    message: string,
    context: Record<string, unknown> = {}
  ): StandardizedApplicationErrorObject {
    // Log the GitHub API error
    logger.error(`GitHub API Error: ${message}`, context);
    
    return this.createStandardizedError(
      message,
      'GITHUB_API_ERROR',
      ErrorCategoryType.CATEGORY_GITHUB_API,
      ErrorSeverityLevel.SEVERITY_ERROR,
      context
    );
  }
  
  /**
   * Creates a standardized validation error
   *
   * @param message - Validation error message
   * @param context - Additional context for the validation error
   * @returns A standardized validation error
   */
  static createValidationError(
    message: string,
    context: Record<string, unknown> = {}
  ): StandardizedApplicationErrorObject {
    // Log the validation error
    logger.warn(`Validation Error: ${message}`, context);
    
    return this.createStandardizedError(
      message,
      'VALIDATION_ERROR',
      ErrorCategoryType.CATEGORY_VALIDATION,
      ErrorSeverityLevel.SEVERITY_WARN,
      context
    );
  }
  
  /**
   * Creates a standardized authentication error
   *
   * @param message - Authentication error message
   * @param context - Additional context for the authentication error
   * @returns A standardized authentication error
   */
  static createAuthenticationError(
    message: string,
    context: Record<string, unknown> = {}
  ): StandardizedApplicationErrorObject {
    // Log the authentication error
    logger.error(`Authentication Error: ${message}`, context);
    
    return this.createStandardizedError(
      message,
      'AUTHENTICATION_ERROR',
      ErrorCategoryType.CATEGORY_AUTHENTICATION,
      ErrorSeverityLevel.SEVERITY_ERROR,
      context
    );
  }
  
  /**
   * Creates a standardized system error
   *
   * @param message - System error message
   * @param context - Additional context for the system error
   * @returns A standardized system error
   */
  static createSystemError(
    message: string,
    context: Record<string, unknown> = {}
  ): StandardizedApplicationErrorObject {
    // Log the system error
    logger.error(`System Error: ${message}`, context);
    
    return this.createStandardizedError(
      message,
      'SYSTEM_ERROR',
      ErrorCategoryType.CATEGORY_SYSTEM,
      ErrorSeverityLevel.SEVERITY_ERROR,
      context
    );
  }
}