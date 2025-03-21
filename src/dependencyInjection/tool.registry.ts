/**
 * Tool Registry Module
 * ==================
 *
 * This module provides the registry for MCP tools.
 * It manages tool registration, lookup, and execution.
 */

import { z } from 'zod';
import { OperationResult } from '../types/operation.result.types.js';
import { ApplicationErrorHandlingUtility } from '../utilities/error.handling.utility.js';
import { StructuredLoggingUtility } from '../utilities/structured.logging.utility.js';
import { validateOperationInput } from '../utilities/validation.utility.js';

// Import validation schemas
import {
  createBranchSchema,
  createIssueSchema,
  createPullRequestSchema,
  createReleaseSchema,
  createRepositorySchema,
  deleteBranchSchema,
  getRepositorySchema,
  listBranchesSchema,
  listIssuesSchema,
  listPullRequestsSchema,
  listRepositoriesSchema,
  mergePullRequestSchema,
  updateFileSchema,
  updatePullRequestSchema
} from '../utilities/validation.utility.js';

// Repository Management
import {
  createNewRepository,
  getRepositoryByOwnerAndName,
  listAuthenticatedUserRepositories,
} from '../features/repositoryManagement/index.export.js';

// Branch Management
import {
  createRepositoryBranch,
  deleteRepositoryBranch,
  listRepositoryBranches
} from '../features/branchManagement/index.export.js';

// Issue Management
import {
  createRepositoryIssue,
  listRepositoryIssues
} from '../features/issueManagement/index.export.js';

// Pull Request Management
import {
  createRepositoryPullRequest,
  listRepositoryPullRequests,
  mergeRepositoryPullRequest,
  updateRepositoryPullRequest
} from '../features/pullRequestManagement/index.export.js';

// File Management
import {
  updateRepositoryFile
} from '../features/fileManagement/index.export.js';

// Release Management
import {
  createRepositoryRelease
} from '../features/releaseManagement/index.export.js';

/**
 * Represents a tool that can be executed by the MCP server
 */
export class Tool {
  /**
   * Create a new tool
   * 
   * @param name - Unique name of the tool
   * @param description - Human-readable description
   * @param inputSchema - JSON Schema for the tool's input parameters
   * @param operationFunction - Function that implements the tool's behavior
   * @param validationSchema - Optional Zod schema for input validation
   */
  constructor(
    public name: string,
    public description: string,
    public inputSchema: any,
    private operationFunction: (params: any) => Promise<OperationResult<any>>,
    private validationSchema?: z.ZodType<any>
  ) {}

  /**
   * Execute the tool with the provided arguments
   * 
   * @param args - Tool arguments
   * @returns Tool execution result
   */
  async execute(args: unknown): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
    try {
      StructuredLoggingUtility.recordDebugEntry(`Executing tool ${this.name}`, { args });
      
      // Validate input if schema provided
      let validatedArgs = args;
      if (this.validationSchema) {
        const validationResult = validateOperationInput(this.validationSchema, args);
        if (!validationResult.resultSuccessful) {
          // Format the validation error in MCP-compatible format
          let errorMessage = 'Input validation failed';
          
          if (validationResult.resultError?.errorContext?.validationErrors) {
            const errors = validationResult.resultError.errorContext.validationErrors;
            errorMessage = Array.isArray(errors) 
              ? errors.map(e => `${e.path}: ${e.message}`).join(', ')
              : 'Validation error';
          }
          
          return {
            content: [{ 
              type: 'text', 
              text: errorMessage
            }], 
            isError: true
          };
        }
        validatedArgs = validationResult.resultData;
      }
      
      // Execute the operation
      const result = await this.operationFunction(validatedArgs);
      
      // Return the result
      if (result.resultSuccessful) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result.resultData, null, 2) }]
        };
      } else {
        return {
          content: [{ type: 'text', text: JSON.stringify(result.resultError, null, 2) }],
          isError: true
        };
      }
    } catch (error) {
      StructuredLoggingUtility.recordErrorEntry(`Tool ${this.name} execution failed`, {
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Create a simpler error message for MCP compatibility
      const errorMessage = error instanceof Error 
        ? error.message 
        : `Tool ${this.name} execution failed: ${String(error)}`;
      
      return {
        content: [{ type: 'text', text: errorMessage }],
        isError: true
      };
    }
  }
}

/**
 * Registry for all MCP tools
 */
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  constructor() {
    this.registerAllTools();
  }

  /**
   * Register all available tools
   */
  private registerAllTools() {
    // Repository Management - Resources
    this.registerTool(
      'get_repository',
      'Get repository information',
      {
        type: 'object',
        properties: {
          owner: {
            type: 'string',
            description: 'Repository owner',
          },
          repo: {
            type: 'string',
            description: 'Repository name',
          },
        },
        required: ['owner', 'repo'],
      },
      getRepositoryByOwnerAndName,
      getRepositorySchema
    );
    
    this.registerTool(
      'list_repositories',
      'List repositories for the authenticated user',
      {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['all', 'owner', 'public', 'private', 'member'],
            description: 'Type of repositories to list',
            default: 'all',
          },
          sort: {
            type: 'string',
            enum: ['created', 'updated', 'pushed', 'full_name'],
            description: 'How to sort the repositories',
            default: 'full_name',
          },
        },
      },
      listAuthenticatedUserRepositories,
      listRepositoriesSchema
    );

    // Branch Management - Resources
    this.registerTool(
      'list_branches',
      'List branches in a repository',
      {
        type: 'object',
        properties: {
          owner: {
            type: 'string',
            description: 'Repository owner',
          },
          repo: {
            type: 'string',
            description: 'Repository name',
          },
          protected: {
            type: 'boolean',
            description: 'Filter by protected branches',
          },
          per_page: {
            type: 'number',
            description: 'Results per page',
            default: 30,
          },
        },
        required: ['owner', 'repo'],
      },
      listRepositoryBranches,
      listBranchesSchema
    );

    // Branch Management - Modifications
    this.registerTool(
      'create_branch',
      'Create a new branch',
      {
        type: 'object',
        properties: {
          owner: {
            type: 'string',
            description: 'Repository owner',
          },
          repo: {
            type: 'string',
            description: 'Repository name',
          },
          branch: {
            type: 'string',
            description: 'New branch name',
          },
          sha: {
            type: 'string',
            description: 'SHA of the commit to branch from',
          },
        },
        required: ['owner', 'repo', 'branch', 'sha'],
      },
      createRepositoryBranch,
      createBranchSchema
    );

    this.registerTool(
      'delete_branch',
      'Delete a branch',
      {
        type: 'object',
        properties: {
          owner: {
            type: 'string',
            description: 'Repository owner',
          },
          repo: {
            type: 'string',
            description: 'Repository name',
          },
          branch: {
            type: 'string',
            description: 'Branch name to delete',
          },
        },
        required: ['owner', 'repo', 'branch'],
      },
      deleteRepositoryBranch,
      deleteBranchSchema
    );

    // Repository Management - Modifications
    this.registerTool(
      'create_repository',
      'Create a new GitHub repository',
      {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Repository name',
          },
          description: {
            type: 'string',
            description: 'Repository description',
          },
          private: {
            type: 'boolean',
            description: 'Whether the repository should be private',
            default: false,
          },
        },
        required: ['name'],
      },
      createNewRepository,
      createRepositorySchema
    );

    // Issue Management - Modifications
    this.registerTool(
      'create_issue',
      'Create a new issue in a repository',
      {
        type: 'object',
        properties: {
          owner: {
            type: 'string',
            description: 'Repository owner',
          },
          repo: {
            type: 'string',
            description: 'Repository name',
          },
          title: {
            type: 'string',
            description: 'Issue title',
          },
          body: {
            type: 'string',
            description: 'Optional issue body',
          },
          labels: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Optional array of label names',
          },
        },
        required: ['owner', 'repo', 'title'],
      },
      createRepositoryIssue,
      createIssueSchema
    );

    // Issue Management - Resources
    this.registerTool(
      'list_issues',
      'List issues in a repository',
      {
        type: 'object',
        properties: {
          owner: {
            type: 'string',
            description: 'Repository owner',
          },
          repo: {
            type: 'string',
            description: 'Repository name',
          },
          state: {
            type: 'string',
            enum: ['open', 'closed', 'all'],
            description: 'State of issues to return',
            default: 'open',
          },
          labels: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Label names to filter by',
          },
        },
        required: ['owner', 'repo'],
      },
      listRepositoryIssues,
      listIssuesSchema
    );

    // Pull Request Management - Modifications
    this.registerTool(
      'create_pull_request',
      'Create a new pull request',
      {
        type: 'object',
        properties: {
          owner: {
            type: 'string',
            description: 'Repository owner',
          },
          repo: {
            type: 'string',
            description: 'Repository name',
          },
          title: {
            type: 'string',
            description: 'Pull request title',
          },
          head: {
            type: 'string',
            description: 'The name of the branch where changes are implemented',
          },
          base: {
            type: 'string',
            description: 'The name of the branch you want the changes pulled into',
          },
          body: {
            type: 'string',
            description: 'Optional pull request description',
          },
        },
        required: ['owner', 'repo', 'title', 'head', 'base'],
      },
      createRepositoryPullRequest,
      createPullRequestSchema
    );

    this.registerTool(
      'merge_pull_request',
      'Merge a pull request',
      {
        type: 'object',
        properties: {
          owner: {
            type: 'string',
            description: 'Repository owner',
          },
          repo: {
            type: 'string',
            description: 'Repository name',
          },
          pull_number: {
            type: 'number',
            description: 'Pull request number',
          },
          commit_title: {
            type: 'string',
            description: 'Optional title for the merge commit',
          },
          commit_message: {
            type: 'string',
            description: 'Optional extra detail to append to merge commit message',
          },
          merge_method: {
            type: 'string',
            enum: ['merge', 'squash', 'rebase'],
            description: 'Optional merge method to use',
            default: 'merge',
          },
        },
        required: ['owner', 'repo', 'pull_number'],
      },
      mergeRepositoryPullRequest,
      mergePullRequestSchema
    );

    this.registerTool(
      'update_pull_request',
      'Update an existing pull request',
      {
        type: 'object',
        properties: {
          owner: {
            type: 'string',
            description: 'Repository owner',
          },
          repo: {
            type: 'string',
            description: 'Repository name',
          },
          pull_number: {
            type: 'number',
            description: 'Pull request number',
          },
          title: {
            type: 'string',
            description: 'Optional new title for the pull request',
          },
          body: {
            type: 'string',
            description: 'Optional new body for the pull request',
          },
          state: {
            type: 'string',
            enum: ['open', 'closed'],
            description: 'Optional new state of the pull request',
          },
          base: {
            type: 'string',
            description: 'Optional new name of the base branch to merge into',
          },
          maintainer_can_modify: {
            type: 'boolean',
            description: 'Optional flag to allow maintainers to modify the pull request',
          },
        },
        required: ['owner', 'repo', 'pull_number'],
      },
      updateRepositoryPullRequest,
      updatePullRequestSchema
    );

    // Pull Request Management - Resources
    this.registerTool(
      'list_pull_requests',
      'List pull requests in a repository',
      {
        type: 'object',
        properties: {
          owner: {
            type: 'string',
            description: 'Repository owner',
          },
          repo: {
            type: 'string',
            description: 'Repository name',
          },
          state: {
            type: 'string',
            enum: ['open', 'closed', 'all'],
            description: 'Optional state of pull requests to return',
            default: 'open',
          },
          head: {
            type: 'string',
            description: 'Optional filter by head user or branch name',
          },
          base: {
            type: 'string',
            description: 'Optional filter by base branch name',
          },
          sort: {
            type: 'string',
            enum: ['created', 'updated', 'popularity', 'long-running'],
            description: 'Optional sorting criteria',
            default: 'created',
          },
          direction: {
            type: 'string',
            enum: ['asc', 'desc'],
            description: 'Optional sort direction',
            default: 'desc',
          },
        },
        required: ['owner', 'repo'],
      },
      listRepositoryPullRequests,
      listPullRequestsSchema
    );

    // File Management - Modifications
    this.registerTool(
      'update_file',
      'Create or update a file in a repository',
      {
        type: 'object',
        properties: {
          owner: {
            type: 'string',
            description: 'Repository owner',
          },
          repo: {
            type: 'string',
            description: 'Repository name',
          },
          path: {
            type: 'string',
            description: 'Path to the file',
          },
          message: {
            type: 'string',
            description: 'Commit message',
          },
          content: {
            type: 'string',
            description: 'File content (Base64 encoded for binary files)',
          },
          sha: {
            type: 'string',
            description: 'Optional SHA of the file being replaced (required for updating existing files)',
          },
          branch: {
            type: 'string',
            description: 'Optional branch name',
          },
        },
        required: ['owner', 'repo', 'path', 'message', 'content'],
      },
      updateRepositoryFile,
      updateFileSchema
    );

    // Release Management - Modifications
    this.registerTool(
      'create_release',
      'Create a new release',
      {
        type: 'object',
        properties: {
          owner: {
            type: 'string',
            description: 'Repository owner',
          },
          repo: {
            type: 'string',
            description: 'Repository name',
          },
          tag_name: {
            type: 'string',
            description: 'Tag name for the release',
          },
          name: {
            type: 'string',
            description: 'Optional release title',
          },
          body: {
            type: 'string',
            description: 'Optional release description',
          },
          draft: {
            type: 'boolean',
            description: 'Optional flag to create a draft release',
            default: false,
          },
          prerelease: {
            type: 'boolean',
            description: 'Optional flag to identify as a prerelease',
            default: false,
          },
        },
        required: ['owner', 'repo', 'tag_name'],
      },
      createRepositoryRelease,
      createReleaseSchema
    );
    
    StructuredLoggingUtility.recordInfoEntry('All tools registered', { 
      count: this.tools.size,
      toolNames: Array.from(this.tools.keys())
    });
  }

  /**
   * Register a new tool
   * 
   * @param name - Unique name of the tool
   * @param description - Human-readable description
   * @param inputSchema - JSON Schema for the tool's input parameters
   * @param operationFunction - Function that implements the tool's behavior
   * @param validationSchema - Optional Zod schema for input validation
   */
  registerTool(
    name: string,
    description: string,
    inputSchema: any,
    operationFunction: (params: any) => Promise<OperationResult<any>>,
    validationSchema?: z.ZodType<any>
  ): void {
    const tool = new Tool(name, description, inputSchema, operationFunction, validationSchema);
    this.tools.set(name, tool);
    StructuredLoggingUtility.recordDebugEntry(`Tool ${name} registered`);
  }

  /**
   * Find a tool by name
   * 
   * @param name - Name of the tool to find
   * @returns The found tool or undefined
   */
  findTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all tool definitions
   * 
   * @returns Array of tool definitions
   */
  getToolDefinitions(): Array<{ name: string; description: string; inputSchema: any }> {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }));
  }
}