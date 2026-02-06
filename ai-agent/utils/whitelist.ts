import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { WhitelistConfig, CommandConfig, CommandMatch } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * CommandWhitelist - Manages whitelisted commands
 */
export class CommandWhitelist {
  private config: WhitelistConfig | null = null;
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || join(__dirname, '..', 'command-whitelist.json');
  }

  /**
   * Load the whitelist configuration
   */
  async load(): Promise<void> {
    try {
      const content = await readFile(this.configPath, 'utf-8');
      this.config = JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to load command whitelist: ${error}`);
    }
  }

  /**
   * Get the configuration
   */
  getConfig(): WhitelistConfig {
    if (!this.config) {
      throw new Error('Whitelist not loaded. Call load() first.');
    }
    return this.config;
  }

  /**
   * Check if a command is whitelisted
   */
  isWhitelisted(command: string): boolean {
    if (!this.config) {
      throw new Error('Whitelist not loaded. Call load() first.');
    }

    return this.config.commands.some((cmd) => {
      const regex = new RegExp(cmd.pattern, 'i');
      return regex.test(command.trim());
    });
  }

  /**
   * Match a command to its configuration
   */
  matchCommand(command: string): CommandMatch | null {
    if (!this.config) {
      throw new Error('Whitelist not loaded. Call load() first.');
    }

    const trimmedCommand = command.trim();

    for (const cmd of this.config.commands) {
      const regex = new RegExp(cmd.pattern, 'i');
      const match = regex.exec(trimmedCommand);

      if (match) {
        return {
          command: trimmedCommand,
          config: cmd,
          args: match.slice(1).filter(Boolean),
        };
      }
    }

    return null;
  }

  /**
   * Get all commands by category
   */
  getCommandsByCategory(category: string): CommandConfig[] {
    if (!this.config) {
      throw new Error('Whitelist not loaded. Call load() first.');
    }

    return this.config.commands.filter((cmd) => cmd.category === category);
  }

  /**
   * Get all commands by risk level
   */
  getCommandsByRiskLevel(riskLevel: 'low' | 'medium' | 'high'): CommandConfig[] {
    if (!this.config) {
      throw new Error('Whitelist not loaded. Call load() first.');
    }

    return this.config.commands.filter((cmd) => cmd.riskLevel === riskLevel);
  }

  /**
   * Add a new command dynamically (if enabled in settings)
   */
  addCommand(command: CommandConfig): void {
    if (!this.config) {
      throw new Error('Whitelist not loaded. Call load() first.');
    }

    if (!this.config.settings.allowDynamicCommandAddition) {
      throw new Error('Dynamic command addition is disabled in settings.');
    }

    // Check if command ID already exists
    if (this.config.commands.some((cmd) => cmd.id === command.id)) {
      throw new Error(`Command with ID '${command.id}' already exists.`);
    }

    this.config.commands.push(command);
  }

  /**
   * Remove a command
   */
  removeCommand(commandId: string): boolean {
    if (!this.config) {
      throw new Error('Whitelist not loaded. Call load() first.');
    }

    const index = this.config.commands.findIndex((cmd) => cmd.id === commandId);
    if (index >= 0) {
      this.config.commands.splice(index, 1);
      return true;
    }

    return false;
  }

  /**
   * Get all command categories
   */
  getCategories(): string[] {
    if (!this.config) {
      throw new Error('Whitelist not loaded. Call load() first.');
    }

    const categories = new Set<string>();
    this.config.commands.forEach((cmd) => categories.add(cmd.category));
    return Array.from(categories);
  }
}
