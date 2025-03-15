/**
 * Delete Branch Types Module
 * ========================
 *
 * This module defines the types for the delete branch operation.
 */

import { z } from 'zod';
import { deleteBranchSchema } from '../../../../utilities/validation.utility.js';

/**
 * Request parameters for deleting a branch
 */
export type DeleteBranchRequestType = z.infer<typeof deleteBranchSchema>;

/**
 * Response object for the delete branch operation
 */
export interface DeleteBranchResponseType {
  /** Status of the deletion operation */
  success: boolean;
  
  /** Repository information */
  repository: {
    owner: string;
    name: string;
  };
  
  /** Name of the branch that was deleted */
  branchName: string;
  
  /** ISO timestamp of when the branch was deleted */
  deletionTimestamp: string;
}