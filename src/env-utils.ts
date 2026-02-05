/**
 * Server-side environment variable utilities
 * 
 * These helpers are designed for server/worker contexts only.
 * Do not import this module in client-side code.
 */

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`FATAL: Required environment variable ${name} is not set`);
  }
  return value;
}

export function getEnvOrDefault(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

export function validateRequiredEnvVars(required: string[]): void {
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`FATAL: Missing required environment variables: ${missing.join(', ')}`);
  }
}
