/**
 * Create Release Types Module
 * ========================
 *
 * This module defines the types for the create release operation.
 */

import { z } from 'zod';
import { createReleaseSchema } from '../../../../utilities/validation.utility.js';
import { GitHubReleaseEntity } from '../../../../types/entity.definition.types.js';

/**
 * Request parameters for creating a release
 */
export type CreateReleaseRequestType = z.infer<typeof createReleaseSchema>;

/**
 * Response object for the create release operation
 */
export interface CreateReleaseResponseType {
  /** The newly created release data */
  release: GitHubReleaseEntity;
  
  /** Repository information */
  repository: {
    owner: string;
    name: string;
  };
  
  /** ISO timestamp of when the release was created */
  creationTimestamp: string;
}