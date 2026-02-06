import { writeFile } from 'fs/promises';
import type { ExecutionResult, CommandConfig, AgentContext } from '../types.js';
import { executeCommand, Logger } from '../utils/helpers.js';

const logger = new Logger('Executor');

/**
 * Command executor - executes whitelisted commands
 */
export class Executor {
  /**
   * Execute a command
   */
  async execute(
    command: string,
    config: CommandConfig,
    context: AgentContext
  ): Promise<ExecutionResult> {
    logger.info(`Executing command: ${command}`);
    const startTime = Date.now();

    try {
      // Handle special commands that need custom execution
      if (config.id === 'update-env-file') {
        return await this.executeEnvUpdate(command, config, context, startTime);
      }

      // Execute standard shell commands
      const result = await executeCommand(command, {
        cwd: context.workingDirectory,
        timeout: 300000, // 5 minutes
        env: context.environment,
      });

      const duration = Date.now() - startTime;

      if (result.exitCode === 0) {
        logger.success(`Command completed successfully in ${duration}ms`);
      } else {
        logger.error(`Command failed with exit code ${result.exitCode}`);
      }

      return {
        command,
        commandId: config.id,
        success: result.exitCode === 0,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Execution failed', error as Error);

      return {
        command,
        commandId: config.id,
        success: false,
        error: (error as Error).message,
        duration,
      };
    }
  }

  /**
   * Execute environment file update
   */
  private async executeEnvUpdate(
    command: string,
    config: CommandConfig,
    context: AgentContext,
    startTime: number
  ): Promise<ExecutionResult> {
    try {
      // Parse the command
      const match = command.match(/update\s+(\.env[.\w]*)\s+(\w+)=(.*)/i);
      if (!match) {
        throw new Error('Invalid command format');
      }

      const [, envFile, key, value] = match;
      const filePath = `${context.workingDirectory}/${envFile}`;

      // Read existing content or create new
      let content = '';
      try {
        const { readFile } = await import('fs/promises');
        content = await readFile(filePath, 'utf-8');
      } catch {
        logger.info(`Creating new file: ${envFile}`);
      }

      // Update or add the key-value pair
      const lines = content.split('\n');
      let updated = false;
      const newLines: string[] = [];

      for (const line of lines) {
        if (line.startsWith(`${key}=`)) {
          newLines.push(`${key}=${value}`);
          updated = true;
        } else {
          newLines.push(line);
        }
      }

      if (!updated) {
        newLines.push(`${key}=${value}`);
      }

      // Write the file
      await writeFile(filePath, newLines.join('\n'), 'utf-8');

      const duration = Date.now() - startTime;
      logger.success(`Updated ${envFile} successfully`);

      return {
        command,
        commandId: config.id,
        success: true,
        exitCode: 0,
        stdout: `Successfully updated ${key} in ${envFile}`,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to update env file', error as Error);

      return {
        command,
        commandId: config.id,
        success: false,
        error: (error as Error).message,
        duration,
      };
    }
  }
}
