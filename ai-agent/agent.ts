import type { AgentContext } from './types';
import { CommandWhitelist } from './utils/whitelist';
import { validateCommand, Logger } from './utils/helpers';
import { Simulator } from './simulators/index';
import { Executor } from './executors/index';
import { CLI } from './commands/cli';

const logger = new Logger('Agent');

/**
 * Main AI Agent - coordinates simulation and execution
 */
export class Agent {
  private whitelist: CommandWhitelist;
  private simulator: Simulator;
  private executor: Executor;
  private cli: CLI;
  private context: AgentContext;

  constructor(workingDirectory?: string) {
    this.whitelist = new CommandWhitelist();
    this.simulator = new Simulator();
    this.executor = new Executor();
    this.cli = new CLI();
    this.context = {
      workingDirectory: workingDirectory || process.cwd(),
      environment: { ...process.env },
      timestamp: new Date(),
    };
  }

  /**
   * Initialize the agent
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing AI Agent...');
      await this.whitelist.load();
      logger.success('Agent initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize agent', error as Error);
      throw error;
    }
  }

  /**
   * Process a single command
   */
  async processCommand(command: string, interactive: boolean = true): Promise<boolean> {
    try {
      // Validate command safety
      const validation = validateCommand(command);
      if (!validation.valid) {
        this.cli.error(`Command validation failed: ${validation.reason}`);
        return false;
      }

      // Check if command is whitelisted
      const match = this.whitelist.matchCommand(command);
      if (!match) {
        this.cli.error('Command not whitelisted!');
        this.cli.info('Only whitelisted commands are allowed for security.');
        this.cli.info('Use "agent list" to see available commands.');
        return false;
      }

      this.cli.header('COMMAND ANALYSIS');
      this.cli.info(`Command: ${command}`);
      this.cli.displayCommandInfo({
        id: match.config.id,
        description: match.config.description,
        category: match.config.category,
        riskLevel: match.config.riskLevel,
      });

      // Simulate the command
      const simulationResult = await this.simulator.simulate(
        command,
        match.config,
        this.context
      );

      this.cli.displaySimulation(simulationResult);

      if (!simulationResult.success) {
        this.cli.error('Simulation failed. Command will not be executed.');
        return false;
      }

      // Ask for confirmation if required and in interactive mode
      if (match.config.requiresConfirmation && interactive) {
        this.cli.print('');
        const confirmed = await this.cli.confirm('Do you want to execute this command?');
        if (!confirmed) {
          this.cli.warning('Command execution cancelled by user.');
          return false;
        }
      } else if (match.config.requiresConfirmation && !interactive) {
        this.cli.warning('Command requires confirmation but running in non-interactive mode.');
        this.cli.warning('Skipping execution. Use interactive mode for commands requiring confirmation.');
        return false;
      }

      // Execute the command
      this.cli.print('\n');
      this.cli.info('Executing command...');
      const executionResult = await this.executor.execute(
        command,
        match.config,
        this.context
      );

      this.cli.displayExecution(executionResult);

      return executionResult.success;
    } catch (error) {
      logger.error('Error processing command', error as Error);
      this.cli.error(`Error: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * List all available commands
   */
  listCommands(): void {

    this.cli.header('AVAILABLE COMMANDS');

    const categories = this.whitelist.getCategories();

    for (const category of categories) {
      this.cli.print(`\n\x1b[1m${category.toUpperCase()}:\x1b[0m`);
      const commands = this.whitelist.getCommandsByCategory(category);

      for (const cmd of commands) {
        const riskColor = cmd.riskLevel === 'high' ? '\x1b[31m' : cmd.riskLevel === 'medium' ? '\x1b[33m' : '\x1b[32m';
        this.cli.print(`  • ${cmd.id}: ${cmd.description} ${riskColor}[${cmd.riskLevel}]\x1b[0m`);
      }
    }

    this.cli.print('');
  }

  /**
   * Interactive mode - continuous command input
   */
  async interactive(): Promise<void> {
    this.cli.header('AI COMMAND AGENT - INTERACTIVE MODE');
    this.cli.info('Type commands to simulate and execute them.');
    this.cli.info('Type "list" to see available commands.');
    this.cli.info('Type "exit" or "quit" to exit.');
    this.cli.print('');

    let running = true;

    while (running) {
      const command = await this.cli.question('\n> ');
      const trimmed = command.trim();

      if (!trimmed) {
        continue;
      }

      if (trimmed === 'exit' || trimmed === 'quit') {
        running = false;
        this.cli.success('Goodbye!');
        break;
      }

      if (trimmed === 'list') {
        this.listCommands();
        continue;
      }

      if (trimmed === 'help') {
        this.showHelp();
        continue;
      }

      await this.processCommand(trimmed);
    }

    this.cli.close();
  }

  /**
   * Show help information
   */
  private showHelp(): void {
    this.cli.header('HELP');
    this.cli.print('Available commands:');
    this.cli.print('  list      - List all available whitelisted commands');
    this.cli.print('  help      - Show this help message');
    this.cli.print('  exit/quit - Exit the agent');
    this.cli.print('');
    this.cli.print('To execute a command, simply type it and press Enter.');
    this.cli.print('The agent will simulate it first and ask for confirmation.');
    this.cli.print('');
  }
}
