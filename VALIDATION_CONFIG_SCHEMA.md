# Validation Configuration Schema

Complete reference for `validation-config.json` structure and options.

## Schema Version: 1.0.0

## Root Structure

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "version": "string",
  "description": "string",
  "validation_rules": { ... },
  "alerting": { ... },
  "exclusions": { ... }
}
```

## Validation Rules

### admin_wallet

Validates consistency of the admin wallet address across the repository.

```json
{
  "admin_wallet": {
    "enabled": boolean,
    "expected_value": "string (Algorand address)",
    "files_to_check": ["array of file paths"],
    "pattern": "string (regex pattern)",
    "description": "string"
  }
}
```

**Fields:**
- `enabled` (required): Enable/disable this validation
- `expected_value` (required): The expected admin wallet address
- `files_to_check` (required): Array of file paths to validate
- `pattern` (optional): Custom regex pattern for matching
- `description` (optional): Human-readable description

**Example:**
```json
{
  "admin_wallet": {
    "enabled": true,
    "expected_value": "BDBJFOSYG4N3LHLJN3CHLOLYDGW63SK6YJHECGDYMF75DXL4X3XCQNDLME",
    "files_to_check": [
      ".dev.vars.example",
      "README.md",
      "server/routes.ts"
    ],
    "description": "TestNet admin wallet address"
  }
}
```

### token_ids

Validates token and application IDs across the codebase.

```json
{
  "token_ids": {
    "enabled": boolean,
    "tokens": {
      "TOKEN_NAME": {
        "asset_id": "string",
        "app_id": "string (optional)",
        "files_to_check": ["array of file paths"],
        "description": "string"
      }
    }
  }
}
```

**Fields:**
- `enabled` (required): Enable/disable this validation
- `tokens` (required): Object containing token configurations
  - `TOKEN_NAME` (key): Name of the token (e.g., "BUD", "TERP")
    - `asset_id` (required): The asset ID to validate
    - `app_id` (optional): The application ID to validate
    - `files_to_check` (required): Files to check for this token
    - `description` (optional): Token description

**Example:**
```json
{
  "token_ids": {
    "enabled": true,
    "tokens": {
      "BUD": {
        "asset_id": "753910204",
        "app_id": "753910199",
        "files_to_check": [
          "client/src/context/AlgorandContext.tsx",
          ".dev.vars.example"
        ],
        "description": "$BUD token - harvest commodity token"
      },
      "TERP": {
        "asset_id": "753910205",
        "files_to_check": [
          "client/src/context/AlgorandContext.tsx"
        ],
        "description": "$TERP token - governance token"
      }
    }
  }
}
```

### algorand_config

Validates Algorand blockchain configuration parameters.

```json
{
  "algorand_config": {
    "enabled": boolean,
    "chain_id": "string",
    "network": "string",
    "algod_server": "string (URL)",
    "files_to_check": ["array of file paths"],
    "description": "string"
  }
}
```

**Fields:**
- `enabled` (required): Enable/disable this validation
- `chain_id` (required): Algorand chain ID
- `network` (required): Network name (e.g., "TestNet", "MainNet")
- `algod_server` (required): Algod server URL
- `files_to_check` (required): Files to validate
- `description` (optional): Configuration description

**Example:**
```json
{
  "algorand_config": {
    "enabled": true,
    "chain_id": "416002",
    "network": "TestNet",
    "algod_server": "https://testnet-api.algonode.cloud",
    "files_to_check": [
      "client/src/context/AlgorandContext.tsx",
      "CLAUDE.md"
    ],
    "description": "Algorand TestNet configuration"
  }
}
```

### cloudflare_config

Validates Cloudflare Workers configuration.

```json
{
  "cloudflare_config": {
    "enabled": boolean,
    "account_id": "string",
    "database_name": "string",
    "database_id": "string",
    "files_to_check": ["array of file paths"],
    "description": "string"
  }
}
```

**Fields:**
- `enabled` (required): Enable/disable this validation
- `account_id` (required): Cloudflare account ID
- `database_name` (required): D1 database name
- `database_id` (required): D1 database ID
- `files_to_check` (required): Files to validate (typically wrangler.toml)
- `description` (optional): Configuration description

**Example:**
```json
{
  "cloudflare_config": {
    "enabled": true,
    "account_id": "b591c2e07ca352d33076f4d2f8414b89",
    "database_name": "growpod-primary",
    "database_id": "712d926f-c396-473f-96d9-f0dfc3d1d069",
    "files_to_check": ["wrangler.toml"],
    "description": "Cloudflare Workers configuration"
  }
}
```

### environment_variables

Validates that required environment variables are documented.

```json
{
  "environment_variables": {
    "enabled": boolean,
    "required_vars": ["array of variable names"],
    "files_to_check": ["array of file paths"],
    "description": "string"
  }
}
```

**Fields:**
- `enabled` (required): Enable/disable this validation
- `required_vars` (required): Array of required environment variable names
- `files_to_check` (required): Documentation files to check
- `description` (optional): Validation description

**Example:**
```json
{
  "environment_variables": {
    "enabled": true,
    "required_vars": [
      "DATABASE_URL",
      "VITE_GROWPOD_APP_ID",
      "ADMIN_WALLET_ADDRESS"
    ],
    "files_to_check": [
      ".dev.vars.example",
      "README.md"
    ],
    "description": "Required environment variables"
  }
}
```

### token_economy

Validates token economy values in documentation.

```json
{
  "token_economy": {
    "enabled": boolean,
    "tokens": {
      "TOKEN_NAME": {
        "total_supply": "string (number)",
        "decimals": number,
        "base_harvest": "string (optional)",
        "cleanup_cost": "string (optional)",
        "breeding_cost": "string (optional)",
        "slot_claim_cost": "string (optional)",
        "reward_range": "string (optional)",
        "files_to_check": ["array of file paths"]
      }
    },
    "description": "string"
  }
}
```

**Fields:**
- `enabled` (required): Enable/disable this validation
- `tokens` (required): Object containing token economy configurations
  - `TOKEN_NAME` (key): Name of the token
    - `total_supply` (optional): Total token supply
    - `decimals` (optional): Number of decimals
    - `*_cost` fields (optional): Various cost values
    - `files_to_check` (required): Documentation files to validate

**Example:**
```json
{
  "token_economy": {
    "enabled": true,
    "tokens": {
      "BUD": {
        "total_supply": "10000000000",
        "decimals": 6,
        "base_harvest": "250000000",
        "cleanup_cost": "500",
        "breeding_cost": "1000",
        "slot_claim_cost": "2500",
        "files_to_check": [
          "README.md",
          "CLAUDE.md"
        ]
      }
    },
    "description": "Token economy values consistency"
  }
}
```

## Alerting Configuration

```json
{
  "alerting": {
    "github_actions": {
      "enabled": boolean,
      "on_pr": boolean,
      "on_push": boolean,
      "scheduled": "string (cron expression)",
      "fail_on_error": boolean
    },
    "output_format": {
      "json": boolean,
      "markdown": boolean,
      "github_annotations": boolean
    }
  }
}
```

**Fields:**
- `github_actions` (optional): GitHub Actions configuration
  - `enabled`: Enable GitHub Actions integration
  - `on_pr`: Run on pull requests
  - `on_push`: Run on pushes
  - `scheduled`: Cron expression for scheduled runs
  - `fail_on_error`: Fail the workflow on validation errors
- `output_format` (optional): Output format options
  - `json`: Generate JSON report
  - `markdown`: Generate Markdown report
  - `github_annotations`: Create GitHub annotations

**Example:**
```json
{
  "alerting": {
    "github_actions": {
      "enabled": true,
      "on_pr": true,
      "on_push": true,
      "scheduled": "0 0 * * *",
      "fail_on_error": true
    },
    "output_format": {
      "json": true,
      "markdown": true,
      "github_annotations": true
    }
  }
}
```

## Exclusions Configuration

```json
{
  "exclusions": {
    "directories": ["array of directory paths"],
    "files": ["array of file patterns"]
  }
}
```

**Fields:**
- `directories` (optional): Directories to exclude from scanning
- `files` (optional): File patterns to exclude

**Example:**
```json
{
  "exclusions": {
    "directories": [
      "node_modules",
      "dist",
      ".git"
    ],
    "files": [
      "*.log",
      "package-lock.json"
    ]
  }
}
```

## Complete Example

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "version": "1.0.0",
  "description": "Repository consistency validation configuration",
  "validation_rules": {
    "admin_wallet": {
      "enabled": true,
      "expected_value": "BDBJFOSYG4N3LHLJN3CHLOLYDGW63SK6YJHECGDYMF75DXL4X3XCQNDLME",
      "files_to_check": [".dev.vars.example", "README.md"],
      "description": "Admin wallet consistency"
    },
    "token_ids": {
      "enabled": true,
      "tokens": {
        "BUD": {
          "asset_id": "753910204",
          "files_to_check": ["client/src/context/AlgorandContext.tsx"]
        }
      }
    }
  },
  "alerting": {
    "github_actions": {
      "enabled": true,
      "on_pr": true,
      "scheduled": "0 0 * * *",
      "fail_on_error": true
    },
    "output_format": {
      "json": true,
      "markdown": true
    }
  },
  "exclusions": {
    "directories": ["node_modules", "dist"]
  }
}
```

## Validation

To validate your configuration file:

```bash
# Run validation (will report config syntax errors)
npm run validate

# Use a JSON schema validator
npx ajv validate -s validation-config-schema.json -d validation-config.json
```

## Best Practices

1. **Keep version updated** - Increment when making significant changes
2. **Use absolute file paths** - Relative to repository root
3. **Enable only needed rules** - Disable rules that don't apply
4. **Test after changes** - Always run `npm run validate` after editing
5. **Document custom rules** - Add clear descriptions
6. **Use comments** - JSON doesn't support comments, but keep a separate doc

## Migration Guide

### From 1.0.0 to Future Versions

Future schema changes will be documented here.

## Support

- Report schema issues: GitHub Issues
- Request new fields: GitHub Discussions
- Documentation: `VALIDATION_SYSTEM.md`
