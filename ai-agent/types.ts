/**
 * Type definitions for the AI Command Agent
 */

export interface CommandConfig {
  id: string;
  pattern: string;
  description: string;
  category: 'package-management' | 'build' | 'development' | 'validation' | 'configuration' | 'git' | 'deployment' | 'database' | 'custom';
  riskLevel: 'low' | 'medium' | 'high';
  requiresConfirmation: boolean;
  supportsDryRun: boolean;
}

export interface WhitelistConfig {
  version: string;
  description: string;
  lastUpdated: string;
  commands: CommandConfig[];
  settings: {
    defaultRiskLevel: 'low' | 'medium' | 'high';
    requireConfirmationForHighRisk: boolean;
    allowDynamicCommandAddition: boolean;
    maxCommandLength: number;
    enableSimulationMode: boolean;
  };
}

export interface CommandMatch {
  command: string;
  config: CommandConfig;
  args: string[];
}

export interface SimulationResult {
  command: string;
  commandId: string;
  simulationType: 'file-diff' | 'dry-run' | 'preview' | 'none';
  success: boolean;
  preview?: string;
  diff?: FileDiff[];
  warnings?: string[];
  errors?: string[];
  estimatedDuration?: number;
}

export interface FileDiff {
  file: string;
  operation: 'create' | 'update' | 'delete';
  before?: string;
  after?: string;
  diff?: string;
}

export interface ExecutionResult {
  command: string;
  commandId: string;
  success: boolean;
  exitCode?: number;
  stdout?: string;
  stderr?: string;
  duration: number;
  error?: string;
}

export interface AgentContext {
  workingDirectory: string;
  environment: Record<string, string>;
  timestamp: Date;
  userId?: string;
}

export type SimulatorFunction = (
  command: string,
  config: CommandConfig,
  context: AgentContext
) => Promise<SimulationResult>;

export type ExecutorFunction = (
  command: string,
  config: CommandConfig,
  context: AgentContext
) => Promise<ExecutionResult>;
