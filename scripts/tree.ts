#!/usr/bin/env node

/**
 * Directory Tree Generation Operation
 * ==================================
 * 
 * A utility for generating visual tree representations of the project's directory
 * structure with configurable depth control and gitignore integration.
 *
 * This operation creates a formatted markdown file containing a hierarchical
 * representation of directories and files, respecting ignore patterns and
 * applying configurable filtering.
 * 
 * Features:
 * - Respects .gitignore patterns and common exclusions
 * - Configurable maximum depth traversal
 * - Customizable output location
 * - Sorting with directories first
 * - Cross-platform compatibility
 * 
 * @module utilities/generate.directory.tree.operation
 * 
 * Usage examples:
 * - Add to package.json: "tree": "ts-node scripts/tree.ts"
 * - Run directly: npm run tree
 * - Custom output: ts-node scripts/tree.ts ./documentation/structure.md
 * - Limit depth: ts-node scripts/tree.ts --depth=3
 * - Show help: ts-node scripts/tree.ts --help
 */

import fs from 'fs/promises';
import path from 'path';

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
  errorCategory: ErrorCategoryType;          // System area affected
  errorSeverity: ErrorSeverityLevel;         // How critical the error is
  errorTimestamp: string;                    // When the error occurred
  errorContext: Record<string, unknown>;     // Additional relevant data
  errorStack?: string;                       // Stack trace if available
}

/**
 * Successful result from an operation
 */
interface OperationResultSuccess<DataType> {
  resultSuccessful: true;
  resultData: DataType;
}

/**
 * Failed result from an operation
 */
interface OperationResultFailure<ErrorType> {
  resultSuccessful: false;
  resultError: ErrorType;
}

/**
 * Combined result type for operations
 */
type OperationResult<DataType, ErrorType = StandardizedApplicationErrorObject> = 
  | OperationResultSuccess<DataType>
  | OperationResultFailure<ErrorType>;

/**
 * Configuration options for the tree generation operation
 */
interface TreeGenerationConfiguration {
  treeOutputFilePath: string;
  maximumDirectoryDepth: number;
  showHelpText: boolean;
}

/**
 * Definition of a gitignore pattern with parsing metadata
 */
interface GitignorePatternDefinition {
  patternText: string;
  isNegatedPattern: boolean;
  regexPattern: string;
}

/**
 * Result from the tree generation operation
 */
interface TreeGenerationResult {
  projectName: string;
  treeOutputFilePath: string;
  treeContentLength: number;
  maximumDepthApplied: number;
  generationTimestamp: string;
}

// -----------------------------------
// Constants
// -----------------------------------

/**
 * Default patterns to always ignore regardless of gitignore contents
 */
const DEFAULT_IGNORE_PATTERNS: string[] = [
  '.git', 
  'node_modules', 
  '.DS_Store', 
  'dist', 
  'build'
];

/**
 * Default output path for the generated tree
 */
const DEFAULT_OUTPUT_PATH = 'docs/tree.md';

/**
 * Help text displayed when requested
 */
const HELP_TEXT = `
Directory Tree Generator - Project structure visualization tool

Usage:
  node dist/utilities/generate.directory.tree.operation.js [output-path] [--depth=<number>] [--help]

Options:
  output-path      Custom file path for the tree output (default: docs/tree.md)
  --depth=<number> Maximum directory depth to display (default: unlimited)
  --help           Show this help message
`;

// -----------------------------------
// Utility Functions
// -----------------------------------

/**
 * Creates a standardized success result
 * 
 * @param data - The data to include in the success result
 * @returns A standardized success result object
 */
function createSuccessResult<DataType>(data: DataType): OperationResultSuccess<DataType> {
  return { resultSuccessful: true, resultData: data };
}

/**
 * Creates a standardized failure result
 * 
 * @param error - The error to include in the failure result
 * @returns A standardized failure result object
 */
function createFailureResult<ErrorType>(error: ErrorType): OperationResultFailure<ErrorType> {
  return { resultSuccessful: false, resultError: error };
}

/**
 * Creates a standardized error object
 * 
 * @param message - Human-readable error message
 * @param code - Machine-readable error code
 * @param category - Error category classification
 * @param severity - Error severity level
 * @param context - Additional context data
 * @returns A standardized error object
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
 * 
 * @param exception - The caught exception
 * @param defaultMessage - Fallback message if exception is not an Error object
 * @returns A standardized error object
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
 * Parses command line arguments to extract configuration options
 * 
 * @param commandLineArguments - Array of arguments from process.argv
 * @returns Configuration object for tree generation
 */
function parseCommandLineArguments(
  commandLineArguments: string[]
): TreeGenerationConfiguration {
  let treeOutputFilePath = DEFAULT_OUTPUT_PATH;
  let maximumDirectoryDepth = Infinity;
  let showHelpText = false;

  for (const argumentValue of commandLineArguments) {
    if (argumentValue === '--help') {
      showHelpText = true;
    } else if (argumentValue.startsWith('--depth=')) {
      const depthValue = argumentValue.split('=')[1];
      const parsedDepth = parseInt(depthValue, 10);
      
      if (isNaN(parsedDepth) || parsedDepth < 1) {
        console.error('Invalid depth value. Using unlimited depth.');
        maximumDirectoryDepth = Infinity;
      } else {
        maximumDirectoryDepth = parsedDepth;
      }
    } else if (!argumentValue.startsWith('--')) {
      // If it's not an option flag, assume it's the output path
      treeOutputFilePath = argumentValue;
    }
  }

  return {
    treeOutputFilePath,
    maximumDirectoryDepth,
    showHelpText
  };
}

/**
 * Loads and parses patterns from the .gitignore file
 * 
 * @returns Promise resolving to an array of parsed gitignore patterns
 */
async function loadGitignorePatternDefinitions(): Promise<OperationResult<GitignorePatternDefinition[]>> {
  try {
    const gitignoreContent = await fs.readFile('.gitignore', 'utf-8');
    
    const patternDefinitions = gitignoreContent
      .split('\n')
      .map(line => line.trim())
      // Remove comments, empty lines, and lines with just whitespace
      .filter(line => line && !line.startsWith('#') && line.trim() !== '')
      // Process each pattern
      .map(pattern => ({
        patternText: pattern.startsWith('!') ? pattern.slice(1) : pattern,
        isNegatedPattern: pattern.startsWith('!'),
        // Convert glob patterns to regex-compatible strings (simplified approach)
        regexPattern: pattern
          .replace(/\./g, '\\.') // Escape dots first
          .replace(/\*/g, '.*')  // Convert * to .*
          .replace(/\?/g, '.')   // Convert ? to .
          .replace(/\/$/, '(/.*)?') // Handle directory indicators
      }));
    
    return createSuccessResult(patternDefinitions);
  } catch (exceptionObject) {
    console.warn('No .gitignore file found, using default patterns only');
    return createSuccessResult([]);
  }
}

/**
 * Checks if a given file path should be ignored based on patterns
 * 
 * @param entryPath - The relative path to check
 * @param ignorePatternDefinitions - Array of parsed gitignore patterns
 * @returns Boolean indicating if the path should be ignored
 */
function checkPathShouldBeIgnored(
  entryPath: string, 
  ignorePatternDefinitions: GitignorePatternDefinition[]
): boolean {
  // Always check default patterns first
  if (DEFAULT_IGNORE_PATTERNS.some(pattern => entryPath.includes(pattern))) {
    return true;
  }

  let shouldBeIgnored = false;
  
  for (const { patternText, isNegatedPattern, regexPattern } of ignorePatternDefinitions) {
    // Convert the pattern to a proper regex
    const compiledRegexPattern = new RegExp(`^${regexPattern}$|/${regexPattern}$|/${regexPattern}/`);
    
    if (compiledRegexPattern.test(entryPath)) {
      // If it's a negation pattern (!pattern), this file should NOT be ignored
      // Otherwise, it should be ignored
      shouldBeIgnored = !isNegatedPattern;
    }
  }
  
  return shouldBeIgnored;
}

/**
 * Recursively generates a tree representation of the directory structure
 * 
 * @param directoryPath - Path to the directory to process
 * @param ignorePatternDefinitions - Array of gitignore pattern definitions
 * @param prefixString - Prefix string for the current level (used for indentation)
 * @param isLastEntry - Whether this is the last entry at the current level
 * @param relativePathString - Relative path from the root directory
 * @param currentDepthLevel - Current depth level in the traversal
 * @returns Promise resolving to the string representation of the tree
 */
async function generateDirectoryTreeRepresentation(
  directoryPath: string, 
  ignorePatternDefinitions: GitignorePatternDefinition[], 
  prefixString = '', 
  isLastEntry = true, 
  relativePathString = '', 
  currentDepthLevel = 0,
  maximumDepthLevel = Infinity
): Promise<OperationResult<string>> {
  try {
    const directoryEntries = await fs.readdir(directoryPath, { withFileTypes: true });
    let treeOutputContent = '';

    // Filter and sort entries
    const filteredEntries = directoryEntries
      .filter(entry => {
        const entryPath = path.join(relativePathString, entry.name);
        return !checkPathShouldBeIgnored(entryPath, ignorePatternDefinitions);
      })
      .sort((a, b) => {
        // Directories first, then files
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      });

    for (let entryIndex = 0; entryIndex < filteredEntries.length; entryIndex++) {
      const entryItem = filteredEntries[entryIndex];
      const isLastItem = entryIndex === filteredEntries.length - 1;
      const newPrefixString = prefixString + (isLastEntry ? '    ' : '│   ');
      const newRelativePath = path.join(relativePathString, entryItem.name);
      
      treeOutputContent += prefixString + (isLastItem ? '└── ' : '├── ') + entryItem.name + '\n';

      // Only traverse deeper if we haven't reached maximumDepthLevel
      if (entryItem.isDirectory() && currentDepthLevel < maximumDepthLevel) {
        const subTreeResult = await generateDirectoryTreeRepresentation(
          path.join(directoryPath, entryItem.name),
          ignorePatternDefinitions,
          newPrefixString,
          isLastItem,
          newRelativePath,
          currentDepthLevel + 1,
          maximumDepthLevel
        );
        
        if (subTreeResult.resultSuccessful) {
          treeOutputContent += subTreeResult.resultData;
        } else {
          return subTreeResult; // Propagate error
        }
      }
    }

    return createSuccessResult(treeOutputContent);
  } catch (exceptionObject) {
    return createFailureResult(
      wrapExceptionAsStandardizedError(
        exceptionObject,
        `Failed to generate tree for directory: ${directoryPath}`
      )
    );
  }
}

/**
 * Ensures the directory for the output file exists, creating it if needed
 * 
 * @param directoryPath - Path to the directory to check/create
 * @returns Promise resolving to operation result
 */
async function ensureDirectoryExists(
  directoryPath: string
): Promise<OperationResult<boolean>> {
  try {
    await fs.access(directoryPath);
    return createSuccessResult(true);
  } catch {
    try {
      await fs.mkdir(directoryPath, { recursive: true });
      console.log(`Creating directory: ${directoryPath}`);
      return createSuccessResult(true);
    } catch (exceptionObject) {
      return createFailureResult(
        wrapExceptionAsStandardizedError(
          exceptionObject,
          `Failed to create directory: ${directoryPath}`
        )
      );
    }
  }
}

/**
 * Writes the generated tree content to a markdown file
 * 
 * @param projectName - Name of the project
 * @param treeContent - Generated tree content
 * @param outputFilePath - Path where the output file should be written
 * @param maximumDepthValue - Maximum depth value that was applied
 * @returns Promise resolving to operation result
 */
async function writeTreeContentToFile(
  projectName: string,
  treeContent: string,
  outputFilePath: string,
  maximumDepthValue: number
): Promise<OperationResult<TreeGenerationResult>> {
  try {
    const rootDirectoryPath = process.cwd();
    const outputDirectoryPath = path.dirname(path.resolve(rootDirectoryPath, outputFilePath));
    
    // Ensure output directory exists
    const directoryResult = await ensureDirectoryExists(outputDirectoryPath);
    if (!directoryResult.resultSuccessful) {
      return directoryResult;
    }

    // Format the timestamp
    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    
    // Format the markdown content
    const markdownContent = `# ${projectName} - Directory Structure

Generated on: ${timestamp}

${maximumDepthValue !== Infinity ? `_Depth limited to ${maximumDepthValue} levels_\n\n` : ''}
\`\`\`
${projectName}
${treeContent}
\`\`\`

_Note: This tree excludes files and directories matched by .gitignore and common patterns like node_modules._
`;

    // Write the content to the file
    await fs.writeFile(
      path.resolve(rootDirectoryPath, outputFilePath),
      markdownContent
    );
    
    return createSuccessResult({
      projectName,
      treeOutputFilePath: outputFilePath,
      treeContentLength: treeContent.length,
      maximumDepthApplied: maximumDepthValue,
      generationTimestamp: timestamp
    });
  } catch (exceptionObject) {
    return createFailureResult(
      wrapExceptionAsStandardizedError(
        exceptionObject,
        `Failed to write tree to file: ${outputFilePath}`
      )
    );
  }
}

/**
 * Main operation function that orchestrates the tree generation process
 * 
 * @returns Promise that resolves when the operation completes
 */
async function generateProjectDirectoryTree(): Promise<void> {
  try {
    // Parse command line arguments
    const commandLineArguments = process.argv.slice(2);
    const configurationSettings = parseCommandLineArguments(commandLineArguments);
    
    // Display help if requested
    if (configurationSettings.showHelpText) {
      console.log(HELP_TEXT);
      process.exit(0);
    }
    
    const rootDirectoryPath = process.cwd();
    const projectName = path.basename(rootDirectoryPath);
    
    // Load gitignore patterns
    const ignorePatternResult = await loadGitignorePatternDefinitions();
    if (!ignorePatternResult.resultSuccessful) {
      throw new Error(`Failed to load gitignore patterns: ${ignorePatternResult.resultError.errorMessage}`);
    }
    
    const ignorePatternDefinitions = ignorePatternResult.resultData;
    
    console.log(`Generating directory tree for: ${projectName}`);
    console.log(`Output path: ${configurationSettings.treeOutputFilePath}`);
    
    if (configurationSettings.maximumDirectoryDepth !== Infinity) {
      console.log(`Maximum depth: ${configurationSettings.maximumDirectoryDepth}`);
    }
    
    // Generate the tree structure
    const treeGenerationResult = await generateDirectoryTreeRepresentation(
      rootDirectoryPath, 
      ignorePatternDefinitions, 
      '', 
      true, 
      '', 
      0,
      configurationSettings.maximumDirectoryDepth
    );
    
    if (!treeGenerationResult.resultSuccessful) {
      throw new Error(`Failed to generate tree: ${treeGenerationResult.resultError.errorMessage}`);
    }
    
    // Write the tree to a file
    const writeResult = await writeTreeContentToFile(
      projectName,
      treeGenerationResult.resultData,
      configurationSettings.treeOutputFilePath,
      configurationSettings.maximumDirectoryDepth
    );
    
    if (!writeResult.resultSuccessful) {
      throw new Error(`Failed to write tree: ${writeResult.resultError.errorMessage}`);
    }
    
    console.log(`✓ Successfully generated tree structure in ${configurationSettings.treeOutputFilePath}`);
  } catch (exceptionObject) {
    const standardizedError = wrapExceptionAsStandardizedError(
      exceptionObject,
      'Unhandled error during tree generation'
    );
    
    console.error(`× Error generating tree: ${standardizedError.errorMessage}`);
    process.exit(1);
  }
}

// -----------------------------------
// Script Execution
// -----------------------------------

// Execute the main operation function
generateProjectDirectoryTree();