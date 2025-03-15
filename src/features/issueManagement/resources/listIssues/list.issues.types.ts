/**
 * List Issues Types Module
 * ======================
 *
 * This module defines the types for the list issues operation.
 */

import { z } from 'zod';
import { listIssuesSchema } from '../../../../utilities/validation.utility.js';
import { GitHubIssueEntity } from '../../../../types/entity.definition.types.js';

/**
 * Request parameters for listing issues
 */
export type ListIssuesRequestType = z.infer<typeof listIssuesSchema>;

/**
 * Response object for the list issues operation
 */
export interface ListIssuesResponseType {
  /** Array of issue entities */
  issues: GitHubIssueEntity[];
  
  /** Repository information */
  repository: {
    owner: string;
    name: string;
  };
  
  /** Pagination information */
  pagination: {
    /** Total count of issues matching the criteria */
    totalCount?: number;
    /** Link to the next page of results, if available */
    nextPage?: string;
    /** Link to the previous page of results, if available */
    prevPage?: string;
  };
  
  /** ISO timestamp of when the issues were retrieved */
  retrievalTimestamp: string;
}