import { readFile, access } from 'fs/promises';
import { constants } from 'fs';
import type { SimulationResult, CommandConfig, AgentContext, FileDiff } from '../types.js';
import { Logger } from '../utils/helpers.js';

const logger = new Logger('FileSimulator');

/**
 * Simulate file operations and generate diffs
 */
export class FileSimulator {
  /**
   * Simulate updating an environment file
   */
  async simulateEnvUpdate(
    command: string,
    config: CommandConfig,
    context: AgentContext
  ): Promise<SimulationResult> {
    const startTime = Date.now();

    try {
      // Parse the command: update .env KEY=VALUE
      const match = command.match(/update\s+(\.env[.\w]*)\s+(\w+)=(.*)/i);
      if (!match) {
        return {
          command,
          commandId: config.id,
          simulationType: 'file-diff',
          success: false,
          errors: ['Invalid command format. Expected: update .env KEY=VALUE'],
        };
      }

      const [, envFile, key, value] = match;
      const filePath = `${context.workingDirectory}/${envFile}`;

      let before = '';
      let fileExists = false;

      // Check if file exists
      try {
        await access(filePath, constants.F_OK);
        before = await readFile(filePath, 'utf-8');
        fileExists = true;
      } catch {
        // File doesn't exist, will be created
        logger.info(`File ${envFile} does not exist, will be created`);
      }

      // Generate the after content
      const lines = before.split('\n');
      let updated = false;
      const afterLines: string[] = [];

      for (const line of lines) {
        if (line.startsWith(`${key}=`)) {
          afterLines.push(`${key}=${value}`);
          updated = true;
        } else {
          afterLines.push(line);
        }
      }

      // If key wasn't found, add it
      if (!updated) {
        afterLines.push(`${key}=${value}`);
      }

      const after = afterLines.join('\n');

      // Generate diff
      const diff = this.generateDiff(before, after);

      return {
        command,
        commandId: config.id,
        simulationType: 'file-diff',
        success: true,
        diff: [
          {
            file: envFile,
            operation: fileExists ? 'update' : 'create',
            before,
            after,
            diff,
          },
        ],
        estimatedDuration: Date.now() - startTime,
      };
    } catch (error) {
      logger.error('Failed to simulate env update', error as Error);
      return {
        command,
        commandId: config.id,
        simulationType: 'file-diff',
        success: false,
        errors: [(error as Error).message],
      };
    }
  }

  /**
   * Generate a unified diff between two strings
   */
  private generateDiff(before: string, after: string): string {
    const beforeLines = before.split('\n');
    const afterLines = after.split('\n');

    const diff: string[] = [];
    diff.push('--- before');
    diff.push('+++ after');

    let lineNum = 0;
    let changes = 0;

    for (let i = 0; i < Math.max(beforeLines.length, afterLines.length); i++) {
      const beforeLine = beforeLines[i];
      const afterLine = afterLines[i];

      if (beforeLine === afterLine) {
        if (changes > 0) {
          diff.push(`  ${beforeLine || ''}`);
        }
      } else {
        if (changes === 0) {
          diff.push(`@@ -${i + 1},${beforeLines.length - i} +${i + 1},${afterLines.length - i} @@`);
        }
        if (beforeLine !== undefined) {
          diff.push(`- ${beforeLine}`);
        }
        if (afterLine !== undefined) {
          diff.push(`+ ${afterLine}`);
        }
        changes++;
      }
    }

    return diff.join('\n');
  }

  /**
   * Simulate file creation
   */
  async simulateFileCreate(
    filePath: string,
    content: string,
    context: AgentContext
  ): Promise<FileDiff> {
    const fullPath = `${context.workingDirectory}/${filePath}`;

    return {
      file: filePath,
      operation: 'create',
      after: content,
      diff: `--- /dev/null\n+++ ${filePath}\n${content
        .split('\n')
        .map((line) => `+ ${line}`)
        .join('\n')}`,
    };
  }

  /**
   * Simulate file deletion
   */
  async simulateFileDelete(filePath: string, context: AgentContext): Promise<FileDiff> {
    const fullPath = `${context.workingDirectory}/${filePath}`;

    let before = '';
    try {
      before = await readFile(fullPath, 'utf-8');
    } catch {
      logger.warn(`File ${filePath} does not exist`);
    }

    return {
      file: filePath,
      operation: 'delete',
      before,
      diff: `--- ${filePath}\n+++ /dev/null\n${before
        .split('\n')
        .map((line) => `- ${line}`)
        .join('\n')}`,
    };
  }
}
