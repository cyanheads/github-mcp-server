/**
 * Create Pull Request Operation
 * ============================
 *
 * This operation creates a new pull request in a GitHub repository.
 */

import { OperationResult } from '../../../../types/operation.result.types.js';
import { CreatePullRequestRequestType, CreatePullRequestResponseType } from './create.pull.request.types.js';
import { getGitHubService } from '../../../../services/githubAccess/github.service.js';
import { ApplicationErrorHandlingUtility } from '../../../../utilities/error.handling.utility.js';
import { StructuredLoggingUtility } from '../../../../utilities/structured.logging.utility.js';

/**
 * Creates a new pull request in a GitHub repository
 * 
 * @param {CreatePullRequestRequestType} requestPayload - Request parameters containing pull request details
 * @returns {Promise<OperationResult<CreatePullRequestResponseType>>} Operation result with success or error information
 */
export async function createRepositoryPullRequest(
  requestPayload: CreatePullRequestRequestType
): Promise<OperationResult<CreatePullRequestResponseType>> {
  try {
    StructuredLoggingUtility.recordInfoEntry('Creating pull request', { 
      owner: requestPayload.owner,
      repo: requestPayload.repo,
      title: requestPayload.title,
      head: requestPayload.head,
      base: requestPayload.base
    });

    // Get GitHub service
    const githubService = getGitHubService();
    
    // Create the pull request
    const pullRequest = await githubService.createPullRequest({
      owner: requestPayload.owner,
      repo: requestPayload.repo,
      title: requestPayload.title,
      head: requestPayload.head,
      base: requestPayload.base,
      body: requestPayload.body
    });
    
    // Return success response
    return {
      resultSuccessful: true,
      resultData: {
        pullRequest: pullRequest,
        repository: {
          owner: requestPayload.owner,
          name: requestPayload.repo
        },
        creationTimestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    StructuredLoggingUtility.recordErrorEntry('Error creating pull request', { 
      error: error instanceof Error ? error.message : String(error),
      requestPayload
    });
    
    return {
      resultSuccessful: false,
      resultError: ApplicationErrorHandlingUtility.createGithubApiError(
        'Failed to create pull request',
        {
          owner: requestPayload.owner,
          repo: requestPayload.repo,
          title: requestPayload.title,
          head: requestPayload.head,
          base: requestPayload.base,
          originalError: error
        }
      )
    };
  }
}