/**
 * List Branches Operation Module
 * ============================
 *
 * This module provides the operation for listing branches in a GitHub repository.
 * It validates the input, retrieves the branches, and returns them in a standardized format.
 */

import { OperationResult } from '../../../../types/operation.result.types.js';
import { ListBranchesRequestType, ListBranchesResponseType } from './list.branches.types.js';
import { getGitHubService } from '../../../../services/githubAccess/index.export.js';
import { validateOperationInput } from '../../../../utilities/validation.utility.js';
import { listBranchesSchema } from '../../../../utilities/validation.utility.js';
import { ApplicationErrorHandlingUtility } from '../../../../utilities/error.handling.utility.js';
import { StructuredLoggingUtility } from '../../../../utilities/structured.logging.utility.js';

/**
 * Lists branches in a GitHub repository
 * 
 * @param requestParameters - The parameters for listing branches
 * @returns An operation result containing either the branches or error information
 */
export async function listRepositoryBranches(
  requestParameters: ListBranchesRequestType
): Promise<OperationResult<ListBranchesResponseType>> {
  StructuredLoggingUtility.recordDebugEntry('Listing branches', { 
    owner: requestParameters.owner,
    repo: requestParameters.repo,
    protected: requestParameters.protected,
    per_page: requestParameters.per_page
  });
  
  // Validate input parameters
  const validationResult = validateOperationInput(listBranchesSchema, requestParameters);
  if (!validationResult.resultSuccessful) {
    return validationResult;
  }
  
  // Execute operation
  try {
    const githubService = getGitHubService();
    const branches = await githubService.listBranches(validationResult.resultData);
    
    const response: ListBranchesResponseType = {
      branches,
      repository: {
        owner: requestParameters.owner,
        name: requestParameters.repo
      },
      pagination: {
        count: branches.length
      },
      requestTimestamp: new Date().toISOString()
    };
    
    StructuredLoggingUtility.recordInfoEntry('Successfully listed branches', {
      owner: requestParameters.owner,
      repo: requestParameters.repo,
      count: branches.length
    });
    
    return ApplicationErrorHandlingUtility.createSuccessResult(response);
  } catch (error) {
    StructuredLoggingUtility.recordErrorEntry('Failed to list branches', {
      owner: requestParameters.owner,
      repo: requestParameters.repo,
      error: error instanceof Error ? error.message : String(error)
    });
    
    return ApplicationErrorHandlingUtility.createFailureResult(
      ApplicationErrorHandlingUtility.wrapExceptionAsStandardizedError(
        error,
        `Failed to list branches for repository ${requestParameters.owner}/${requestParameters.repo}`
      )
    );
  }
}