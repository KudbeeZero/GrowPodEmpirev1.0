import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Logger utility for the AI agent
 */
export class Logger {
  private prefix: string;

  constructor(prefix: string = 'AI-Agent') {
    this.prefix = prefix;
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${this.prefix}] [${level}] ${message}`;
  }

  info(message: string): void {
    console.log(this.formatMessage('INFO', message));
  }

  warn(message: string): void {
    console.warn(this.formatMessage('WARN', message));
  }

  error(message: string, error?: Error): void {
    console.error(this.formatMessage('ERROR', message));
    if (error) {
      console.error(error);
    }
  }

  success(message: string): void {
    console.log(this.formatMessage('SUCCESS', message));
  }

  debug(message: string): void {
    if (process.env.DEBUG === 'true') {
      console.log(this.formatMessage('DEBUG', message));
    }
  }
}

/**
 * Execute a shell command safely
 */
export async function executeCommand(
  command: string,
  options: {
    cwd?: string;
    timeout?: number;
    env?: Record<string, string>;
  } = {}
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: options.cwd || process.cwd(),
      timeout: options.timeout || 30000,
      env: { ...process.env, ...options.env },
    });

    return {
      stdout: stdout.toString(),
      stderr: stderr.toString(),
      exitCode: 0,
    };
  } catch (error: any) {
    return {
      stdout: error.stdout?.toString() || '',
      stderr: error.stderr?.toString() || error.message,
      exitCode: error.code || 1,
    };
  }
}

/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }

  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Validate command safety
 */
export function validateCommand(command: string): { valid: boolean; reason?: string } {
  // Check for dangerous patterns
  const dangerousPatterns = [
    /rm\s+-rf\s+\//i, // rm -rf /
    /dd\s+if=/i, // dd command
    />>\s*\/dev\/sd/i, // Writing to disk devices
    /mkfs/i, // Format filesystem
    /:\(\)\{.*:\|:&\};:/i, // Fork bomb
    /sudo\s+/i, // Sudo commands (should be explicit)
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(command)) {
      return {
        valid: false,
        reason: `Command contains potentially dangerous pattern: ${pattern.source}`,
      };
    }
  }

  // Check length
  if (command.length > 2000) {
    return {
      valid: false,
      reason: 'Command is too long (max 2000 characters)',
    };
  }

  return { valid: true };
}

/**
 * Parse command arguments
 */
export function parseCommandArgs(command: string): { cmd: string; args: string[] } {
  const parts = command.trim().split(/\s+/);
  return {
    cmd: parts[0],
    args: parts.slice(1),
  };
}

/**
 * Create a safe sandbox environment variables
 */
export function createSandboxEnv(): Record<string, string> {
  return {
    NODE_ENV: 'development',
    PATH: process.env.PATH || '',
    HOME: process.env.HOME || '',
    USER: process.env.USER || '',
  };
}
