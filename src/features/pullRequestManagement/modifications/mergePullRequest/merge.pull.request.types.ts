/**
 * Merge Pull Request Types Module
 * ============================
 *
 * This module defines the types for the merge pull request operation.
 */

import { z } from 'zod';
import { mergePullRequestSchema } from '../../../../utilities/validation.utility.js';

/**
 * Request parameters for merging a pull request
 */
export type MergePullRequestRequestType = z.infer<typeof mergePullRequestSchema>;

/**
 * Response object for the merge pull request operation
 */
export interface MergePullRequestResponseType {
  /** Information about the merge result */
  mergeResult: {
    /** SHA of the merge commit */
    sha: string;
    /** Whether the merge was successful */
    merged: boolean;
    /** Merge message */
    message?: string;
  };
  
  /** Repository information */
  repository: {
    owner: string;
    name: string;
  };
  
  /** Pull request number that was merged */
  pullRequestNumber: number;
  
  /** ISO timestamp of when the pull request was merged */
  mergeTimestamp: string;
}