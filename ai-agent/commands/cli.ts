import * as readline from 'readline';
import { stdin as input, stdout as output } from 'process';

/**
 * CLI interface for user interaction
 */
export class CLI {
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({ input, output });
  }

  /**
   * Ask a question and get user input
   */
  async question(query: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(query, (answer) => {
        resolve(answer);
      });
    });
  }

  /**
   * Ask for yes/no confirmation
   */
  async confirm(query: string): Promise<boolean> {
    const answer = await this.question(`${query} (y/n): `);
    return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
  }

  /**
   * Display a message
   */
  print(message: string): void {
    console.log(message);
  }

  /**
   * Display an error message
   */
  error(message: string): void {
    console.error(`\x1b[31m❌ ${message}\x1b[0m`);
  }

  /**
   * Display a success message
   */
  success(message: string): void {
    console.log(`\x1b[32m✅ ${message}\x1b[0m`);
  }

  /**
   * Display a warning message
   */
  warning(message: string): void {
    console.log(`\x1b[33m⚠️  ${message}\x1b[0m`);
  }

  /**
   * Display an info message
   */
  info(message: string): void {
    console.log(`\x1b[36mℹ️  ${message}\x1b[0m`);
  }

  /**
   * Display a section header
   */
  header(message: string): void {
    console.log(`\n\x1b[1m\x1b[36m${'='.repeat(60)}\x1b[0m`);
    console.log(`\x1b[1m\x1b[36m${message}\x1b[0m`);
    console.log(`\x1b[1m\x1b[36m${'='.repeat(60)}\x1b[0m\n`);
  }

  /**
   * Display a divider
   */
  divider(): void {
    console.log(`\x1b[90m${'-'.repeat(60)}\x1b[0m`);
  }

  /**
   * Display a diff (with colors)
   */
  displayDiff(diff: string): void {
    const lines = diff.split('\n');
    for (const line of lines) {
      if (line.startsWith('+')) {
        console.log(`\x1b[32m${line}\x1b[0m`);
      } else if (line.startsWith('-')) {
        console.log(`\x1b[31m${line}\x1b[0m`);
      } else if (line.startsWith('@@')) {
        console.log(`\x1b[36m${line}\x1b[0m`);
      } else {
        console.log(line);
      }
    }
  }

  /**
   * Display command info in a formatted way
   */
  displayCommandInfo(config: {
    id: string;
    description: string;
    category: string;
    riskLevel: string;
  }): void {
    this.divider();
    console.log(`\x1b[1mCommand ID:\x1b[0m ${config.id}`);
    console.log(`\x1b[1mDescription:\x1b[0m ${config.description}`);
    console.log(`\x1b[1mCategory:\x1b[0m ${config.category}`);

    const riskColor = config.riskLevel === 'high' ? '\x1b[31m' : config.riskLevel === 'medium' ? '\x1b[33m' : '\x1b[32m';
    console.log(`\x1b[1mRisk Level:\x1b[0m ${riskColor}${config.riskLevel.toUpperCase()}\x1b[0m`);
    this.divider();
  }

  /**
   * Display simulation results
   */
  displaySimulation(result: any): void {
    this.header('SIMULATION RESULTS');

    if (!result.success) {
      this.error('Simulation failed!');
      if (result.errors) {
        result.errors.forEach((err: string) => this.error(err));
      }
      return;
    }

    this.info(`Simulation Type: ${result.simulationType}`);

    if (result.preview) {
      this.print('\n' + result.preview);
    }

    if (result.diff && result.diff.length > 0) {
      this.print('\n\x1b[1mFile Changes:\x1b[0m\n');
      for (const fileDiff of result.diff) {
        this.print(`\x1b[1mFile:\x1b[0m ${fileDiff.file} (${fileDiff.operation})`);
        if (fileDiff.diff) {
          this.displayDiff(fileDiff.diff);
        }
        this.print('');
      }
    }

    if (result.warnings && result.warnings.length > 0) {
      this.print('\n\x1b[1mWarnings:\x1b[0m');
      result.warnings.forEach((warning: string) => this.warning(warning));
    }

    if (result.estimatedDuration) {
      this.info(`Estimated Duration: ${this.formatDuration(result.estimatedDuration)}`);
    }
  }

  /**
   * Display execution results
   */
  displayExecution(result: any): void {
    this.header('EXECUTION RESULTS');

    if (result.success) {
      this.success('Command executed successfully!');
    } else {
      this.error('Command execution failed!');
    }

    if (result.exitCode !== undefined) {
      this.info(`Exit Code: ${result.exitCode}`);
    }

    this.info(`Duration: ${this.formatDuration(result.duration)}`);

    if (result.stdout) {
      this.print('\n\x1b[1mOutput:\x1b[0m');
      this.print(result.stdout);
    }

    if (result.stderr) {
      this.print('\n\x1b[1mErrors:\x1b[0m');
      this.error(result.stderr);
    }

    if (result.error) {
      this.error(`Error: ${result.error}`);
    }
  }

  /**
   * Format duration in milliseconds
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  /**
   * Close the interface
   */
  close(): void {
    this.rl.close();
  }
}
