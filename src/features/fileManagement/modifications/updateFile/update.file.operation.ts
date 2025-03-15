/**
 * Update File Operation
 * ===================
 *
 * This operation creates or updates a file in a GitHub repository.
 */

import { OperationResult } from '../../../../types/operation.result.types.js';
import { UpdateFileRequestType, UpdateFileResponseType } from './update.file.types.js';
import { getGitHubService } from '../../../../services/githubAccess/github.service.js';
import { ApplicationErrorHandlingUtility } from '../../../../utilities/error.handling.utility.js';
import { StructuredLoggingUtility } from '../../../../utilities/structured.logging.utility.js';

/**
 * Creates or updates a file in a GitHub repository
 * 
 * @param {UpdateFileRequestType} requestPayload - Request parameters containing file details
 * @returns {Promise<OperationResult<UpdateFileResponseType>>} Operation result with success or error information
 */
export async function updateRepositoryFile(
  requestPayload: UpdateFileRequestType
): Promise<OperationResult<UpdateFileResponseType>> {
  try {
    StructuredLoggingUtility.recordInfoEntry('Updating repository file', { 
      owner: requestPayload.owner,
      repo: requestPayload.repo,
      path: requestPayload.path
    });

    // Get GitHub service
    const githubService = getGitHubService();
    
    // Update the file
    const updateResult = await githubService.updateFile({
      owner: requestPayload.owner,
      repo: requestPayload.repo,
      path: requestPayload.path,
      message: requestPayload.message,
      content: requestPayload.content,
      sha: requestPayload.sha,
      branch: requestPayload.branch
    });
    
    // Generate a commit URL
    const commitUrl = `https://github.com/${requestPayload.owner}/${requestPayload.repo}/commit/${updateResult.commitSha}`;
    
    // Return success response
    return ApplicationErrorHandlingUtility.createSuccessResult({
      commit: {
        sha: updateResult.commitSha,
        url: commitUrl,
        message: requestPayload.message
      },
      repository: {
        owner: requestPayload.owner,
        name: requestPayload.repo
      },
      filePath: requestPayload.path,
      updateTimestamp: new Date().toISOString()
    });
  } catch (error) {
    StructuredLoggingUtility.recordErrorEntry('Error updating repository file', { 
      error: error instanceof Error ? error.message : String(error),
      requestPayload
    });
    
    return ApplicationErrorHandlingUtility.createFailureResult(
      ApplicationErrorHandlingUtility.createGithubApiError(
        'Failed to update repository file',
        {
          owner: requestPayload.owner,
          repo: requestPayload.repo,
          path: requestPayload.path,
          originalError: error
        }
      )
    );
  }
}