/**
 * Type Casting Utility Module
 * ==========================
 *
 * This module provides utility functions for casting between different
 * types safely, particularly for external API compatibility.
 */

import { StructuredLoggingUtility } from './structured.logging.utility.js';

/**
 * Casts an object to Record<string, unknown> for logging or other purposes
 * that require this type.
 *
 * @param obj - The object to cast
 * @returns The same object cast as Record<string, unknown>
 */
export function asRecord<T extends object>(obj: T): Record<string, unknown> {
  return obj as Record<string, unknown>;
}

/**
 * Safely casts our domain types to Octokit's RequestParameters for API compatibility.
 * This function adds runtime validation to ensure the object is valid for use as parameters.
 *
 * @param params - The parameters to cast
 * @returns The same parameters with an appropriate type for the Octokit API
 * @throws Error if the parameters are null or undefined
 */
export function asRequestParameters<T extends object>(params: T): T & Record<string, unknown> {
  if (params === null || params === undefined) {
    const error = new Error('Cannot cast null or undefined to RequestParameters');
    StructuredLoggingUtility.recordErrorEntry('Type casting error', {
      error: error.message,
      operation: 'asRequestParameters'
    });
    throw error;
  }
  
  // Log the cast for debugging purposes
  StructuredLoggingUtility.recordDebugEntry('Casting parameters for API request', {
    parameterType: params.constructor.name,
    parameterKeys: Object.keys(params)
  });
  
  return params as T & Record<string, unknown>;
}

/**
 * API response headers type definition
 */
export interface ApiResponseHeaders {
  [key: string]: string | undefined;
}

/**
 * Safely extracts headers from an API response
 * 
 * @param response - The API response object
 * @returns The headers as a strongly typed object, or an empty object if headers are missing
 */
export function extractResponseHeaders(response: unknown): ApiResponseHeaders {
  if (!response) {
    StructuredLoggingUtility.recordWarnEntry('Cannot extract headers from null/undefined response');
    return {};
  }
  
  // Check if response has headers property using safe property access
  const headers = safeAccess(
    response as { headers?: unknown },
    (res) => res.headers,
    {}
  );
  
  // Ensure headers is an object
  if (typeof headers !== 'object' || headers === null) {
    StructuredLoggingUtility.recordWarnEntry('Response headers not found or invalid format', {
      headerType: typeof headers
    });
    return {};
  }
  
  return headers as ApiResponseHeaders;
}

/**
 * Safely accesses a potentially undefined or null property
 * 
 * @param obj - The object to access
 * @param accessor - Function that accesses the property 
 * @param defaultValue - Default value to return if the property is undefined/null
 * @returns The property value or default value
 */
export function safeAccess<T, R>(
  obj: T | null | undefined,
  accessor: (obj: T) => R,
  defaultValue: R
): R {
  if (obj === null || obj === undefined) {
    return defaultValue;
  }
  
  try {
    const result = accessor(obj);
    return result === undefined || result === null ? defaultValue : result;
  } catch (error) {
    StructuredLoggingUtility.recordDebugEntry('Safe access failed, returning default value', {
      error: error instanceof Error ? error.message : String(error)
    });
    return defaultValue;
  }
}

/**
 * Creates a type guard function that can be used to verify an object type at runtime
 * 
 * @param propertyNames - Array of property names that should exist on the object
 * @returns A type guard function that checks if an object has the required properties
 */
export function createTypeGuard<T>(propertyNames: Array<keyof T>) {
  return function isExpectedType(obj: unknown): obj is T {
    if (!obj || typeof obj !== 'object') {
      return false;
    }
    
    for (const prop of propertyNames) {
      if (!(prop in obj)) {
        return false;
      }
    }
    
    return true;
  };
}

/**
 * Type guard for objects with headers
 */
export const hasHeaders = createTypeGuard<{ headers: unknown }>(['headers']);