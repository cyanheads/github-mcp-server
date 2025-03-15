/**
 * Validation Utility Module
 * =========================
 *
 * This module provides standardized input validation functionality.
 * It uses Zod for schema validation and provides consistent error handling.
 */

import { z } from 'zod';
import { OperationResult } from '../types/operation.result.types.js';
import { ApplicationErrorHandlingUtility } from './error.handling.utility.js';

/**
 * Validates operation input data against a schema
 * 
 * @param schema - The Zod schema to validate against
 * @param inputData - The input data to validate
 * @returns An operation result containing either the validated data or validation errors
 */
export function validateOperationInput<T>(
  schema: z.ZodType<T>,
  inputData: unknown
): OperationResult<T> {
  try {
    const validatedData = schema.parse(inputData);
    return ApplicationErrorHandlingUtility.createSuccessResult(validatedData);
  } catch (validationError) {
    if (validationError instanceof z.ZodError) {
      const formattedErrors = validationError.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      
      return ApplicationErrorHandlingUtility.createFailureResult(
        ApplicationErrorHandlingUtility.createValidationError(
          'Input validation failed',
          { validationErrors: formattedErrors }
        )
      );
    }
    
    return ApplicationErrorHandlingUtility.createFailureResult(
      ApplicationErrorHandlingUtility.wrapExceptionAsStandardizedError(
        validationError,
        'Unexpected validation error occurred'
      )
    );
  }
}

/**
 * Creates a Zod schema for repository parameters
 */
export const getRepositorySchema = z.object({
  owner: z.string().min(1, "Owner is required"),
  repo: z.string().min(1, "Repository name is required")
});

/**
 * Creates a Zod schema for creating repositories
 */
export const createRepositorySchema = z.object({
  name: z.string().min(1, "Repository name is required"),
  description: z.string().optional(),
  private: z.boolean().optional()
});

/**
 * Creates a Zod schema for listing repositories
 */
export const listRepositoriesSchema = z.object({
  type: z.enum(['all', 'owner', 'public', 'private', 'member']).optional(),
  sort: z.enum(['created', 'updated', 'pushed', 'full_name']).optional()
});

/**
 * Creates a Zod schema for creating branches
 */
export const createBranchSchema = z.object({
  owner: z.string().min(1, "Owner is required"),
  repo: z.string().min(1, "Repository name is required"),
  branch: z.string().min(1, "Branch name is required"),
  sha: z.string().min(1, "SHA is required")
});

/**
 * Creates a Zod schema for deleting branches
 */
export const deleteBranchSchema = z.object({
  owner: z.string().min(1, "Owner is required"),
  repo: z.string().min(1, "Repository name is required"),
  branch: z.string().min(1, "Branch name is required")
});

/**
 * Creates a Zod schema for listing branches
 */
export const listBranchesSchema = z.object({
  owner: z.string().min(1, "Owner is required"),
  repo: z.string().min(1, "Repository name is required"),
  protected: z.boolean().optional(),
  per_page: z.number().optional()
});

/**
 * Creates a Zod schema for creating issues
 */
export const createIssueSchema = z.object({
  owner: z.string().min(1, "Owner is required"),
  repo: z.string().min(1, "Repository name is required"),
  title: z.string().min(1, "Title is required"),
  body: z.string().optional(),
  labels: z.array(z.string()).optional()
});

/**
 * Creates a Zod schema for listing issues
 */
export const listIssuesSchema = z.object({
  owner: z.string().min(1, "Owner is required"),
  repo: z.string().min(1, "Repository name is required"),
  state: z.enum(['open', 'closed', 'all']).optional(),
  labels: z.array(z.string()).optional()
});

/**
 * Creates a Zod schema for creating pull requests
 */
export const createPullRequestSchema = z.object({
  owner: z.string().min(1, "Owner is required"),
  repo: z.string().min(1, "Repository name is required"),
  title: z.string().min(1, "Title is required"),
  head: z.string().min(1, "Head branch is required"),
  base: z.string().min(1, "Base branch is required"),
  body: z.string().optional()
});

/**
 * Creates a Zod schema for merging pull requests
 */
export const mergePullRequestSchema = z.object({
  owner: z.string().min(1, "Owner is required"),
  repo: z.string().min(1, "Repository name is required"),
  pull_number: z.number().int().positive("Pull request number is required"),
  commit_title: z.string().optional(),
  commit_message: z.string().optional(),
  merge_method: z.enum(['merge', 'squash', 'rebase']).optional()
});

/**
 * Creates a Zod schema for updating pull requests
 */
export const updatePullRequestSchema = z.object({
  owner: z.string().min(1, "Owner is required"),
  repo: z.string().min(1, "Repository name is required"),
  pull_number: z.number().int().positive("Pull request number is required"),
  title: z.string().optional(),
  body: z.string().optional(),
  state: z.enum(['open', 'closed']).optional(),
  base: z.string().optional(),
  maintainer_can_modify: z.boolean().optional()
});

/**
 * Creates a Zod schema for listing pull requests
 */
export const listPullRequestsSchema = z.object({
  owner: z.string().min(1, "Owner is required"),
  repo: z.string().min(1, "Repository name is required"),
  state: z.enum(['open', 'closed', 'all']).optional(),
  head: z.string().optional(),
  base: z.string().optional(),
  sort: z.enum(['created', 'updated', 'popularity', 'long-running']).optional(),
  direction: z.enum(['asc', 'desc']).optional()
});

/**
 * Creates a Zod schema for updating files
 */
export const updateFileSchema = z.object({
  owner: z.string().min(1, "Owner is required"),
  repo: z.string().min(1, "Repository name is required"),
  path: z.string().min(1, "File path is required"),
  message: z.string().min(1, "Commit message is required"),
  content: z.string().min(1, "Content is required"),
  sha: z.string().optional(),
  branch: z.string().optional()
});

/**
 * Creates a Zod schema for creating releases
 */
export const createReleaseSchema = z.object({
  owner: z.string().min(1, "Owner is required"),
  repo: z.string().min(1, "Repository name is required"),
  tag_name: z.string().min(1, "Tag name is required"),
  name: z.string().optional(),
  body: z.string().optional(),
  draft: z.boolean().optional(),
  prerelease: z.boolean().optional()
});