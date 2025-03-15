/**
 * Update File Types Module
 * =======================
 *
 * This module defines the types for the update file operation.
 */

import { z } from 'zod';
import { updateFileSchema } from '../../../../utilities/validation.utility.js';
import { ErrorCategoryType } from '../../../../types/error.definition.types.js';

/**
 * Request parameters for updating a file
 */
export type UpdateFileRequestType = z.infer<typeof updateFileSchema>;

/**
 * Response object for the update file operation
 */
export interface UpdateFileResponseType {
  /** Information about the commit that was created */
  commit: {
    /** SHA of the commit */
    sha: string;
    /** URL to the commit on GitHub */
    url: string;
    /** Commit message */
    message: string;
  };
  
  /** Repository information */
  repository: {
    owner: string;
    name: string;
  };
  
  /** Path of the file that was updated */
  filePath: string;
  
  /** ISO timestamp of when the file was updated */
  updateTimestamp: string;
}