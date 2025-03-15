/**
 * GitHub Service Module
 * ===================
 *
 * This module provides a service for interacting with the GitHub API.
 * It encapsulates the Octokit client and provides a cleaner interface
 * for performing GitHub operations.
 */

import { Octokit } from '@octokit/rest';
import { getApplicationConfiguration } from '../../configuration/index.export.js';
import { StructuredLoggingUtility } from '../../utilities/structured.logging.utility.js';
import { ApplicationErrorHandlingUtility } from '../../utilities/error.handling.utility.js';
import { 
  asRecord, 
  asRequestParameters, 
  safeAccess, 
  extractResponseHeaders, 
  hasHeaders 
} from '../../utilities/type.casting.utility.js';
import { 
  createSafeTimeout,
  withRetry
} from '../../utilities/promise.utility.js';
import { 
  GitHubRepositoryEntity,
  GitHubBranchEntity,
  GitHubIssueEntity,
  GitHubPullRequestEntity,
  GitHubReleaseEntity
} from '../../types/entity.definition.types.js';

import { 
  GitHubServiceInterface,
  CreateRepositoryParams,
  GetRepositoryParams,
  ListRepositoriesParams,
  CreateBranchParams,
  DeleteBranchParams,
  ListBranchesParams,
  CreateIssueParams,
  ListIssuesParams,
  CreatePullRequestParams,
  MergePullRequestParams,
  UpdatePullRequestParams,
  ListPullRequestsParams,
  UpdateFileParams,
  CreateReleaseParams
} from './github.service.types.js';

import { getGitHubResponseMapper } from './github.response.mapper.js';
import { getGitHubRateLimiter } from './github.rate.limiter.js';

/**
 * Maximum number of retry attempts for rate-limited or transient errors
 */
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Base delay for exponential backoff in milliseconds
 */
const BASE_RETRY_DELAY_MS = 1000;

/**
 * Configuration refresh interval (15 minutes)
 */
const CONFIG_REFRESH_INTERVAL_MS = 15 * 60 * 1000;
 
/**
 * Implementation of GitHubServiceInterface that uses Octokit to interact with GitHub API
 */
export class GitHubService implements GitHubServiceInterface {
  private static instance: GitHubService;
  private _octokit: Octokit;
  private mapper = getGitHubResponseMapper();
  private rateLimiter = getGitHubRateLimiter();
  private _config = getApplicationConfiguration();
  private lastConfigRefresh: number = Date.now();

  /**
   * Type guard for GitHub API error objects
   */
  private isGitHubApiError(error: unknown): error is { 
    status?: number;
    message?: string;
    response?: { 
      headers?: Record<string, string>
    }
  } {
    return typeof error === 'object' && 
           error !== null && 
           (('status' in error) || ('message' in error));
  }

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Initialize the Octokit client
    this._octokit = this.createOctokitClient();
    
    StructuredLoggingUtility.recordInfoEntry('GitHub service initialized');
  }

  /**
   * Creates a new Octokit client with current configuration
   * @returns New Octokit client instance
   */
  private createOctokitClient(): Octokit {
    return new Octokit({
      auth: this._config.githubToken,
      request: {
        timeout: this._config.apiTimeoutMs
      }
    });
  }

  /**
   * Get the current Octokit client, refreshing if needed
   * @returns Current Octokit client
   */
  private get octokit(): Octokit {
    this.refreshConfigurationIfNeeded();
    return this._octokit;
  }

  /**
   * Get the current configuration, refreshing if needed
   * @returns Current application configuration
   */
  private get config(): any {
    this.refreshConfigurationIfNeeded();
    return this._config;
  }

  /**
   * Refresh the configuration if the refresh interval has elapsed
   */
  private refreshConfigurationIfNeeded(): void {
    const now = Date.now();
    const timeSinceLastRefresh = now - this.lastConfigRefresh;
    
    if (timeSinceLastRefresh >= CONFIG_REFRESH_INTERVAL_MS) {
      try {
        // Get fresh configuration
        const newConfig = getApplicationConfiguration();
        
        // Check if token or other critical settings changed
        const tokenChanged = this._config.githubToken !== newConfig.githubToken;
        const timeoutChanged = this._config.apiTimeoutMs !== newConfig.apiTimeoutMs;
        
        if (tokenChanged || timeoutChanged) {
          StructuredLoggingUtility.recordInfoEntry('GitHub service configuration changed, recreating client', {
            tokenChanged,
            timeoutChanged
          });
          
          // Update config
          this._config = newConfig;
          
          // Create new Octokit instance with new config
          this._octokit = this.createOctokitClient();
        } else {
          // Just update config
          this._config = newConfig;
        }
        
        this.lastConfigRefresh = now;
      } catch (error) {
        StructuredLoggingUtility.recordErrorEntry('Failed to refresh GitHub service configuration', { 
          error: error instanceof Error ? error.message : String(error)
        });
        // Continue with existing configuration
      }
    }
  }

  /**
   * Explicitly refresh the configuration and client
   * This can be called when a token refresh is known to have occurred
   */
  public refreshConfiguration(): void {
    try {
      // Force config refresh
      this._config = getApplicationConfiguration();
      this._octokit = this.createOctokitClient();
      this.lastConfigRefresh = Date.now();
      
      StructuredLoggingUtility.recordInfoEntry('GitHub service configuration refreshed manually');
    } catch (error) {
      StructuredLoggingUtility.recordErrorEntry('Failed to manually refresh GitHub service configuration', { 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Gets the singleton instance of the GitHub service
   * @returns The GitHub service instance
   */
  public static getInstance(): GitHubService {
    if (!GitHubService.instance) {
      GitHubService.instance = new GitHubService();
    }
    return GitHubService.instance;
  }
  
  /**
   * Executes a GitHub API request with rate limiting and retry logic
   * 
   * @param operationName - Name of the operation being performed
   * @param apiCall - Function that makes the API call
   * @returns Result of the API call
   */
  private async executeWithRateLimiting<T>(
    operationName: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    let retryCount = 0;
    
    while (true) {
      try {
        // Check if we should wait due to rate limiting
        await this.rateLimiter.checkRateLimit();
        
        // Execute the API call
        const response: unknown = await apiCall();
        
        // Update rate limit info from response headers if available
        if (hasHeaders(response)) {
          const headers = extractResponseHeaders(response);
          this.rateLimiter.updateRateLimitFromHeaders(headers);
        }
        
        return response as T;
      } catch (error: unknown) {
        // Safely extract error information
        let statusCode = 0;
        let errorMessage = 'Unknown error';
        let isRateLimitError = false;
        
        if (this.isGitHubApiError(error)) {
          statusCode = error.status || 0;
          errorMessage = error.message || 'GitHub API error';
          isRateLimitError = statusCode === 403 && errorMessage.includes('API rate limit exceeded');
        } else if (error instanceof Error) {
          errorMessage = error.message;
        } else {
          errorMessage = String(error);
        }
        
        // Check if this is a transient error that we can retry
        const isTransientError = statusCode >= 500 || 
          statusCode === 429 || isRateLimitError;
          
        // If we can retry and haven't exceeded max retries
        if (isTransientError && retryCount < MAX_RETRY_ATTEMPTS) {
          retryCount++;
          
          // Calculate exponential backoff delay
          const delay = BASE_RETRY_DELAY_MS * Math.pow(2, retryCount);
          
          StructuredLoggingUtility.recordWarnEntry(`GitHub API error, retrying operation`, {
            operationName,
            retryCount,
            delay,
            errorStatus: statusCode,
            errorMessage
          });
          
          // Handle rate limit errors specially
          if (isRateLimitError) {
            // Safely extract retry-after header
            let retryAfter: string | undefined;
            if (this.isGitHubApiError(error) && error.response && error.response.headers) {
              retryAfter = error.response.headers['retry-after'];
            }
            
            await this.rateLimiter.handleRateLimitExceeded(retryAfter);
          } else {
            // Wait according to exponential backoff with proper cleanup
            const timeout = createSafeTimeout(delay, `Retry for ${operationName}`);
            await timeout.promise;
          }
          
          // Continue to next retry attempt
          continue;
        }
        
        // We either can't retry or have exceeded max retries
        throw this.handleGitHubApiError(error, operationName);
      }
    }
  }
  
  /**
   * Generic method to handle GitHub API errors
   */
  private handleGitHubApiError(error: unknown, operationName: string): never {
    let errorMessage: string;
    
    if (this.isGitHubApiError(error)) {
      errorMessage = error.message || 'Unknown GitHub API error';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      errorMessage = String(error);
    }
    
    StructuredLoggingUtility.recordErrorEntry(`GitHub API error in ${operationName}`, { error: errorMessage });
    
    throw ApplicationErrorHandlingUtility.createGithubApiError(
      `GitHub API error in ${operationName}: ${errorMessage}`,
      { originalError: error }
    );
  }
  
  // #region Repository Management
  
  /**
   * Creates a new GitHub repository
   * @param params Repository creation parameters
   * @returns The created repository entity
   */
  async createRepository(params: CreateRepositoryParams): Promise<GitHubRepositoryEntity> {
    return this.executeWithRateLimiting('createRepository', async () => {
      StructuredLoggingUtility.recordDebugEntry('Creating repository', asRecord(params));
      const response = await this.octokit.repos.createForAuthenticatedUser(asRequestParameters(params));
      return this.mapper.mapRepositoryResponse(response.data);
    });
  }
  
  /**
   * Gets information about a GitHub repository
   * @param params Repository request parameters
   * @returns The repository entity
   */
  async getRepository(params: GetRepositoryParams): Promise<GitHubRepositoryEntity> {
    return this.executeWithRateLimiting('getRepository', async () => {
      StructuredLoggingUtility.recordDebugEntry('Getting repository', asRecord(params));
      const response = await this.octokit.repos.get(asRequestParameters(params));
      return this.mapper.mapRepositoryResponse(response.data);
    });
  }
  
  /**
   * Lists repositories for the authenticated user
   * @param params Repository listing parameters
   * @returns Array of repository entities
   */
  async listRepositories(params: ListRepositoriesParams): Promise<GitHubRepositoryEntity[]> {
    return this.executeWithRateLimiting('listRepositories', async () => {
      StructuredLoggingUtility.recordDebugEntry('Listing repositories', asRecord(params));
      const response = await this.octokit.repos.listForAuthenticatedUser(asRequestParameters(params));
      return this.mapper.mapRepositoriesResponse(response.data);
    });
  }
  
  // #endregion
  
  // #region Branch Management
  
  /**
   * Creates a new branch in a repository
   * @param params Branch creation parameters
   * @returns The created branch entity
   */
  async createBranch(params: CreateBranchParams): Promise<GitHubBranchEntity> {
    return this.executeWithRateLimiting('createBranch', async () => {
      const { owner, repo, branch, sha } = params;
      StructuredLoggingUtility.recordDebugEntry('Creating branch', asRecord({ owner, repo, branch, sha }));
      
      const response = await this.octokit.git.createRef({
        owner: owner,
        repo: repo,
        ref: `refs/heads/${branch}`,
        sha: sha
      });
      
      // Since createRef doesn't return full branch info, we need to get it separately
      const branchResponse = await this.octokit.repos.getBranch({
        owner: owner,
        repo: repo,
        branch: branch
      });
      
      return this.mapper.mapBranchResponse(branchResponse.data);
    });
  }
  
  /**
   * Deletes a branch from a repository
   * @param params Branch deletion parameters
   */
  async deleteBranch(params: DeleteBranchParams): Promise<void> {
    return this.executeWithRateLimiting('deleteBranch', async () => {
      const { owner, repo, branch } = params;
      StructuredLoggingUtility.recordDebugEntry('Deleting branch', asRecord({ owner, repo, branch }));
      
      await this.octokit.git.deleteRef({
        owner: owner,
        repo: repo,
        ref: `heads/${branch}`
      });
      
      StructuredLoggingUtility.recordInfoEntry('Branch deleted successfully', asRecord({ owner, repo, branch }));
    });
  }
  
  /**
   * Lists branches in a repository
   * @param params Branch listing parameters
   * @returns Array of branch entities
   */
  async listBranches(params: ListBranchesParams): Promise<GitHubBranchEntity[]> {
    return this.executeWithRateLimiting('listBranches', async () => {
      StructuredLoggingUtility.recordDebugEntry('Listing branches', asRecord(params));
      const response = await this.octokit.repos.listBranches(asRequestParameters(params));
      return this.mapper.mapBranchesResponse(response.data);
    });
  }
  
  // #endregion
  
  // #region Issue Management
  
  /**
   * Creates a new issue in a repository
   * @param params Issue creation parameters
   * @returns The created issue entity
   */
  async createIssue(params: CreateIssueParams): Promise<GitHubIssueEntity> {
    return this.executeWithRateLimiting('createIssue', async () => {
      StructuredLoggingUtility.recordDebugEntry('Creating issue', asRecord(params));
      const response = await this.octokit.issues.create(asRequestParameters(params));
      return this.mapper.mapIssueResponse(response.data);
    });
  }
  
  /**
   * Lists issues in a repository
   * @param params Issue listing parameters
   * @returns Array of issue entities
   */
  async listIssues(params: ListIssuesParams): Promise<GitHubIssueEntity[]> {
    return this.executeWithRateLimiting('listIssues', async () => {
      StructuredLoggingUtility.recordDebugEntry('Listing issues', asRecord(params));
      
      // Handle label conversion for the API
      const apiParams = {
        ...params,
        labels: params.labels?.join(',')
      };
      
      const response = await this.octokit.issues.listForRepo(apiParams);
      return this.mapper.mapIssuesResponse(response.data);
    });
  }
  
  // #endregion
  
  // #region Pull Request Management
  
  /**
   * Creates a new pull request
   * @param params Pull request creation parameters
   * @returns The created pull request entity
   */
  async createPullRequest(params: CreatePullRequestParams): Promise<GitHubPullRequestEntity> {
    return this.executeWithRateLimiting('createPullRequest', async () => {
      StructuredLoggingUtility.recordDebugEntry('Creating pull request', asRecord(params));
      const response = await this.octokit.pulls.create(asRequestParameters(params));
      return this.mapper.mapPullRequestResponse(response.data);
    });
  }
  
  /**
   * Merges a pull request
   * @param params Pull request merge parameters
   * @returns Merge result information
   */
  async mergePullRequest(params: MergePullRequestParams): Promise<{ merged: boolean; message: string; sha?: string }> {
    return this.executeWithRateLimiting('mergePullRequest', async () => {
      StructuredLoggingUtility.recordDebugEntry('Merging pull request', asRecord(params));
      const response = await this.octokit.pulls.merge(asRequestParameters(params));
      
      return {
        merged: response.data.merged,
        message: response.data.message,
        sha: response.data.sha
      };
    });
  }
  
  /**
   * Updates an existing pull request
   * @param params Pull request update parameters
   * @returns The updated pull request entity
   */
  async updatePullRequest(params: UpdatePullRequestParams): Promise<GitHubPullRequestEntity> {
    return this.executeWithRateLimiting('updatePullRequest', async () => {
      StructuredLoggingUtility.recordDebugEntry('Updating pull request', asRecord(params));
      const response = await this.octokit.pulls.update(asRequestParameters(params));
      return this.mapper.mapPullRequestResponse(response.data);
    });
  }
  
  /**
   * Lists pull requests in a repository
   * @param params Pull request listing parameters
   * @returns Array of pull request entities
   */
  async listPullRequests(params: ListPullRequestsParams): Promise<GitHubPullRequestEntity[]> {
    return this.executeWithRateLimiting('listPullRequests', async () => {
      StructuredLoggingUtility.recordDebugEntry('Listing pull requests', asRecord(params));
      const response = await this.octokit.pulls.list(asRequestParameters(params));
      return this.mapper.mapPullRequestsResponse(response.data);
    });
  }
  
  // #endregion
  
  // #region File Management
  
  /**
   * Creates or updates a file in a repository
   * @param params File update parameters
   * @returns Information about the commit and updated file
   */
  async updateFile(params: UpdateFileParams): Promise<{ commitSha: string; content: { sha: string } }> {
    return this.executeWithRateLimiting('updateFile', async () => {
      StructuredLoggingUtility.recordDebugEntry('Updating file', { 
        owner: params.owner, 
        repo: params.repo, 
        path: params.path, 
        branch: params.branch 
      });
      
      const response = await this.octokit.repos.createOrUpdateFileContents(asRequestParameters(params));
      
      return {
        // Cast to string for TypeScript - safe because we provide a default empty string
        commitSha: safeAccess(response.data.commit, commit => commit.sha, '') || '',
        content: {
          // We know this is safe because safeAccess guarantees a non-undefined return value.
          sha: safeAccess(response.data.content, content => content.sha, '') || ''
        }
      };
    });
  }
  
  // #endregion
  
  // #region Release Management
  
  /**
   * Creates a new release
   * @param params Release creation parameters
   * @returns The created release entity
   */
  async createRelease(params: CreateReleaseParams): Promise<GitHubReleaseEntity> {
    return this.executeWithRateLimiting('createRelease', async () => {
      StructuredLoggingUtility.recordDebugEntry('Creating release', asRecord(params));
      const response = await this.octokit.repos.createRelease(asRequestParameters(params));
      return this.mapper.mapReleaseResponse(response.data);
    });
  }
  
  // #endregion
}

/**
 * Gets the GitHub service instance
 * @returns The GitHub service instance
 */
export function getGitHubService(): GitHubServiceInterface {
  return GitHubService.getInstance();
}