/**
 * Create Repository Operation Module
 * ================================
 *
 * This module provides the operation for creating a new GitHub repository.
 * It validates the input, creates the repository, and returns the result in a standardized format.
 */

import { OperationResult } from '../../../../types/operation.result.types.js';
import { CreateRepositoryRequestType, CreateRepositoryResponseType } from './create.repository.types.js';
import { getGitHubService } from '../../../../services/githubAccess/index.export.js';
import { validateOperationInput } from '../../../../utilities/validation.utility.js';
import { createRepositorySchema } from '../../../../utilities/validation.utility.js';
import { ApplicationErrorHandlingUtility } from '../../../../utilities/error.handling.utility.js';
import { StructuredLoggingUtility } from '../../../../utilities/structured.logging.utility.js';

/**
 * Creates a new GitHub repository
 * 
 * @param requestParameters - The parameters for the repository creation
 * @returns An operation result containing either the created repository data or error information
 */
export async function createNewRepository(
  requestParameters: CreateRepositoryRequestType
): Promise<OperationResult<CreateRepositoryResponseType>> {
  StructuredLoggingUtility.recordDebugEntry('Creating repository', { 
    name: requestParameters.name,
    private: requestParameters.private
  });
  
  // Validate input parameters
  const validationResult = validateOperationInput(createRepositorySchema, requestParameters);
  if (!validationResult.resultSuccessful) {
    return validationResult;
  }
  
  // Execute operation
  try {
    const githubService = getGitHubService();
    const repository = await githubService.createRepository(validationResult.resultData);
    
    const response: CreateRepositoryResponseType = {
      repository,
      creationTimestamp: new Date().toISOString()
    };
    
    StructuredLoggingUtility.recordInfoEntry('Successfully created repository', {
      name: requestParameters.name,
      id: repository.repositoryId,
      url: repository.repositoryUrl
    });
    
    return ApplicationErrorHandlingUtility.createSuccessResult(response);
  } catch (error) {
    StructuredLoggingUtility.recordErrorEntry('Failed to create repository', {
      name: requestParameters.name,
      error: error instanceof Error ? error.message : String(error)
    });
    
    return ApplicationErrorHandlingUtility.createFailureResult(
      ApplicationErrorHandlingUtility.wrapExceptionAsStandardizedError(
        error,
        `Failed to create repository ${requestParameters.name}`
      )
    );
  }
}