/**
 * Operation Result Types Module
 * ==============================
 * 
 * This module defines the standardized result pattern used throughout the application
 * for consistent error handling and operation responses.
 * 
 * The Result pattern represents either a successful operation with data
 * or a failed operation with error information.
 */

import { StandardizedApplicationErrorObject } from './error.definition.types.js';

/**
 * Represents a successful operation result containing the operation's data
 */
export interface OperationResultSuccess<DataType> {
  /** Indicates whether the operation was successful */
  resultSuccessful: true;
  
  /** The data returned by the successful operation */
  resultData: DataType;
}

/**
 * Represents a failed operation result containing error information
 */
export interface OperationResultFailure<ErrorType = StandardizedApplicationErrorObject> {
  /** Indicates whether the operation was successful */
  resultSuccessful: false;
  
  /** The error information for the failed operation */
  resultError: ErrorType;
}

/**
 * Union type representing either a successful or failed operation result
 * This is the primary return type for all operations in the application
 */
export type OperationResult<DataType, ErrorType = StandardizedApplicationErrorObject> = 
  | OperationResultSuccess<DataType>
  | OperationResultFailure<ErrorType>;

/**
 * Creates a standardized success result with the provided data
 * 
 * @param data The operation result data
 * @returns A properly formatted success result
 */
export function createSuccessResult<DataType>(data: DataType): OperationResultSuccess<DataType> {
  return { resultSuccessful: true, resultData: data };
}

/**
 * Creates a standardized failure result with the provided error
 * 
 * @param error The error information
 * @returns A properly formatted failure result
 */
export function createFailureResult<DataType, ErrorType = StandardizedApplicationErrorObject>(
  error: ErrorType
): OperationResultFailure<ErrorType> {
  return { resultSuccessful: false, resultError: error };
}