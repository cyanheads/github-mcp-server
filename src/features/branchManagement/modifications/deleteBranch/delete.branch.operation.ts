/**
 * Delete Branch Operation
 * ========================
 *
 * This operation deletes a branch in a GitHub repository.
 * It validates input parameters and handles errors in a standardized way.
 */

import { OperationResult } from '../../../../types/operation.result.types.js';
import { DeleteBranchRequestType, DeleteBranchResponseType } from './delete.branch.types.js';
import { getGitHubService } from '../../../../services/githubAccess/github.service.js';
import { validateOperationInput, deleteBranchSchema } from '../../../../utilities/validation.utility.js';
import { ApplicationErrorHandlingUtility } from '../../../../utilities/error.handling.utility.js';
import { StructuredLoggingUtility } from '../../../../utilities/structured.logging.utility.js';

/**
 * Deletes a branch in a GitHub repository
 * 
 * This operation validates the input, deletes the branch, and returns a standardized response
 * @param {DeleteBranchRequestType} requestPayload - Request parameters containing owner, repo, and branch
 * @returns {Promise<OperationResult<DeleteBranchResponseType>>} Operation result with success or error information
 */
export async function deleteRepositoryBranch(
  requestPayload: DeleteBranchRequestType
): Promise<OperationResult<DeleteBranchResponseType>> {
  // Validate input parameters
  const validationResult = validateOperationInput(deleteBranchSchema, requestPayload);
  if (!validationResult.resultSuccessful) {
    return validationResult;
  }

  try {
    StructuredLoggingUtility.recordInfoEntry('Deleting repository branch', { 
      owner: requestPayload.owner,
      repo: requestPayload.repo,
      branch: requestPayload.branch
    });

    // Get GitHub service
    const githubService = getGitHubService();
    
    // Delete the branch
    await githubService.deleteBranch(validationResult.resultData);
    
    // Return success response using the utility function
    return ApplicationErrorHandlingUtility.createSuccessResult({
      success: true,
      repository: {
        owner: requestPayload.owner,
        name: requestPayload.repo
      },
      branchName: requestPayload.branch,
      deletionTimestamp: new Date().toISOString()
    });
  } catch (error) {
    StructuredLoggingUtility.recordErrorEntry('Error deleting repository branch', { 
      error: error instanceof Error ? error.message : String(error),
      requestPayload
    });
    
    return ApplicationErrorHandlingUtility.createFailureResult(
      ApplicationErrorHandlingUtility.createGithubApiError(
        'Failed to delete repository branch',
        {
          owner: requestPayload.owner,
          repo: requestPayload.repo,
          branch: requestPayload.branch,
          originalError: error
        }
      )
    );
  }
}