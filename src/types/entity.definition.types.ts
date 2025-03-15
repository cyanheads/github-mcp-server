/**
 * Entity Definition Types Module
 * ==============================
 *
 * This module defines the core entity types used throughout the application.
 * These represent the domain objects for the GitHub API integration.
 */

/**
 * Represents a GitHub repository entity
 */
export interface GitHubRepositoryEntity {
  /** Unique repository ID from GitHub */
  repositoryId: number;
  
  /** Repository name */
  repositoryName: string;
  
  /** Full repository name including owner (e.g., "owner/repo") */
  repositoryFullName: string;
  
  /** HTML URL of the repository */
  repositoryUrl: string;
  
  /** Whether the repository is private */
  isPrivate: boolean;
  
  /** Optional repository description */
  description?: string;
  
  /** ISO timestamp of when the repository was created */
  createdAt: string;
  
  /** ISO timestamp of when the repository was last updated */
  updatedAt: string;
}

/**
 * Represents a GitHub branch entity
 */
export interface GitHubBranchEntity {
  /** Branch name */
  name: string;
  
  /** Commit information for the branch head */
  commit: {
    sha: string;
    url: string;
  };
  
  /** Whether the branch is protected */
  protected: boolean;
}

/**
 * Represents a GitHub issue entity
 */
export interface GitHubIssueEntity {
  /** Issue number */
  number: number;
  
  /** Issue title */
  title: string;
  
  /** Issue body content */
  body?: string;
  
  /** Current state of the issue */
  state: 'open' | 'closed';
  
  /** Array of labels applied to the issue */
  labels: string[];
  
  /** ISO timestamp of when the issue was created */
  createdAt: string;
  
  /** ISO timestamp of when the issue was last updated */
  updatedAt: string;
}

/**
 * Represents a GitHub pull request entity
 */
export interface GitHubPullRequestEntity {
  /** Pull request number */
  number: number;
  
  /** Pull request title */
  title: string;
  
  /** Pull request description */
  body?: string;
  
  /** Current state of the pull request */
  state: 'open' | 'closed';
  
  /** Branch that contains the changes */
  head: string;
  
  /** Branch that the changes should be pulled into */
  base: string;
  
  /** Whether the pull request is mergeable */
  mergeable: boolean | null;
  
  /** ISO timestamp of when the pull request was created */
  createdAt: string;
  
  /** ISO timestamp of when the pull request was last updated */
  updatedAt: string;
}

/**
 * Represents a GitHub release entity
 */
export interface GitHubReleaseEntity {
  /** Release ID */
  id: number;
  
  /** Tag name for the release */
  tagName: string;
  
  /** Release name/title */
  name?: string;
  
  /** Release description */
  body?: string;
  
  /** Whether the release is a draft */
  draft: boolean;
  
  /** Whether the release is a prerelease */
  prerelease: boolean;
  
  /** ISO timestamp of when the release was created */
  createdAt: string;
  
  /** ISO timestamp of when the release was published */
  publishedAt: string | null;
}