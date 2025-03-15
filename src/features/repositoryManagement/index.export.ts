/**
 * Repository Management Feature Module Exports
 * ==========================================
 *
 * This module exports all repository management operations and types.
 * It serves as the main entry point for the repository management feature.
 */

// Resources (Read Operations)
export { getRepositoryByOwnerAndName } from './resources/getRepository/index.export.js';
export type { GetRepositoryRequestType, GetRepositoryResponseType } from './resources/getRepository/index.export.js';
export { listAuthenticatedUserRepositories } from './resources/listRepositories/index.export.js';
export type { ListRepositoriesRequestType, ListRepositoriesResponseType } from './resources/listRepositories/index.export.js';

// Modifications (Write Operations)
export { createNewRepository } from './modifications/createRepository/index.export.js';
export type { CreateRepositoryRequestType, CreateRepositoryResponseType } from './modifications/createRepository/index.export.js';