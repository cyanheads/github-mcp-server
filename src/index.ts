#!/usr/bin/env node
/**
 * GitHub MCP Server Entry Point
 * ===========================
 *
 * This is the main entry point file for the GitHub MCP server.
 * It re-exports the application entry module.
 */

// Import and re-export the application entry module
export * from './application.entry.js';

// In ES modules, we can use import.meta.url to determine if this file is being run directly
const isMainModule = import.meta.url.endsWith(process.argv[1]);

// If this file is executed directly, run the application
if (isMainModule) {
  // This file was executed directly, so we'll import and run the server
  import('./application.entry.js').catch(error => {
    console.error('Failed to start GitHub MCP server:', error);
    process.exit(1);
  });
}
