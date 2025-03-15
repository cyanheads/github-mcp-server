/**
 * Create Repository Types Module
 * =============================
 *
 * This module defines the types for the create repository operation.
 */

import { z } from 'zod';
import { createRepositorySchema } from '../../../../utilities/validation.utility.js';
import { GitHubRepositoryEntity } from '../../../../types/entity.definition.types.js';

/**
 * Request parameters for creating a repository
 */
export type CreateRepositoryRequestType = z.infer<typeof createRepositorySchema>;

/**
 * Response object for the create repository operation
 */
export interface CreateRepositoryResponseType {
  /** The newly created repository data */
  repository: GitHubRepositoryEntity;
  
  /** ISO timestamp of when the repository was created */
  creationTimestamp: string;
}