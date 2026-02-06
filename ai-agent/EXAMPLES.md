# AI Command Agent - Usage Examples

This document provides practical examples of using the AI Command Agent.

## Installation & Setup

The agent is included in the project. No additional installation needed.

## Quick Start

### 1. List Available Commands

```bash
npm run agent:list
```

Output:
```
AVAILABLE COMMANDS

PACKAGE-MANAGEMENT:
  • npm-install: Install npm packages [medium]

BUILD:
  • npm-build: Build the project [low]

VALIDATION:
  • npm-check: Run TypeScript type checking [low]
  • npm-test: Run tests [low]

CONFIGURATION:
  • update-env-file: Update environment variable in .env file [high]

GIT:
  • git-status: Check git status [low]
  • git-diff: Show git diff [low]

DATABASE:
  • db-push: Push database schema changes [high]

DEPLOYMENT:
  • deploy-testnet: Deploy smart contract to TestNet [high]
```

### 2. Execute a Single Command

```bash
npm run agent npm run build
```

The agent will:
1. Validate the command
2. Show command information (ID, description, risk level)
3. Simulate the command (show what will happen)
4. Ask for confirmation (if required)
5. Execute the command
6. Display results

### 3. Interactive Mode

```bash
npm run agent
```

Then type commands interactively:
```
> npm run check
> git status
> list
> help
> exit
```

## Example Workflows

### Workflow 1: Update Environment Variable

**Scenario**: Update DATABASE_URL in .env file

```bash
npm run agent update .env DATABASE_URL=postgresql://localhost/mydb
```

**Agent Process**:

1. **Command Analysis**:
   ```
   Command ID: update-env-file
   Description: Update environment variable in .env file
   Category: configuration
   Risk Level: HIGH
   ```

2. **Simulation**:
   ```
   File: .env (update)
   
   --- before
   +++ after
   @@ -1,3 +1,3 @@
     PORT=5000
   - DATABASE_URL=postgresql://old/db
   + DATABASE_URL=postgresql://localhost/mydb
     NODE_ENV=development
   ```

3. **Confirmation**:
   ```
   Do you want to execute this command? (y/n): y
   ```

4. **Execution**:
   ```
   ✅ Command executed successfully!
   Exit Code: 0
   Duration: 15ms
   
   Output:
   Successfully updated DATABASE_URL in .env
   ```

### Workflow 2: Build Project

**Scenario**: Build the project

```bash
npm run agent npm run build
```

**Agent Process**:

1. **Command Analysis**:
   ```
   Command ID: npm-build
   Description: Build the project
   Category: build
   Risk Level: LOW
   ```

2. **Simulation**:
   ```
   Will build the project using npm run build
   
   This will:
     - Build client (React + Vite)
     - Build server (Express + esbuild)
     - Output to dist/ directory
     - Compile TypeScript to JavaScript
     - Bundle and minify assets
   
   Expected output:
     - dist/public/ (client assets)
     - dist/index.cjs (server bundle)
   
   Estimated Duration: 10s
   ```

3. **Confirmation**:
   ```
   Do you want to execute this command? (y/n): y
   ```

4. **Execution**:
   ```
   ✅ Command executed successfully!
   Exit Code: 0
   Duration: 12s
   
   Output:
   building client...
   ✓ built in 8523ms
   building server...
   Build complete!
   ```

### Workflow 3: Check Git Status

**Scenario**: Check repository status

```bash
npm run agent git status
```

**Agent Process**:

1. **Command Analysis**:
   ```
   Command ID: git-status
   Description: Check git status
   Category: git
   Risk Level: LOW
   ```

2. **Simulation** (with real output):
   ```
   On branch main
   Your branch is up to date with 'origin/main'.
   
   Changes not staged for commit:
     modified:   ai-agent/README.md
     modified:   package.json
   
   Untracked files:
     ai-agent/
   ```

3. **No confirmation needed** (low risk)

4. **Execution**:
   ```
   ✅ Command executed successfully!
   Exit Code: 0
   Duration: 124ms
   ```

### Workflow 4: Database Schema Push

**Scenario**: Push database schema changes

```bash
npm run agent npm run db:push
```

**Agent Process**:

1. **Command Analysis**:
   ```
   Command ID: db-push
   Description: Push database schema changes
   Category: database
   Risk Level: HIGH
   ```

2. **Simulation**:
   ```
   ⚠️  WARNING: This will modify your database!
   
   Will push database schema changes using Drizzle
   
   This will:
     - Connect to the database specified in DATABASE_URL
     - Compare current schema with database
     - Generate and execute migration SQL
     - Update database tables/columns
   
   Potential risks:
     - Data loss if dropping columns/tables
     - Schema conflicts
     - Connection issues
   
   💡 Recommendation: Backup your database first
   
   Warnings:
   ⚠️  This will modify your database schema
   ⚠️  Ensure DATABASE_URL is set correctly
   ⚠️  Consider backing up your database first
   ```

3. **Confirmation** (REQUIRED for high risk):
   ```
   Do you want to execute this command? (y/n): y
   ```

4. **Execution**:
   ```
   ✅ Command executed successfully!
   Exit Code: 0
   Duration: 3.2s
   
   Output:
   Pushing schema changes...
   ✓ Schema updated successfully
   ```

## Interactive Mode Examples

### Example Session 1: Building and Testing

```bash
$ npm run agent

AI COMMAND AGENT - INTERACTIVE MODE
Type commands to simulate and execute them.
Type "list" to see available commands.
Type "exit" or "quit" to exit.

> npm run build

============================================================
COMMAND ANALYSIS
============================================================
Command: npm run build
Command ID: npm-build
Description: Build the project
Category: build
Risk Level: LOW

[Simulation shows build preview...]

Do you want to execute this command? (y/n): y

✅ Command executed successfully!

> npm run check

[TypeScript checking results...]

> exit
✅ Goodbye!
```

### Example Session 2: Git Workflow

```bash
$ npm run agent

> git status

[Shows git status...]

> git diff

[Shows git diff...]

> exit
```

## Advanced Usage

### Custom Command Execution

You can add new commands to the whitelist dynamically:

**Edit `ai-agent/command-whitelist.json`**:

```json
{
  "commands": [
    {
      "id": "custom-script",
      "pattern": "^\\./my-script\\.sh$",
      "description": "Run my custom script",
      "category": "custom",
      "riskLevel": "medium",
      "requiresConfirmation": true,
      "supportsDryRun": false
    }
  ]
}
```

Then use it:

```bash
npm run agent ./my-script.sh
```

### Testing Commands

Run the test suite:

```bash
npm run agent:test
```

This validates:
- Agent initialization
- Command recognition
- Whitelist configuration
- Risk categorization
- Utility functions

## Security Features in Action

### Blocked Command Example

```bash
npm run agent rm -rf /
```

Output:
```
❌ Command validation failed: Command contains potentially dangerous pattern
```

### Non-Whitelisted Command

```bash
npm run agent random-command
```

Output:
```
❌ Command not whitelisted!
ℹ️  Only whitelisted commands are allowed for security.
ℹ️  Use "agent list" to see available commands.
```

## Tips & Best Practices

1. **Always review simulations carefully** before confirming execution
2. **Use low-risk commands** (git status, npm check) without worry
3. **Be cautious with high-risk commands** (db:push, deployment)
4. **Test commands in development** before using in production
5. **Keep whitelist updated** with commands you actually need
6. **Backup data** before database operations
7. **Review diffs** for file modifications carefully

## Troubleshooting

### Command Not Found

**Issue**: `npm run agent: command not found`

**Solution**: Run from project root directory

### Whitelist Not Loading

**Issue**: `Failed to load command whitelist`

**Solution**: Ensure `ai-agent/command-whitelist.json` exists

### Permission Denied

**Issue**: Commands fail with permission errors

**Solution**: Check file permissions or run with appropriate privileges

## Next Steps

- Read [ai-agent/README.md](./README.md) for full documentation
- Explore [command-whitelist.json](./command-whitelist.json) to see all commands
- Add your own commands to the whitelist
- Integrate with CI/CD pipelines
