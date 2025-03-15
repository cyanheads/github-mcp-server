/**
 * GitHub Service Types Module
 * ==========================
 *
 * This module defines the interfaces and types for the GitHub service.
 * It establishes the contract that the service implementation must fulfill.
 */

// Import entity types from entity definition types
import {
  GitHubRepositoryEntity,
  GitHubBranchEntity,
  GitHubIssueEntity,
  GitHubPullRequestEntity,
  GitHubReleaseEntity
} from '../../types/entity.definition.types.js';

// Import feature-specific request types
import { CreateRepositoryRequestType as CreateRepositoryParams } from '../../features/repositoryManagement/modifications/createRepository/create.repository.types.js';
import { GetRepositoryRequestType as GetRepositoryParams } from '../../features/repositoryManagement/resources/getRepository/get.repository.types.js';
import { ListRepositoriesRequestType as ListRepositoriesParams } from '../../features/repositoryManagement/resources/listRepositories/list.repositories.types.js';

import { CreateBranchRequestType as CreateBranchParams } from '../../features/branchManagement/modifications/createBranch/create.branch.types.js';
import { DeleteBranchRequestType as DeleteBranchParams } from '../../features/branchManagement/modifications/deleteBranch/delete.branch.types.js';
import { ListBranchesRequestType as ListBranchesParams } from '../../features/branchManagement/resources/listBranches/list.branches.types.js';

import { CreateIssueRequestType as CreateIssueParams } from '../../features/issueManagement/modifications/createIssue/create.issue.types.js';
import { ListIssuesRequestType as ListIssuesParams } from '../../features/issueManagement/resources/listIssues/list.issues.types.js';

import { CreatePullRequestRequestType as CreatePullRequestParams } from '../../features/pullRequestManagement/modifications/createPullRequest/create.pull.request.types.js';
import { MergePullRequestRequestType as MergePullRequestParams } from '../../features/pullRequestManagement/modifications/mergePullRequest/merge.pull.request.types.js';
import { UpdatePullRequestRequestType as UpdatePullRequestParams } from '../../features/pullRequestManagement/modifications/updatePullRequest/update.pull.request.types.js';
import { ListPullRequestsRequestType as ListPullRequestsParams } from '../../features/pullRequestManagement/resources/listPullRequests/list.pull.requests.types.js';

import { UpdateFileRequestType as UpdateFileParams } from '../../features/fileManagement/modifications/updateFile/update.file.types.js';

import { CreateReleaseRequestType as CreateReleaseParams } from '../../features/releaseManagement/modifications/createRelease/create.release.types.js';

// Re-export all types for usage in the service
export {
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
};

/**
 * GitHub service interface defining all operations available
 * for interacting with the GitHub API
 */
export interface GitHubServiceInterface {
  // Repository operations
  createRepository(params: CreateRepositoryParams): Promise<GitHubRepositoryEntity>;
  getRepository(params: GetRepositoryParams): Promise<GitHubRepositoryEntity>;
  listRepositories(params: ListRepositoriesParams): Promise<GitHubRepositoryEntity[]>;
  
  // Branch operations
  createBranch(params: CreateBranchParams): Promise<GitHubBranchEntity>;
  deleteBranch(params: DeleteBranchParams): Promise<void>;
  listBranches(params: ListBranchesParams): Promise<GitHubBranchEntity[]>;
  
  // Issue operations
  createIssue(params: CreateIssueParams): Promise<GitHubIssueEntity>;
  listIssues(params: ListIssuesParams): Promise<GitHubIssueEntity[]>;
  
  // Pull Request operations
  createPullRequest(params: CreatePullRequestParams): Promise<GitHubPullRequestEntity>;
  mergePullRequest(params: MergePullRequestParams): Promise<{ merged: boolean; message: string; sha?: string }>;
  updatePullRequest(params: UpdatePullRequestParams): Promise<GitHubPullRequestEntity>;
  listPullRequests(params: ListPullRequestsParams): Promise<GitHubPullRequestEntity[]>;
  
  // File operations
  updateFile(params: UpdateFileParams): Promise<{ commitSha: string; content: { sha: string } }>;
  
  // Release operations
  createRelease(params: CreateReleaseParams): Promise<GitHubReleaseEntity>;
}

/**
 * GitHub API response mapping interface
 * Provides methods to convert between API responses and domain entities
 */
export interface GitHubResponseMapper {
  // Repository mapping
  mapRepositoryResponse(apiResponse: any): GitHubRepositoryEntity;
  mapRepositoriesResponse(apiResponse: any[]): GitHubRepositoryEntity[];
  
  // Branch mapping
  mapBranchResponse(apiResponse: any): GitHubBranchEntity;
  mapBranchesResponse(apiResponse: any[]): GitHubBranchEntity[];
  
  // Issue mapping
  mapIssueResponse(apiResponse: any): GitHubIssueEntity;
  mapIssuesResponse(apiResponse: any[]): GitHubIssueEntity[];
  
  // Pull Request mapping
  mapPullRequestResponse(apiResponse: any): GitHubPullRequestEntity;
  mapPullRequestsResponse(apiResponse: any[]): GitHubPullRequestEntity[];
  
  // Release mapping
  mapReleaseResponse(apiResponse: any): GitHubReleaseEntity;
}