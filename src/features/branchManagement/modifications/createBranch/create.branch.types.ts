/**
 * Create Branch Types Module
 * ========================
 *
 * This module defines the types for the create branch operation.
 */

import { z } from 'zod';
import { createBranchSchema } from '../../../../utilities/validation.utility.js';
import { GitHubBranchEntity } from '../../../../types/entity.definition.types.js';

/**
 * Request parameters for creating a branch
 */
export type CreateBranchRequestType = z.infer<typeof createBranchSchema>;

/**
 * Response object for the create branch operation
 */
export interface CreateBranchResponseType {
  /** The newly created branch data */
  branch: GitHubBranchEntity;
  
  /** Repository information */
  repository: {
    owner: string;
    name: string;
  };
  
  /** ISO timestamp of when the branch was created */
  creationTimestamp: string;
}