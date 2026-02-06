# AI Command Agent

An intelligent command simulation and execution system for the GrowPod Empire project.

## Overview

The AI Command Agent provides a safe and controlled environment for executing terminal commands. It simulates commands before execution, showing previews and diffs, and requires user confirmation for potentially risky operations.

## Features

- ✅ **Command Whitelisting**: Only pre-approved commands can be executed
- 🔍 **Simulation Mode**: Preview command effects before execution
- 📊 **Diff Previews**: See file changes before they happen
- ⚠️ **Risk Assessment**: Commands are categorized by risk level
- 👤 **User Confirmation**: High-risk operations require explicit approval
- 📝 **Execution Logs**: Detailed output of command execution
- 🔧 **Dynamic Configuration**: Whitelist can be updated on-the-fly
- 🧩 **Modular Design**: Easy to extend with new commands

## Installation

The AI agent is included in the project. To use it:

```bash
# Build the agent
npm run build

# Or use tsx to run directly
npx tsx ai-agent/index.ts
```

## Usage

### Interactive Mode

Start the agent in interactive mode for continuous command input:

```bash
npx tsx ai-agent/index.ts
```

Commands:
- `list` - Show all available whitelisted commands
- `help` - Display help information
- `exit` or `quit` - Exit the agent

### Single Command Execution

Execute a single command:

```bash
npx tsx ai-agent/index.ts npm run build
npx tsx ai-agent/index.ts update .env DATABASE_URL=postgresql://...
```

### List Available Commands

```bash
npx tsx ai-agent/index.ts list
```

## Command Categories

### Package Management
- `npm install` - Install npm packages
- `npm install <package>` - Install specific package

### Build
- `npm run build` - Build the project

### Validation
- `npm run check` - TypeScript type checking
- `npm test` - Run tests

### Configuration
- `update .env KEY=VALUE` - Update environment variables

### Git
- `git status` - Check git status
- `git diff [file]` - Show git diff

### Database
- `npm run db:push` - Push database schema changes

### Deployment
- `./scripts/deploy-testnet.sh` - Deploy to TestNet

## Configuration

### Command Whitelist

Edit `ai-agent/command-whitelist.json` to manage whitelisted commands:

```json
{
  "commands": [
    {
      "id": "unique-id",
      "pattern": "^regex-pattern$",
      "description": "Command description",
      "category": "category-name",
      "riskLevel": "low|medium|high",
      "requiresConfirmation": true,
      "supportsDryRun": false
    }
  ]
}
```

### Risk Levels

- **Low**: Safe commands (git status, npm check)
- **Medium**: Commands that modify local files (npm install)
- **High**: Commands that affect databases or deployments (db:push, deploy)

## Example Workflow

1. **Start the agent**:
   ```bash
   npx tsx ai-agent/index.ts
   ```

2. **Enter a command**:
   ```
   > update .env DATABASE_URL=postgresql://localhost/mydb
   ```

3. **Review simulation**:
   - See the diff of changes to .env file
   - Review warnings and estimated duration

4. **Confirm execution**:
   ```
   Do you want to execute this command? (y/n): y
   ```

5. **View results**:
   - See execution output
   - Check for errors
   - View execution duration

## Architecture

```
ai-agent/
├── index.ts                 # Main entry point
├── agent.ts                 # Core agent coordinator
├── types.ts                 # TypeScript type definitions
├── command-whitelist.json   # Whitelisted commands config
├── commands/
│   └── cli.ts              # CLI interface
├── simulators/
│   ├── index.ts            # Main simulator
│   ├── file-simulator.ts   # File operation simulation
│   └── command-simulator.ts # Command execution simulation
├── executors/
│   └── index.ts            # Command executor
└── utils/
    ├── whitelist.ts        # Whitelist manager
    └── helpers.ts          # Helper utilities
```

## Adding New Commands

1. **Add to whitelist** (`command-whitelist.json`):
   ```json
   {
     "id": "my-command",
     "pattern": "^my-command\\s+.*$",
     "description": "My custom command",
     "category": "custom",
     "riskLevel": "medium",
     "requiresConfirmation": true,
     "supportsDryRun": false
   }
   ```

2. **Add simulator** (optional, in `simulators/command-simulator.ts`):
   ```typescript
   async simulateMyCommand(
     command: string,
     config: CommandConfig,
     context: AgentContext
   ): Promise<SimulationResult> {
     // Implement simulation logic
   }
   ```

3. **Add to router** (`simulators/index.ts`):
   ```typescript
   case 'my-command':
     return await this.commandSimulator.simulateMyCommand(command, config, context);
   ```

## Security Features

- **Command Validation**: Checks for dangerous patterns
- **Whitelist Enforcement**: Only approved commands execute
- **Sandbox Environment**: Commands run in controlled context
- **Input Sanitization**: Prevents injection attacks
- **Length Limits**: Prevents buffer overflow attempts
- **Confirmation Requirements**: User approval for high-risk ops

## Dangerous Patterns Blocked

- `rm -rf /` - Recursive deletion of root
- `dd if=` - Disk write operations
- `mkfs` - Filesystem formatting
- `sudo` - Privilege escalation (unless explicit)
- Fork bombs and other malicious patterns

## Troubleshooting

### "Command not whitelisted"
- Check `ai-agent/command-whitelist.json`
- Ensure command matches a pattern exactly
- Use `list` to see available commands

### "Simulation failed"
- Check file permissions
- Ensure required files exist
- Verify environment variables

### "Execution failed"
- Review error output
- Check working directory
- Verify command syntax

## Development

### Running Tests

```bash
# Run agent in debug mode
DEBUG=true npx tsx ai-agent/index.ts
```

### Extending Simulators

Add new simulator methods in `simulators/` directory and register them in the main simulator router.

### Custom Executors

Implement custom execution logic in `executors/index.ts` for commands that need special handling.

## Contributing

When adding new commands:
1. Assess risk level appropriately
2. Implement simulation when possible
3. Add comprehensive error handling
4. Update documentation
5. Test thoroughly before committing

## License

MIT

## Related Documentation

- [README.md](../README.md) - Project overview
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines
- [AI_WORKFLOW_GUIDE.md](../AI_WORKFLOW_GUIDE.md) - AI workflow guide
