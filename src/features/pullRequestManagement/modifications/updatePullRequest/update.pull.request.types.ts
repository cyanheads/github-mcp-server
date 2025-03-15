/**
 * Update Pull Request Types Module
 * =============================
 *
 * This module defines the types for the update pull request operation.
 */

import { z } from 'zod';
import { updatePullRequestSchema } from '../../../../utilities/validation.utility.js';
import { GitHubPullRequestEntity } from '../../../../types/entity.definition.types.js';

/**
 * Request parameters for updating a pull request
 */
export type UpdatePullRequestRequestType = z.infer<typeof updatePullRequestSchema>;

/**
 * Response object for the update pull request operation
 */
export interface UpdatePullRequestResponseType {
  /** The updated pull request data */
  pullRequest: GitHubPullRequestEntity;
  
  /** Repository information */
  repository: {
    owner: string;
    name: string;
  };
  
  /** The fields that were updated */
  updatedFields: string[];
  
  /** ISO timestamp of when the pull request was updated */
  updateTimestamp: string;
}