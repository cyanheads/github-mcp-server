/**
 * Create Release Operation
 * ======================
 *
 * This operation creates a new release in a GitHub repository.
 */

import { OperationResult } from '../../../../types/operation.result.types.js';
import { CreateReleaseRequestType, CreateReleaseResponseType } from './create.release.types.js';
import { getGitHubService } from '../../../../services/githubAccess/github.service.js';
import { ApplicationErrorHandlingUtility } from '../../../../utilities/error.handling.utility.js';
import { StructuredLoggingUtility } from '../../../../utilities/structured.logging.utility.js';

/**
 * Creates a new release in a GitHub repository
 * 
 * @param {CreateReleaseRequestType} requestPayload - Request parameters containing release details
 * @returns {Promise<OperationResult<CreateReleaseResponseType>>} Operation result with success or error information
 */
export async function createRepositoryRelease(
  requestPayload: CreateReleaseRequestType
): Promise<OperationResult<CreateReleaseResponseType>> {
  try {
    StructuredLoggingUtility.recordInfoEntry('Creating repository release', { 
      owner: requestPayload.owner,
      repo: requestPayload.repo,
      tag_name: requestPayload.tag_name
    });

    // Get GitHub service
    const githubService = getGitHubService();
    
    // Create the release
    const release = await githubService.createRelease({
      owner: requestPayload.owner,
      repo: requestPayload.repo,
      tag_name: requestPayload.tag_name,
      name: requestPayload.name,
      body: requestPayload.body,
      draft: requestPayload.draft,
      prerelease: requestPayload.prerelease
    });
    
    // Return success response
    return {
      resultSuccessful: true,
      resultData: {
        release: release,
        repository: {
          owner: requestPayload.owner,
          name: requestPayload.repo
        },
        creationTimestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    StructuredLoggingUtility.recordErrorEntry('Error creating repository release', { 
      error: error instanceof Error ? error.message : String(error),
      requestPayload
    });
    
    return {
      resultSuccessful: false,
      resultError: ApplicationErrorHandlingUtility.createGithubApiError(
        'Failed to create repository release',
        {
          owner: requestPayload.owner,
          repo: requestPayload.repo,
          tag_name: requestPayload.tag_name,
          originalError: error
        }
      )
    };
  }
}