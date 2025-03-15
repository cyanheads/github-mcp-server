/**
 * List Branches Types Module
 * ========================
 *
 * This module defines the types for the list branches operation.
 */

import { z } from 'zod';
import { listBranchesSchema } from '../../../../utilities/validation.utility.js';
import { GitHubBranchEntity } from '../../../../types/entity.definition.types.js';

/**
 * Request parameters for listing branches
 */
export type ListBranchesRequestType = z.infer<typeof listBranchesSchema>;

/**
 * Response object for the list branches operation
 */
export interface ListBranchesResponseType {
  /** The array of branches */
  branches: GitHubBranchEntity[];
  
  /** Repository information */
  repository: {
    owner: string;
    name: string;
  };
  
  /** Pagination information */
  pagination: {
    /** Total count of branches returned */
    count: number;
  };
  
  /** ISO timestamp of the operation */
  requestTimestamp: string;
}