/**
 * List Issues Operation
 * ====================
 *
 * This operation lists issues in a GitHub repository.
 */

import { OperationResult } from '../../../../types/operation.result.types.js';
import { ListIssuesRequestType, ListIssuesResponseType } from './list.issues.types.js';
import { getGitHubService } from '../../../../services/githubAccess/github.service.js';
import { ApplicationErrorHandlingUtility } from '../../../../utilities/error.handling.utility.js';
import { StructuredLoggingUtility } from '../../../../utilities/structured.logging.utility.js';

/**
 * Lists issues in a GitHub repository
 * 
 * @param {ListIssuesRequestType} requestPayload - Request parameters containing repository and filter details
 * @returns {Promise<OperationResult<ListIssuesResponseType>>} Operation result with success or error information
 */
export async function listRepositoryIssues(
  requestPayload: ListIssuesRequestType
): Promise<OperationResult<ListIssuesResponseType>> {
  try {
    StructuredLoggingUtility.recordInfoEntry('Listing repository issues', { 
      owner: requestPayload.owner,
      repo: requestPayload.repo,
      state: requestPayload.state
    });

    // Get GitHub service
    const githubService = getGitHubService();
    
    // List the issues
    const issues = await githubService.listIssues({
      owner: requestPayload.owner,
      repo: requestPayload.repo,
      state: requestPayload.state,
      labels: requestPayload.labels
    });
    
    // Return success response
    return {
      resultSuccessful: true,
      resultData: {
        issues: issues,
        repository: {
          owner: requestPayload.owner,
          name: requestPayload.repo
        },
        pagination: {
          totalCount: issues.length,
          // We could add nextPage and prevPage if the API provides these
        },
        retrievalTimestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    StructuredLoggingUtility.recordErrorEntry('Error listing repository issues', { 
      error: error instanceof Error ? error.message : String(error),
      requestPayload
    });
    
    return {
      resultSuccessful: false,
      resultError: ApplicationErrorHandlingUtility.createGithubApiError(
        'Failed to list repository issues',
        {
          owner: requestPayload.owner,
          repo: requestPayload.repo,
          originalError: error
        }
      )
    };
  }
}