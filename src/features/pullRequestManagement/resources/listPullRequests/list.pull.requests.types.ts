/**
 * List Pull Requests Types Module
 * ============================
 *
 * This module defines the types for the list pull requests operation.
 */

import { z } from 'zod';
import { listPullRequestsSchema } from '../../../../utilities/validation.utility.js';
import { GitHubPullRequestEntity } from '../../../../types/entity.definition.types.js';

/**
 * Request parameters for listing pull requests
 */
export type ListPullRequestsRequestType = z.infer<typeof listPullRequestsSchema>;

/**
 * Response object for the list pull requests operation
 */
export interface ListPullRequestsResponseType {
  /** Array of pull request entities */
  pullRequests: GitHubPullRequestEntity[];
  
  /** Repository information */
  repository: {
    owner: string;
    name: string;
  };
  
  /** Filter information */
  filters: {
    state?: 'open' | 'closed' | 'all';
    head?: string;
    base?: string;
  };
  
  /** Pagination information */
  pagination: {
    /** Total count of pull requests matching the criteria */
    totalCount?: number;
    /** Link to the next page of results, if available */
    nextPage?: string;
    /** Link to the previous page of results, if available */
    prevPage?: string;
  };
  
  /** ISO timestamp of when the pull requests were retrieved */
  retrievalTimestamp: string;
}