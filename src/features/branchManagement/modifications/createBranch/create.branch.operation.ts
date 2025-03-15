/**
 * Create Branch Operation Module
 * ============================
 *
 * This module provides the operation for creating a new branch in a GitHub repository.
 * It validates the input, creates the branch, and returns the result in a standardized format.
 */

import { OperationResult } from '../../../../types/operation.result.types.js';
import { CreateBranchRequestType, CreateBranchResponseType } from './create.branch.types.js';
import { getGitHubService } from '../../../../services/githubAccess/index.export.js';
import { validateOperationInput } from '../../../../utilities/validation.utility.js';
import { createBranchSchema } from '../../../../utilities/validation.utility.js';
import { ApplicationErrorHandlingUtility } from '../../../../utilities/error.handling.utility.js';
import { StructuredLoggingUtility } from '../../../../utilities/structured.logging.utility.js';

/**
 * Creates a new branch in a GitHub repository
 * 
 * @param requestParameters - The parameters for branch creation
 * @returns An operation result containing either the created branch data or error information
 */
export async function createRepositoryBranch(
  requestParameters: CreateBranchRequestType
): Promise<OperationResult<CreateBranchResponseType>> {
  StructuredLoggingUtility.recordDebugEntry('Creating branch', { 
    owner: requestParameters.owner,
    repo: requestParameters.repo,
    branch: requestParameters.branch,
    sha: requestParameters.sha
  });
  
  // Validate input parameters
  const validationResult = validateOperationInput(createBranchSchema, requestParameters);
  if (!validationResult.resultSuccessful) {
    return validationResult;
  }
  
  // Execute operation
  try {
    const githubService = getGitHubService();
    const branch = await githubService.createBranch(validationResult.resultData);
    
    const response: CreateBranchResponseType = {
      branch,
      repository: {
        owner: requestParameters.owner,
        name: requestParameters.repo
      },
      creationTimestamp: new Date().toISOString()
    };
    
    StructuredLoggingUtility.recordInfoEntry('Successfully created branch', {
      owner: requestParameters.owner,
      repo: requestParameters.repo,
      branch: requestParameters.branch
    });
    
    return ApplicationErrorHandlingUtility.createSuccessResult(response);
  } catch (error) {
    StructuredLoggingUtility.recordErrorEntry('Failed to create branch', {
      owner: requestParameters.owner,
      repo: requestParameters.repo,
      branch: requestParameters.branch,
      error: error instanceof Error ? error.message : String(error)
    });
    
    return ApplicationErrorHandlingUtility.createFailureResult(
      ApplicationErrorHandlingUtility.wrapExceptionAsStandardizedError(
        error,
        `Failed to create branch ${requestParameters.branch} in repository ${requestParameters.owner}/${requestParameters.repo}`
      )
    );
  }
}