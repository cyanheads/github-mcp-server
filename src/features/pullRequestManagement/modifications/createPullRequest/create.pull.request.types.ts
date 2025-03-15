/**
 * Create Pull Request Types Module
 * ==============================
 *
 * This module defines the types for the create pull request operation.
 */

import { z } from 'zod';
import { createPullRequestSchema } from '../../../../utilities/validation.utility.js';
import { GitHubPullRequestEntity } from '../../../../types/entity.definition.types.js';

/**
 * Request parameters for creating a pull request
 */
export type CreatePullRequestRequestType = z.infer<typeof createPullRequestSchema>;

/**
 * Response object for the create pull request operation
 */
export interface CreatePullRequestResponseType {
  /** The newly created pull request data */
  pullRequest: GitHubPullRequestEntity;
  
  /** Repository information */
  repository: {
    owner: string;
    name: string;
  };
  
  /** ISO timestamp of when the pull request was created */
  creationTimestamp: string;
}