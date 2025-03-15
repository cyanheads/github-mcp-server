/**
 * List Pull Requests Operation
 * ==========================
 *
 * This operation lists pull requests in a GitHub repository.
 */

import { OperationResult } from '../../../../types/operation.result.types.js';
import { ListPullRequestsRequestType, ListPullRequestsResponseType } from './list.pull.requests.types.js';
import { getGitHubService } from '../../../../services/githubAccess/github.service.js';
import { ApplicationErrorHandlingUtility } from '../../../../utilities/error.handling.utility.js';
import { StructuredLoggingUtility } from '../../../../utilities/structured.logging.utility.js';

/**
 * Lists pull requests in a GitHub repository
 * 
 * @param {ListPullRequestsRequestType} requestPayload - Request parameters containing repository and filter details
 * @returns {Promise<OperationResult<ListPullRequestsResponseType>>} Operation result with success or error information
 */
export async function listRepositoryPullRequests(
  requestPayload: ListPullRequestsRequestType
): Promise<OperationResult<ListPullRequestsResponseType>> {
  try {
    StructuredLoggingUtility.recordInfoEntry('Listing repository pull requests', { 
      owner: requestPayload.owner,
      repo: requestPayload.repo,
      state: requestPayload.state
    });

    // Get GitHub service
    const githubService = getGitHubService();
    
    // List the pull requests
    const pullRequests = await githubService.listPullRequests({
      owner: requestPayload.owner,
      repo: requestPayload.repo,
      state: requestPayload.state,
      head: requestPayload.head,
      base: requestPayload.base,
      sort: requestPayload.sort,
      direction: requestPayload.direction
    });
    
    // Return success response
    return {
      resultSuccessful: true,
      resultData: {
        pullRequests: pullRequests,
        repository: {
          owner: requestPayload.owner,
          name: requestPayload.repo
        },
        filters: {
          state: requestPayload.state,
          head: requestPayload.head,
          base: requestPayload.base
        },
        pagination: {
          totalCount: pullRequests.length
        },
        retrievalTimestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    StructuredLoggingUtility.recordErrorEntry('Error listing repository pull requests', { 
      error: error instanceof Error ? error.message : String(error),
      requestPayload
    });
    
    return {
      resultSuccessful: false,
      resultError: ApplicationErrorHandlingUtility.createGithubApiError(
        'Failed to list repository pull requests',
        {
          owner: requestPayload.owner,
          repo: requestPayload.repo,
          originalError: error
        }
      )
    };
  }
}