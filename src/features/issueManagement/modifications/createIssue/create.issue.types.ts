/**
 * Create Issue Types Module
 * =======================
 *
 * This module defines the types for the create issue operation.
 */

import { z } from 'zod';
import { createIssueSchema } from '../../../../utilities/validation.utility.js';
import { GitHubIssueEntity } from '../../../../types/entity.definition.types.js';

/**
 * Request parameters for creating an issue
 */
export type CreateIssueRequestType = z.infer<typeof createIssueSchema>;

/**
 * Response object for the create issue operation
 */
export interface CreateIssueResponseType {
  /** The newly created issue data */
  issue: GitHubIssueEntity;
  
  /** Repository information */
  repository: {
    owner: string;
    name: string;
  };
  
  /** ISO timestamp of when the issue was created */
  creationTimestamp: string;
}