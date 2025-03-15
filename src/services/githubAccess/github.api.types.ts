/**
 * GitHub API Types Module
 * =======================
 *
 * This module defines TypeScript interfaces for GitHub API responses.
 * These types improve type safety when working with GitHub API data.
 */

/**
 * Common GitHub issue and PR state types
 */
export type GitHubStateType = 'open' | 'closed';

/**
 * GitHub API Repository Response
 */
export interface GitHubApiRepository {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  private: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * GitHub API Branch Response
 */
export interface GitHubApiBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

/**
 * GitHub API Issue Response
 */
export interface GitHubApiIssue {
  number: number;
  title: string;
  body: string | null;
  state: string; // Will be cast to GitHubStateType
  labels: Array<{
    name: string;
    color: string;
  }>;
  created_at: string;
  updated_at: string;
}

/**
 * GitHub API Pull Request Response
 */
export interface GitHubApiPullRequest {
  number: number;
  title: string;
  body: string | null;
  state: string; // Will be cast to GitHubStateType
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
  mergeable: boolean | null;
  created_at: string;
  updated_at: string;
}

/**
 * GitHub API Release Response
 */
export interface GitHubApiRelease {
  id: number;
  tag_name: string;
  name: string | null;
  body: string | null;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string | null;
}

/**
 * GitHub API File Content Response
 */
export interface GitHubApiFileContent {
  sha: string;
  content: string;
  encoding: string;
}

/**
 * GitHub API Commit Response
 */
export interface GitHubApiCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
}

/**
 * GitHub API File Update Response
 */
export interface GitHubApiFileUpdateResponse {
  content: GitHubApiFileContent;
  commit: GitHubApiCommit;
}

/**
 * GitHub API Pull Request Merge Response
 */
export interface GitHubApiPullRequestMerge {
  merged: boolean;
  message: string;
  sha?: string;
}