/**
 * Merge Pull Request Operation
 * ===========================
 *
 * This operation merges a pull request in a GitHub repository.
 */

import { OperationResult } from '../../../../types/operation.result.types.js';
import { MergePullRequestRequestType, MergePullRequestResponseType } from './merge.pull.request.types.js';
import { getGitHubService } from '../../../../services/githubAccess/github.service.js';
import { ApplicationErrorHandlingUtility } from '../../../../utilities/error.handling.utility.js';
import { StructuredLoggingUtility } from '../../../../utilities/structured.logging.utility.js';

/**
 * Merges a pull request in a GitHub repository
 * 
 * @param {MergePullRequestRequestType} requestPayload - Request parameters containing merge details
 * @returns {Promise<OperationResult<MergePullRequestResponseType>>} Operation result with success or error information
 */
export async function mergeRepositoryPullRequest(
  requestPayload: MergePullRequestRequestType
): Promise<OperationResult<MergePullRequestResponseType>> {
  try {
    StructuredLoggingUtility.recordInfoEntry('Merging pull request', { 
      owner: requestPayload.owner,
      repo: requestPayload.repo,
      pull_number: requestPayload.pull_number,
      merge_method: requestPayload.merge_method
    });

    // Get GitHub service
    const githubService = getGitHubService();
    
    // Merge the pull request
    const mergeResult = await githubService.mergePullRequest({
      owner: requestPayload.owner,
      repo: requestPayload.repo,
      pull_number: requestPayload.pull_number,
      commit_title: requestPayload.commit_title,
      commit_message: requestPayload.commit_message,
      merge_method: requestPayload.merge_method
    });
    
    // Return success response
    return {
      resultSuccessful: true,
      resultData: {
        mergeResult: {
          sha: mergeResult.sha || '',  // Provide empty string as default if sha is undefined
          merged: mergeResult.merged,
          message: mergeResult.message
        },
        repository: {
          owner: requestPayload.owner,
          name: requestPayload.repo
        },
        pullRequestNumber: requestPayload.pull_number,
        mergeTimestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    StructuredLoggingUtility.recordErrorEntry('Error merging pull request', { 
      error: error instanceof Error ? error.message : String(error),
      requestPayload
    });
    
    return {
      resultSuccessful: false,
      resultError: ApplicationErrorHandlingUtility.createGithubApiError(
        'Failed to merge pull request',
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