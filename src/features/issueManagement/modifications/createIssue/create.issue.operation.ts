/**
 * Create Issue Operation
 * ======================
 *
 * This operation creates a new issue in a GitHub repository.
 */

import { OperationResult } from '../../../../types/operation.result.types.js';
import { CreateIssueRequestType, CreateIssueResponseType } from './create.issue.types.js';
import { getGitHubService } from '../../../../services/githubAccess/github.service.js';
import { ApplicationErrorHandlingUtility } from '../../../../utilities/error.handling.utility.js';
import { StructuredLoggingUtility } from '../../../../utilities/structured.logging.utility.js';

/**
 * Creates a new issue in a GitHub repository
 * 
 * @param {CreateIssueRequestType} requestPayload - Request parameters containing issue details
 * @returns {Promise<OperationResult<CreateIssueResponseType>>} Operation result with success or error information
 */
export async function createRepositoryIssue(
  requestPayload: CreateIssueRequestType
): Promise<OperationResult<CreateIssueResponseType>> {
  try {
    StructuredLoggingUtility.recordInfoEntry('Creating repository issue', { 
      owner: requestPayload.owner,
      repo: requestPayload.repo,
      title: requestPayload.title
    });

    // Get GitHub service
    const githubService = getGitHubService();
    
    // Create the issue
    const issue = await githubService.createIssue({
      owner: requestPayload.owner,
      repo: requestPayload.repo,
      title: requestPayload.title,
      body: requestPayload.body,
      labels: requestPayload.labels
    });
    
    // Return success response with properly structured data
    return {
      resultSuccessful: true,
      resultData: {
        issue: issue,
        repository: {
          owner: requestPayload.owner,
          name: requestPayload.repo
        },
        creationTimestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    StructuredLoggingUtility.recordErrorEntry('Error creating repository issue', { 
      error: error instanceof Error ? error.message : String(error),
      requestPayload
    });
    
    return {
      resultSuccessful: false,
      resultError: ApplicationErrorHandlingUtility.createGithubApiError(
        'Failed to create repository issue',
        {
          owner: requestPayload.owner,
          repo: requestPayload.repo,
          title: requestPayload.title,
          originalError: error
        }
      )
    };
  }
}