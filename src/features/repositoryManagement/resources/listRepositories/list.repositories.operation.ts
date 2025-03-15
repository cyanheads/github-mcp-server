/**
 * List Repositories Operation Module
 * ================================
 *
 * This module provides the operation for listing GitHub repositories for the authenticated user.
 * It validates the input, retrieves the repositories, and returns them in a standardized format.
 */

import { OperationResult } from '../../../../types/operation.result.types.js';
import { ListRepositoriesRequestType, ListRepositoriesResponseType } from './list.repositories.types.js';
import { getGitHubService } from '../../../../services/githubAccess/index.export.js';
import { validateOperationInput } from '../../../../utilities/validation.utility.js';
import { listRepositoriesSchema } from '../../../../utilities/validation.utility.js';
import { ApplicationErrorHandlingUtility } from '../../../../utilities/error.handling.utility.js';
import { StructuredLoggingUtility } from '../../../../utilities/structured.logging.utility.js';

/**
 * Lists GitHub repositories for the authenticated user
 * 
 * @param requestParameters - Parameters for filtering and sorting repositories
 * @returns An operation result containing either the repositories or error information
 */
export async function listAuthenticatedUserRepositories(
  requestParameters: ListRepositoriesRequestType
): Promise<OperationResult<ListRepositoriesResponseType>> {
  StructuredLoggingUtility.recordDebugEntry('Listing repositories', { 
    type: requestParameters.type,
    sort: requestParameters.sort
  });
  
  // Validate input parameters
  const validationResult = validateOperationInput(listRepositoriesSchema, requestParameters);
  if (!validationResult.resultSuccessful) {
    return validationResult;
  }
  
  // Execute operation
  try {
    const githubService = getGitHubService();
    const repositories = await githubService.listRepositories(validationResult.resultData);
    
    const response: ListRepositoriesResponseType = {
      repositories,
      pagination: {
        count: repositories.length
      },
      requestTimestamp: new Date().toISOString()
    };
    
    StructuredLoggingUtility.recordInfoEntry('Successfully listed repositories', {
      count: repositories.length,
      type: requestParameters.type
    });
    
    return ApplicationErrorHandlingUtility.createSuccessResult(response);
  } catch (error) {
    StructuredLoggingUtility.recordErrorEntry('Failed to list repositories', {
      type: requestParameters.type,
      error: error instanceof Error ? error.message : String(error)
    });
    
    return ApplicationErrorHandlingUtility.createFailureResult(
      ApplicationErrorHandlingUtility.wrapExceptionAsStandardizedError(
        error,
        'Failed to list repositories for authenticated user'
      )
    );
  }
}