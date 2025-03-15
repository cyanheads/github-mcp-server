/**
 * Deprecated Types Module
 * ====================
 *
 * IMPORTANT: This file is deprecated and kept only for backward compatibility.
 * 
 * All type definitions have been migrated to feature-specific modules following 
 * the atomic feature-oriented architecture pattern.
 * 
 * Please use the specific feature module types for new development:
 * 
 * - Repository operations: src/features/repositoryManagement/...
 * - Branch operations: src/features/branchManagement/...
 * - Issue operations: src/features/issueManagement/...
 * - Pull Request operations: src/features/pullRequestManagement/...
 * - Release operations: src/features/releaseManagement/...
 * - File operations: src/features/fileManagement/...
 * 
 * Core entity types are available in src/types/entity.definition.types.ts
 * 
 * For example, instead of:
 * import { CreateRepositoryParams } from '../types';
 * 
 * Use:
 * import { CreateRepositoryRequestType } from '../features/repositoryManagement/modifications/createRepository/create.repository.types';
 */

// Re-export common entity types for compatibility
export * from './types/entity.definition.types.js';

// Import and re-export all feature types for backward compatibility
import { CreateRepositoryRequestType } from './features/repositoryManagement/modifications/createRepository/create.repository.types.js';
import { GetRepositoryRequestType } from './features/repositoryManagement/resources/getRepository/get.repository.types.js';
import { ListRepositoriesRequestType } from './features/repositoryManagement/resources/listRepositories/list.repositories.types.js';

import { CreateBranchRequestType } from './features/branchManagement/modifications/createBranch/create.branch.types.js';
import { ListBranchesRequestType } from './features/branchManagement/resources/listBranches/list.branches.types.js';

import { CreateIssueRequestType } from './features/issueManagement/modifications/createIssue/create.issue.types.js';
import { ListIssuesRequestType } from './features/issueManagement/resources/listIssues/list.issues.types.js';

import { CreatePullRequestRequestType } from './features/pullRequestManagement/modifications/createPullRequest/create.pull.request.types.js';
import { MergePullRequestRequestType } from './features/pullRequestManagement/modifications/mergePullRequest/merge.pull.request.types.js';
import { UpdatePullRequestRequestType } from './features/pullRequestManagement/modifications/updatePullRequest/update.pull.request.types.js';
import { ListPullRequestsRequestType } from './features/pullRequestManagement/resources/listPullRequests/list.pull.requests.types.js';

import { UpdateFileRequestType } from './features/fileManagement/modifications/updateFile/update.file.types.js';

import { CreateReleaseRequestType } from './features/releaseManagement/modifications/createRelease/create.release.types.js';

// Type aliases for backward compatibility
export type CreateRepositoryParams = CreateRepositoryRequestType;
export type GetRepositoryParams = GetRepositoryRequestType;
export type ListRepositoriesParams = ListRepositoriesRequestType; 

export type CreateBranchParams = CreateBranchRequestType;
export type DeleteBranchParams = { owner: string; repo: string; branch: string; };
export type ListBranchesParams = ListBranchesRequestType;

export type CreateIssueParams = CreateIssueRequestType;
export type ListIssuesParams = ListIssuesRequestType;

export type CreatePullRequestParams = CreatePullRequestRequestType;
export type MergePullRequestParams = MergePullRequestRequestType;
export type UpdatePullRequestParams = UpdatePullRequestRequestType;
export type ListPullRequestsParams = ListPullRequestsRequestType;

export type UpdateFileParams = UpdateFileRequestType;

export type CreateReleaseParams = CreateReleaseRequestType;

// Re-export type guards for backward compatibility
export function isCreateRepositoryParams(obj: unknown): obj is CreateRepositoryParams {
  return typeof obj === 'object' && obj !== null && 'name' in obj && typeof (obj as any).name === 'string';
}

export function isCreateIssueParams(obj: unknown): obj is CreateIssueParams {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'owner' in obj &&
    'repo' in obj &&
    'title' in obj &&
    typeof (obj as any).owner === 'string' &&
    typeof (obj as any).repo === 'string' &&
    typeof (obj as any).title === 'string'
  );
}

export function isCreatePullRequestParams(obj: unknown): obj is CreatePullRequestParams {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'owner' in obj &&
    'repo' in obj &&
    'title' in obj &&
    'head' in obj &&
    'base' in obj &&
    typeof (obj as any).owner === 'string' &&
    typeof (obj as any).repo === 'string' &&
    typeof (obj as any).title === 'string' &&
    typeof (obj as any).head === 'string' &&
    typeof (obj as any).base === 'string'
  );
}

export function isListRepositoriesParams(obj: unknown): obj is ListRepositoriesParams {
  if (typeof obj !== 'object' || obj === null) return false;
  const params = obj as ListRepositoriesParams;
  return (
    (params.type === undefined ||
      ['all', 'owner', 'public', 'private', 'member'].includes(params.type)) &&
    (params.sort === undefined ||
      ['created', 'updated', 'pushed', 'full_name'].includes(params.sort))
  );
}

export function isGetRepositoryParams(obj: unknown): obj is GetRepositoryParams {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'owner' in obj &&
    'repo' in obj &&
    typeof (obj as any).owner === 'string' &&
    typeof (obj as any).repo === 'string'
  );
}

export function isCreateReleaseParams(obj: unknown): obj is CreateReleaseParams {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'owner' in obj &&
    'repo' in obj &&
    'tag_name' in obj &&
    typeof (obj as any).owner === 'string' &&
    typeof (obj as any).repo === 'string' &&
    typeof (obj as any).tag_name === 'string'
  );
}

export function isListIssuesParams(obj: unknown): obj is ListIssuesParams {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'owner' in obj &&
    'repo' in obj &&
    typeof (obj as any).owner === 'string' &&
    typeof (obj as any).repo === 'string'
  );
}

export function isUpdateFileParams(obj: unknown): obj is UpdateFileParams {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'owner' in obj &&
    'repo' in obj &&
    'path' in obj &&
    'message' in obj &&
    'content' in obj &&
    typeof (obj as any).owner === 'string' &&
    typeof (obj as any).repo === 'string' &&
    typeof (obj as any).path === 'string' &&
    typeof (obj as any).message === 'string' &&
    typeof (obj as any).content === 'string'
  );
}

export function isCreateBranchParams(obj: unknown): obj is CreateBranchParams {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'owner' in obj &&
    'repo' in obj &&
    'branch' in obj &&
    'sha' in obj &&
    typeof (obj as any).owner === 'string' &&
    typeof (obj as any).repo === 'string' &&
    typeof (obj as any).branch === 'string' &&
    typeof (obj as any).sha === 'string'
  );
}

export function isDeleteBranchParams(obj: unknown): obj is DeleteBranchParams {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'owner' in obj &&
    'repo' in obj &&
    'branch' in obj &&
    typeof (obj as any).owner === 'string' &&
    typeof (obj as any).repo === 'string' &&
    typeof (obj as any).branch === 'string'
  );
}

export function isListBranchesParams(obj: unknown): obj is ListBranchesParams {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'owner' in obj &&
    'repo' in obj &&
    typeof (obj as any).owner === 'string' &&
    typeof (obj as any).repo === 'string'
  );
}

export function isMergePullRequestParams(obj: unknown): obj is MergePullRequestParams {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'owner' in obj &&
    'repo' in obj &&
    'pull_number' in obj &&
    typeof (obj as any).owner === 'string' &&
    typeof (obj as any).repo === 'string' &&
    typeof (obj as any).pull_number === 'number'
  );
}

export function isUpdatePullRequestParams(obj: unknown): obj is UpdatePullRequestParams {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'owner' in obj &&
    'repo' in obj &&
    'pull_number' in obj &&
    typeof (obj as any).owner === 'string' &&
    typeof (obj as any).repo === 'string' &&
    typeof (obj as any).pull_number === 'number'
  );
}

export function isListPullRequestsParams(obj: unknown): obj is ListPullRequestsParams {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'owner' in obj &&
    'repo' in obj &&
    typeof (obj as any).owner === 'string' &&
    typeof (obj as any).repo === 'string'
  );
}
