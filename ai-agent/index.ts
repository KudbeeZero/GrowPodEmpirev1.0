#!/usr/bin/env node

import { Agent } from './agent';

/**
 * Main entry point for AI Command Agent
 */
async function main() {
  const args = process.argv.slice(2);

  try {
    const agent = new Agent();
    await agent.initialize();

    // Check for command-line arguments
    if (args.length === 0) {
      // No arguments - start interactive mode
      await agent.interactive();
    } else if (args[0] === 'list') {
      // List available commands
      agent.listCommands();
    } else if (args[0] === '--help' || args[0] === '-h') {
      // Show help
      showHelp();
    } else {
      // Execute a single command
      const command = args.join(' ');
      const success = await agent.processCommand(command);
      process.exit(success ? 0 : 1);
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
AI Command Agent - Simulate and Execute Whitelisted Commands

Usage:
  ai-agent                    Start interactive mode
  ai-agent [command]          Execute a single command
  ai-agent list               List all available commands
  ai-agent --help, -h         Show this help message

Examples:
  ai-agent                                      # Interactive mode
  ai-agent npm run build                        # Execute npm build
  ai-agent update .env DATABASE_URL=postgres:// # Update .env file
  ai-agent list                                 # List commands

Features:
  • Command whitelisting for security
  • Simulation mode with diff preview
  • User confirmation for high-risk operations
  • Dynamic command configuration
  • Execution logs and error handling

Configuration:
  Edit ai-agent/command-whitelist.json to manage whitelisted commands.
  `);
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
