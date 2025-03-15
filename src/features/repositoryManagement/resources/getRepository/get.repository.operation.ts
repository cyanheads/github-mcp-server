/**
 * Get Repository Operation Module
 * ==============================
 *
 * This module provides the operation for retrieving a GitHub repository by owner and name.
 * It validates the input, retrieves the repository data, and returns it in a standardized format.
 */

import { OperationResult } from '../../../../types/operation.result.types.js';
import { GetRepositoryRequestType, GetRepositoryResponseType } from './get.repository.types.js';
import { getGitHubService } from '../../../../services/githubAccess/index.export.js';
import { validateOperationInput } from '../../../../utilities/validation.utility.js';
import { getRepositorySchema } from '../../../../utilities/validation.utility.js';
import { ApplicationErrorHandlingUtility } from '../../../../utilities/error.handling.utility.js';
import { StructuredLoggingUtility } from '../../../../utilities/structured.logging.utility.js';

/**
 * Retrieves a GitHub repository by owner and name
 * 
 * @param requestParameters - The parameters for the repository request
 * @returns An operation result containing either the repository data or error information
 */
export async function getRepositoryByOwnerAndName(
  requestParameters: GetRepositoryRequestType
): Promise<OperationResult<GetRepositoryResponseType>> {
  StructuredLoggingUtility.recordDebugEntry('Retrieving repository', { 
    owner: requestParameters.owner,
    repo: requestParameters.repo
  });
  
  // Validate input parameters
  const validationResult = validateOperationInput(getRepositorySchema, requestParameters);
  if (!validationResult.resultSuccessful) {
    return validationResult;
  }
  
  // Execute operation
  try {
    const githubService = getGitHubService();
    const repository = await githubService.getRepository(validationResult.resultData);
    
    const response: GetRepositoryResponseType = {
      repository,
      requestTimestamp: new Date().toISOString()
    };
    
    StructuredLoggingUtility.recordInfoEntry('Successfully retrieved repository', {
      owner: requestParameters.owner,
      repo: requestParameters.repo,
      id: repository.repositoryId
    });
    
    return ApplicationErrorHandlingUtility.createSuccessResult(response);
  } catch (error) {
    StructuredLoggingUtility.recordErrorEntry('Failed to retrieve repository', {
      owner: requestParameters.owner,
      repo: requestParameters.repo,
      error: error instanceof Error ? error.message : String(error)
    });
    
    return ApplicationErrorHandlingUtility.createFailureResult(
      ApplicationErrorHandlingUtility.wrapExceptionAsStandardizedError(
        error,
        `Failed to retrieve repository ${requestParameters.owner}/${requestParameters.repo}`
      )
    );
  }
}