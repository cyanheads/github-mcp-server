/**
 * List Repositories Types Module
 * ============================
 *
 * This module defines the types for the list repositories operation.
 */

import { z } from 'zod';
import { listRepositoriesSchema } from '../../../../utilities/validation.utility.js';
import { GitHubRepositoryEntity } from '../../../../types/entity.definition.types.js';

/**
 * Request parameters for listing repositories
 */
export type ListRepositoriesRequestType = z.infer<typeof listRepositoriesSchema>;

/**
 * Response object for the list repositories operation
 */
export interface ListRepositoriesResponseType {
  /** The array of repositories */
  repositories: GitHubRepositoryEntity[];
  
  /** Pagination information */
  pagination: {
    /** Total count of repositories returned */
    count: number;
  };
  
  /** ISO timestamp of the operation */
  requestTimestamp: string;
}