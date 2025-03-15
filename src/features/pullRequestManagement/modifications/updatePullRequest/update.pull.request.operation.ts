/**
 * Update Pull Request Operation
 * ===========================
 *
 * This operation updates an existing pull request in a GitHub repository.
 */

import { OperationResult } from '../../../../types/operation.result.types.js';
import { UpdatePullRequestRequestType, UpdatePullRequestResponseType } from './update.pull.request.types.js';
import { getGitHubService } from '../../../../services/githubAccess/github.service.js';
import { ApplicationErrorHandlingUtility } from '../../../../utilities/error.handling.utility.js';
import { StructuredLoggingUtility } from '../../../../utilities/structured.logging.utility.js';

/**
 * Updates an existing pull request in a GitHub repository
 * 
 * @param {UpdatePullRequestRequestType} requestPayload - Request parameters containing update details
 * @returns {Promise<OperationResult<UpdatePullRequestResponseType>>} Operation result with success or error information
 */
export async function updateRepositoryPullRequest(
  requestPayload: UpdatePullRequestRequestType
): Promise<OperationResult<UpdatePullRequestResponseType>> {
  try {
    StructuredLoggingUtility.recordInfoEntry('Updating pull request', { 
      owner: requestPayload.owner,
      repo: requestPayload.repo,
      pull_number: requestPayload.pull_number
    });

    // Get GitHub service
    const githubService = getGitHubService();
    
    // Determine which fields are being updated
    const updatedFields: string[] = [];
    if (requestPayload.title) updatedFields.push('title');
    if (requestPayload.body) updatedFields.push('body');
    if (requestPayload.state) updatedFields.push('state');
    if (requestPayload.base) updatedFields.push('base');
    if (requestPayload.maintainer_can_modify !== undefined) updatedFields.push('maintainer_can_modify');
    
    // Update the pull request
    const updatedPullRequest = await githubService.updatePullRequest({
      owner: requestPayload.owner,
      repo: requestPayload.repo,
      pull_number: requestPayload.pull_number,
      title: requestPayload.title,
      body: requestPayload.body,
      state: requestPayload.state,
      base: requestPayload.base,
      maintainer_can_modify: requestPayload.maintainer_can_modify
    });
    
    // Return success response
    return {
      resultSuccessful: true,
      resultData: {
        pullRequest: updatedPullRequest,
        repository: {
          owner: requestPayload.owner,
          name: requestPayload.repo
        },
        updatedFields: updatedFields,
        updateTimestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    StructuredLoggingUtility.recordErrorEntry('Error updating pull request', { 
      error: error instanceof Error ? error.message : String(error),
      requestPayload
    });
    
    return {
      resultSuccessful: false,
      resultError: ApplicationErrorHandlingUtility.createGithubApiError(
        'Failed to update pull request',
        {
          owner: requestPayload.owner,
          repo: requestPayload.repo,
          pull_number: requestPayload.pull_number,
          originalError: error
        }
      )
    };
  }
}