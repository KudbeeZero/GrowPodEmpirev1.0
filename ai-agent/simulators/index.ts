import type { SimulationResult, CommandConfig, AgentContext } from '../types.js';
import { FileSimulator } from './file-simulator.js';
import { CommandSimulator } from './command-simulator.js';
import { Logger } from '../utils/helpers.js';

const logger = new Logger('MainSimulator');

/**
 * Main simulator that routes commands to appropriate simulators
 */
export class Simulator {
  private fileSimulator: FileSimulator;
  private commandSimulator: CommandSimulator;

  constructor() {
    this.fileSimulator = new FileSimulator();
    this.commandSimulator = new CommandSimulator();
  }

  /**
   * Simulate a command based on its configuration
   */
  async simulate(
    command: string,
    config: CommandConfig,
    context: AgentContext
  ): Promise<SimulationResult> {
    logger.info(`Simulating command: ${command}`);

    try {
      // Route to appropriate simulator based on command ID
      switch (config.id) {
        case 'update-env-file':
          return await this.fileSimulator.simulateEnvUpdate(command, config, context);

        case 'npm-install':
          return await this.commandSimulator.simulateNpmInstall(command, config, context);

        case 'npm-build':
          return await this.commandSimulator.simulateNpmBuild(command, config, context);

        case 'npm-check':
          return await this.commandSimulator.simulateNpmCheck(command, config, context);

        case 'db-push':
          return await this.commandSimulator.simulateDbPush(command, config, context);

        case 'git-status':
        case 'git-diff':
          return await this.commandSimulator.simulateGitCommand(command, config, context);

        case 'deploy-testnet':
          return await this.commandSimulator.simulateDeployment(command, config, context);

        default:
          // Generic preview for commands without specific simulator
          return {
            command,
            commandId: config.id,
            simulationType: 'preview',
            success: true,
            preview: `Will execute: ${command}\n\nDescription: ${config.description}`,
            estimatedDuration: 1000,
          };
      }
    } catch (error) {
      logger.error('Simulation failed', error as Error);
      return {
        command,
        commandId: config.id,
        simulationType: 'none',
        success: false,
        errors: [(error as Error).message],
      };
    }
  }
}
