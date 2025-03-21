#!/usr/bin/env node
/**
 * Application Entry Module
 * ======================
 *
 * This is the main entry point for the GitHub MCP server application.
 * It initializes the MCP server, registers tools, and handles connections.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { getApplicationConfiguration } from './configuration/index.export.js';
import { StructuredLoggingUtility } from './utilities/structured.logging.utility.js';
import { ApplicationErrorHandlingUtility } from './utilities/error.handling.utility.js';
import { ToolRegistry } from './dependencyInjection/tool.registry.js';

/**
 * Main GitHub MCP Server class that handles initialization and request processing
 */
class GitHubServer {
  private server: Server;
  private toolRegistry: ToolRegistry;

  /**
   * Initialize the GitHub MCP Server
   */
  constructor() {
    const config = getApplicationConfiguration();
    
    this.server = new Server(
      {
        name: config.serverName,
        version: config.serverVersion,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    this.toolRegistry = new ToolRegistry();
    
    this.setupRequestHandlers();
    
    // Error handling
    this.server.onerror = (error) => {
      StructuredLoggingUtility.recordErrorEntry('[MCP Error]', { error });
    };
    
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
    
    StructuredLoggingUtility.recordInfoEntry('GitHub MCP server initialized');
  }

  /**
   * Set up MCP request handlers for tool listing and execution
   */
  private setupRequestHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      StructuredLoggingUtility.recordDebugEntry('Listing available tools');
      return {
        tools: this.toolRegistry.getToolDefinitions(),
      };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        StructuredLoggingUtility.recordDebugEntry('Tool execution requested', {
          toolName: request.params.name,
        });
        
        // Find and execute the requested tool
        const tool = this.toolRegistry.findTool(request.params.name);
        
        if (!tool) {
          StructuredLoggingUtility.recordErrorEntry('Unknown tool requested', {
            toolName: request.params.name,
          });
          
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
        }
        
        // Execute the tool and return the result
        const result = await tool.execute(request.params.arguments);
        
        StructuredLoggingUtility.recordDebugEntry('Tool execution completed', {
          toolName: request.params.name,
          success: true,
        });
        
        return result;
      } catch (error) {
        // Handle MCP errors directly
        if (error instanceof McpError) throw error;

        // Get error details
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorCategory = this.determineErrorCategory(error, request.params.name);
        
        StructuredLoggingUtility.recordErrorEntry('Tool execution failed', {
          toolName: request.params.name,
          error: errorMessage
        });
        
        // Create appropriate error message based on category
        const errorText = errorMessage.length > 200 ? errorMessage.substring(0, 200) + '...' : errorMessage;
        throw new McpError(
          ErrorCode.InternalError,
          `${errorCategory} error: ${errorText}`
        );
      }
    });
  }

  /**
   * Determine the appropriate error category based on the error
   * 
   * @param error - The error that occurred
   * @param toolName - The name of the tool that was being executed
   * @returns Appropriate error category string
   */
  private determineErrorCategory(error: unknown, toolName: string): string {
    // Check for specific error types
    if (error instanceof Error) {
      // Network or connection errors
      if (error.message.includes('network') || 
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('timeout')) {
        return 'Network';
      }
      
      // Authentication or authorization errors
      if (error.message.includes('authentication') ||
          error.message.includes('authorization') ||
          error.message.includes('401') || 
          error.message.includes('403')) {
        return 'Authentication';
      }
      
      // Validation errors
      if (error.message.includes('validation') ||
          error.message.includes('invalid') ||
          error.message.includes('required')) {
        return 'Validation';
      }
      
      // Known GitHub API errors
      if (error.message.includes('GitHub') ||
          error.message.includes('API')) {
        return 'GitHub API';
      }
    }
    
    // Default to system error if can't determine category
    return 'System';
  }

  /**
   * Run the MCP server using stdio transport
   */
  async run() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      StructuredLoggingUtility.recordInfoEntry('GitHub MCP server running on stdio');
    } catch (error) {
      StructuredLoggingUtility.recordFatalEntry('Failed to start MCP server', {
        error: error instanceof Error ? error.message : String(error),
      });
      process.exit(1);
    }
  }
}

// Create and run the server
const server = new GitHubServer();
server.run().catch((error) => {
  StructuredLoggingUtility.recordFatalEntry('Unhandled server error', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});