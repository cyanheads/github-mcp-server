#!/usr/bin/env node

/**
 * Project Directory Cleaning Operation
 * ====================================
 * 
 * This utility performs automated cleanup of build artifacts and temporary directories
 * in the project filesystem. It provides configurable directory targeting with special
 * handling for certain directory types.
 * 
 * Functionality:
 * - Removes specified directories completely (default: 'dist')
 * - For 'logs' directory: preserves structure but removes all contained files
 * - Creates directories that don't exist when using content-only cleaning
 * - Supports custom directory specification via command line arguments
 * 
 * @module utilities/clean.project.directories.operation
 * 
 * Usage examples:
 * - Add to package.json: "clean": "ts-node scripts/clean.ts"
 * - Direct execution: npm run clean
 * - With build chain: "rebuild": "npm run clean && npm run build"
 * - Custom directories: ts-node scripts/clean.ts temp coverage
 * 
 * Platform compatibility:
 * - Cross-platform support (Windows, macOS, Linux) via Node.js path normalization
 */

import { access, mkdir, readdir, rm } from 'fs/promises';
import { join } from 'path';

// -----------------------------------
// Type Definitions
// -----------------------------------

/**
 * Standardized error category classification
 */
const ErrorCategoryType = {
  CATEGORY_VALIDATION: 'VALIDATION',
  CATEGORY_FILESYSTEM: 'FILESYSTEM',
  CATEGORY_SYSTEM: 'SYSTEM',
  CATEGORY_UNKNOWN: 'UNKNOWN'
} as const;

type ErrorCategoryType = typeof ErrorCategoryType[keyof typeof ErrorCategoryType];

/**
 * Error severity classification
 */
const ErrorSeverityLevel = {
  SEVERITY_DEBUG: 0,
  SEVERITY_INFO: 1,
  SEVERITY_WARN: 2,
  SEVERITY_ERROR: 3,
  SEVERITY_FATAL: 4
} as const;

type ErrorSeverityLevel = typeof ErrorSeverityLevel[keyof typeof ErrorSeverityLevel];

/**
 * Standardized error structure for consistent error handling
 */
interface StandardizedApplicationErrorObject {
  errorMessage: string;                      // Human-readable description
  errorCode: string;                         // Machine-readable identifier
  errorCategory: ErrorCategoryType;         // System area affected
  errorSeverity: ErrorSeverityLevel;         // How critical the error is
  errorTimestamp: string;                    // When the error occurred
  errorContext: Record<string, unknown>;     // Additional relevant data
  errorStack?: string;                       // Stack trace if available
}

/**
 * Successful result from a directory cleaning operation
 */
interface DirectoryCleanOperationSuccessResult {
  resultSuccessful: true;
  resultData: {
    directoryPath: string;
    directoryName: string;
    cleaningMethod: 'removed' | 'contentsOnly';
  };
}

/**
 * Failed result from a directory cleaning operation
 */
interface DirectoryCleanOperationFailureResult {
  resultSuccessful: false;
  resultError: StandardizedApplicationErrorObject;
}

/**
 * Combined result type for directory cleaning operations
 */
type DirectoryCleanOperationResult = 
  | DirectoryCleanOperationSuccessResult
  | DirectoryCleanOperationFailureResult;

/**
 * Configuration options for the cleaning operation
 */
interface DirectoryCleaningConfiguration {
  targetDirectories: string[];
  preserveStructureDirectories: string[];
}

// -----------------------------------
// Utility Functions
// -----------------------------------

/**
 * Creates a standardized success result
 */
function createSuccessResult<DataType>(data: DataType): { resultSuccessful: true; resultData: DataType } {
  return { resultSuccessful: true, resultData: data };
}

/**
 * Creates a standardized failure result
 */
function createFailureResult<ErrorType>(error: ErrorType): { resultSuccessful: false; resultError: ErrorType } {
  return { resultSuccessful: false, resultError: error };
}

/**
 * Creates a standardized error object
 */
function createStandardizedError(
  message: string,
  code: string,
  category: ErrorCategoryType,
  severity: ErrorSeverityLevel,
  context: Record<string, unknown> = {}
): StandardizedApplicationErrorObject {
  return {
    errorMessage: message,
    errorCode: code,
    errorCategory: category,
    errorSeverity: severity,
    errorTimestamp: new Date().toISOString(),
    errorContext: context
  };
}

/**
 * Converts an exception to a standardized error object
 */
function wrapExceptionAsStandardizedError(
  exception: unknown,
  defaultMessage: string
): StandardizedApplicationErrorObject {
  const errorMessage = exception instanceof Error ? exception.message : defaultMessage;
  const errorStack = exception instanceof Error ? exception.stack : undefined;
  
  return {
    errorMessage,
    errorCode: 'UNEXPECTED_ERROR',
    errorCategory: ErrorCategoryType.CATEGORY_UNKNOWN,
    errorSeverity: ErrorSeverityLevel.SEVERITY_ERROR,
    errorTimestamp: new Date().toISOString(),
    errorContext: { originalException: exception },
    errorStack
  };
}

// -----------------------------------
// Implementation Functions
// -----------------------------------

/**
 * Checks if a directory exists at the specified path
 * 
 * @param directoryPath - Full path to check for existence
 * @returns Promise resolving to boolean indicating existence
 */
async function checkDirectoryExists(directoryPath: string): Promise<boolean> {
  try {
    await access(directoryPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Cleans the contents of a directory while preserving the directory structure
 * 
 * This operation will:
 * 1. Create the directory if it doesn't exist
 * 2. Remove all files within the directory
 * 3. Recursively clean the contents of subdirectories
 * 
 * @param directoryPath - Full path to the directory to clean
 * @returns Promise resolving when the operation completes
 */
async function cleanDirectoryContentsOnly(directoryPath: string): Promise<DirectoryCleanOperationResult> {
  try {
    // Check if directory exists
    const directoryExistsFlag = await checkDirectoryExists(directoryPath);
    
    if (!directoryExistsFlag) {
      // Create the directory if it doesn't exist
      await mkdir(directoryPath, { recursive: true });
      
      return createSuccessResult({
        directoryPath,
        directoryName: directoryPath.split('/').pop() || directoryPath,
        cleaningMethod: 'contentsOnly'
      });
    }

    // Read directory contents
    const directoryEntries = await readdir(directoryPath, { withFileTypes: true });
    
    // Process each entry
    for (const entryItem of directoryEntries) {
      const entryItemPath = join(directoryPath, entryItem.name);
      
      if (entryItem.isDirectory()) {
        // For subdirectories, recursively clean their contents
        const subDirectoryResult = await cleanDirectoryContentsOnly(entryItemPath);
        if (!subDirectoryResult.resultSuccessful) {
          return subDirectoryResult; // Propagate error
        }
      } else {
        // For files, remove them
        await rm(entryItemPath, { force: true });
      }
    }
    
    return createSuccessResult({
      directoryPath,
      directoryName: directoryPath.split('/').pop() || directoryPath,
      cleaningMethod: 'contentsOnly'
    });
  } catch (exceptionObject) {
    return createFailureResult(
      wrapExceptionAsStandardizedError(
        exceptionObject,
        `Failed to clean contents of directory: ${directoryPath}`
      )
    );
  }
}

/**
 * Removes a directory completely
 * 
 * @param directoryPath - Full path to the directory to remove
 * @returns Promise resolving to the operation result
 */
async function removeDirectoryCompletely(directoryPath: string): Promise<DirectoryCleanOperationResult> {
  try {
    // Check if directory exists before attempting to remove it
    const directoryExistsFlag = await checkDirectoryExists(directoryPath);
    
    if (!directoryExistsFlag) {
      return createSuccessResult({
        directoryPath,
        directoryName: directoryPath.split('/').pop() || directoryPath,
        cleaningMethod: 'removed'
      });
    }
    
    // Remove the directory and all its contents
    await rm(directoryPath, { recursive: true, force: true });
    
    return createSuccessResult({
      directoryPath,
      directoryName: directoryPath.split('/').pop() || directoryPath,
      cleaningMethod: 'removed'
    });
  } catch (exceptionObject) {
    return createFailureResult(
      wrapExceptionAsStandardizedError(
        exceptionObject,
        `Failed to remove directory: ${directoryPath}`
      )
    );
  }
}

/**
 * Processes a single directory based on configuration
 * 
 * @param directoryName - Name of the directory to process
 * @param configurationSettings - Configuration for the cleaning operation
 * @returns Promise resolving to the operation result
 */
async function processDirectoryCleaning(
  directoryName: string,
  configurationSettings: DirectoryCleaningConfiguration
): Promise<DirectoryCleanOperationResult> {
  try {
    const directoryPath = join(process.cwd(), directoryName);
    
    // Determine handling method based on configuration
    const preserveStructure = configurationSettings.preserveStructureDirectories.includes(directoryName);
    
    if (preserveStructure) {
      return await cleanDirectoryContentsOnly(directoryPath);
    } else {
      return await removeDirectoryCompletely(directoryPath);
    }
  } catch (exceptionObject) {
    return createFailureResult(
      wrapExceptionAsStandardizedError(
        exceptionObject,
        `Unexpected error processing directory: ${directoryName}`
      )
    );
  }
}

/**
 * Main operation function that processes all directories
 * 
 * @returns Promise that resolves when all directories have been processed
 */
async function cleanProjectDirectories(): Promise<void> {
  try {
    // Default configuration
    const cleaningConfiguration: DirectoryCleaningConfiguration = {
      targetDirectories: ['dist', 'logs'],
      preserveStructureDirectories: ['logs']
    };
    
    // Override target directories if specified in command line arguments
    const commandLineArguments = process.argv.slice(2);
    if (commandLineArguments.length > 0) {
      cleaningConfiguration.targetDirectories = commandLineArguments;
    }
    
    console.log(`Cleaning directories: ${cleaningConfiguration.targetDirectories.join(', ')}`);

    // Process each directory and collect results
    const operationResults = await Promise.allSettled(
      cleaningConfiguration.targetDirectories.map(async (directoryName) => {
        return await processDirectoryCleaning(directoryName, cleaningConfiguration);
      })
    );

    // Report results
    for (const operationResult of operationResults) {
      if (operationResult.status === 'fulfilled') {
        const result = operationResult.value;
        
        if (result.resultSuccessful) {
          const { directoryName, cleaningMethod } = result.resultData;
          
          if (cleaningMethod === 'contentsOnly') {
            console.log(`✓ Successfully cleaned contents of ${directoryName} directory while preserving structure`);
          } else {
            console.log(`✓ Successfully cleaned ${directoryName} directory`);
          }
        } else {
          console.error(`× Error: ${result.resultError.errorMessage}`);
        }
      } else {
        console.error(`× Unhandled error: ${operationResult.reason}`);
      }
    }
  } catch (exceptionObject) {
    const standardizedError = wrapExceptionAsStandardizedError(
      exceptionObject,
      'Unhandled error during directory cleaning operation'
    );
    
    console.error(`× Fatal error during cleanup: ${standardizedError.errorMessage}`);
    process.exit(1);
  }
}

// -----------------------------------
// Script Execution
// -----------------------------------

// Execute the main operation function
cleanProjectDirectories();