/**
 * Get Repository Types Module
 * ==========================
 *
 * This module defines the types for the get repository operation.
 */

import { z } from 'zod';
import { getRepositorySchema } from '../../../../utilities/validation.utility.js';
import { GitHubRepositoryEntity } from '../../../../types/entity.definition.types.js';

/**
 * Request parameters for getting a repository
 */
export type GetRepositoryRequestType = z.infer<typeof getRepositorySchema>;

/**
 * Response object for the get repository operation
 */
export interface GetRepositoryResponseType {
  /** The repository data */
  repository: GitHubRepositoryEntity;
  
  /** ISO timestamp of the operation */
  requestTimestamp: string;
}