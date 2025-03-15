/**
 * GitHub Response Mapper Module
 * ============================
 *
 * This module provides mapping functionality between GitHub API responses
 * and our domain entity types. It encapsulates the transformation logic.
 */

import {
  GitHubRepositoryEntity,
  GitHubBranchEntity,
  GitHubIssueEntity,
  GitHubPullRequestEntity,
  GitHubReleaseEntity
} from '../../types/entity.definition.types.js';
import { 
  GitHubApiRepository,
  GitHubApiBranch,
  GitHubApiIssue,
  GitHubApiPullRequest,
  GitHubApiRelease,
  GitHubStateType
} from './github.api.types.js';
import { GitHubResponseMapper } from './github.service.types.js';
import { StructuredLoggingUtility } from '../../utilities/structured.logging.utility.js';

/**
 * Implementation of GitHubResponseMapper for converting between 
 * GitHub API responses and domain entities
 */
export class GitHubResponseMapperImpl implements GitHubResponseMapper {
  /**
   * Validates and converts GitHub state string to the proper type
   * 
   * @param state - State string from GitHub API
   * @returns Validated state ('open' or 'closed')
   */
  private validateState(state: string): GitHubStateType {
    if (state === 'open' || state === 'closed') {
      return state;
    }
    // Default to 'closed' if an unexpected state is received
    StructuredLoggingUtility.recordWarnEntry('Unexpected state value received', { state });
    return 'closed';
  }

  /**
   * Maps a GitHub repository API response to a domain entity
   */
  mapRepositoryResponse(apiResponse: GitHubApiRepository): GitHubRepositoryEntity {
    StructuredLoggingUtility.recordDebugEntry('Mapping repository response', { id: apiResponse.id });
    
    return {
      repositoryId: apiResponse.id,
      repositoryName: apiResponse.name,
      repositoryFullName: apiResponse.full_name,
      repositoryUrl: apiResponse.html_url,
      isPrivate: apiResponse.private,
      description: apiResponse.description || '',
      createdAt: apiResponse.created_at,
      updatedAt: apiResponse.updated_at
    };
  }
  
  /**
   * Maps an array of GitHub repository API responses to domain entities
   */
  mapRepositoriesResponse(apiResponses: GitHubApiRepository[]): GitHubRepositoryEntity[] {
    StructuredLoggingUtility.recordDebugEntry('Mapping repositories response', { count: apiResponses.length });
    return apiResponses.map(repo => this.mapRepositoryResponse(repo));
  }
  
  /**
   * Maps a GitHub branch API response to a domain entity
   */
  mapBranchResponse(apiResponse: GitHubApiBranch): GitHubBranchEntity {
    StructuredLoggingUtility.recordDebugEntry('Mapping branch response', { name: apiResponse.name });
    
    return {
      name: apiResponse.name,
      commit: {
        sha: apiResponse.commit.sha,
        url: apiResponse.commit.url
      },
      protected: apiResponse.protected
    };
  }
  
  /**
   * Maps an array of GitHub branch API responses to domain entities
   */
  mapBranchesResponse(apiResponses: GitHubApiBranch[]): GitHubBranchEntity[] {
    StructuredLoggingUtility.recordDebugEntry('Mapping branches response', { count: apiResponses.length });
    return apiResponses.map(branch => this.mapBranchResponse(branch));
  }
  
  /**
   * Maps a GitHub issue API response to a domain entity
   */
  mapIssueResponse(apiResponse: GitHubApiIssue): GitHubIssueEntity {
    StructuredLoggingUtility.recordDebugEntry('Mapping issue response', { number: apiResponse.number });
    
    return {
      number: apiResponse.number,
      title: apiResponse.title,
      body: apiResponse.body || '',
      state: this.validateState(apiResponse.state),
      labels: apiResponse.labels ? apiResponse.labels.map(label => label.name) : [],
      createdAt: apiResponse.created_at,
      updatedAt: apiResponse.updated_at
    };
  }
  
  /**
   * Maps an array of GitHub issue API responses to domain entities
   */
  mapIssuesResponse(apiResponses: GitHubApiIssue[]): GitHubIssueEntity[] {
    StructuredLoggingUtility.recordDebugEntry('Mapping issues response', { count: apiResponses.length });
    return apiResponses.map(issue => this.mapIssueResponse(issue));
  }
  
  /**
   * Maps a GitHub pull request API response to a domain entity
   */
  mapPullRequestResponse(apiResponse: GitHubApiPullRequest): GitHubPullRequestEntity {
    StructuredLoggingUtility.recordDebugEntry('Mapping pull request response', { number: apiResponse.number });
    
    return {
      number: apiResponse.number,
      title: apiResponse.title,
      body: apiResponse.body || '',
      state: this.validateState(apiResponse.state),
      head: apiResponse.head.ref,
      base: apiResponse.base.ref,
      mergeable: apiResponse.mergeable ?? false,
      createdAt: apiResponse.created_at,
      updatedAt: apiResponse.updated_at
    };
  }
  
  /**
   * Maps an array of GitHub pull request API responses to domain entities
   */
  mapPullRequestsResponse(apiResponses: GitHubApiPullRequest[]): GitHubPullRequestEntity[] {
    StructuredLoggingUtility.recordDebugEntry('Mapping pull requests response', { count: apiResponses.length });
    return apiResponses.map(pr => this.mapPullRequestResponse(pr));
  }
  
  /**
   * Maps a GitHub release API response to a domain entity
   */
  mapReleaseResponse(apiResponse: GitHubApiRelease): GitHubReleaseEntity {
    StructuredLoggingUtility.recordDebugEntry('Mapping release response', { id: apiResponse.id });
    
    return {
      id: apiResponse.id,
      tagName: apiResponse.tag_name,
      name: apiResponse.name || '',
      body: apiResponse.body || '',
      draft: apiResponse.draft,
      prerelease: apiResponse.prerelease,
      createdAt: apiResponse.created_at,
      publishedAt: apiResponse.published_at || null
    };
  }
}

/**
 * Singleton instance of the GitHub response mapper
 */
let mapperInstance: GitHubResponseMapper | null = null;

/**
 * Gets the GitHub response mapper instance, creating it if it doesn't exist
 * @returns GitHub response mapper instance
 */
export function getGitHubResponseMapper(): GitHubResponseMapper {
  if (!mapperInstance) {
    mapperInstance = new GitHubResponseMapperImpl();
  }
  return mapperInstance;
}