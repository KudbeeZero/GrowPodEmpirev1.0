# Repository Consistency Monitoring System

A comprehensive system for ensuring consistency across configuration files, documentation, and code in the GrowPod Empire repository.

## Overview

This system consists of three main components:

1. **Static Code Analysis** - Scans repository files for discrepancies and validates configurations
2. **Validation Scripts** - Modular, reusable validation functions
3. **Alerting Mechanism** - GitHub Actions integration with automated checks and notifications

## Features

✅ **Dynamic Configuration** - All validation rules are defined in `validation-config.json`
✅ **Modular Design** - Reusable validation functions in `scripts/lib/validators.js`
✅ **Automated Checks** - Runs on PRs, pushes, and daily schedule
✅ **Detailed Reporting** - JSON and Markdown reports with line-level details
✅ **GitHub Integration** - PR comments, annotations, and status checks
✅ **Easy Updates** - Change validation rules without modifying code

## Quick Start

### Running Locally

```bash
# Install dependencies
npm install

# Run validation
node scripts/validate-consistency.js

# View reports
cat validation-report.md
cat validation-report.json
```

### GitHub Actions

The validation automatically runs:
- On every pull request to `main` or `production`
- On every push to `main` or `production`
- Daily at midnight UTC
- Manually via workflow dispatch

## Configuration

### validation-config.json

All validation rules are defined in `validation-config.json`. The configuration is structured as follows:

```json
{
  "version": "1.0.0",
  "validation_rules": {
    "admin_wallet": { ... },
    "token_ids": { ... },
    "algorand_config": { ... },
    "cloudflare_config": { ... },
    "environment_variables": { ... },
    "token_economy": { ... }
  },
  "alerting": { ... },
  "exclusions": { ... }
}
```

### Adding New Validation Rules

1. **Add rule configuration** to `validation-config.json`:
```json
{
  "validation_rules": {
    "my_new_rule": {
      "enabled": true,
      "expected_value": "some_value",
      "files_to_check": [
        "file1.ts",
        "file2.md"
      ],
      "description": "What this rule validates"
    }
  }
}
```

2. **Add validation logic** to `scripts/validate-consistency.js`:
```javascript
validateMyNewRule() {
  console.log(`\n${colors.cyan}${colors.bold}Validating My New Rule...${colors.reset}`);
  const rule = this.config.validation_rules.my_new_rule;
  
  rule.files_to_check.forEach(file => {
    const content = this.readFile(file);
    if (!content) return;
    
    const matches = this.findInFile(content, rule.expected_value, file);
    if (matches.length > 0) {
      console.log(`  ${colors.green}✓${colors.reset} ${file}`);
    } else {
      this.errors.push(new ValidationError(
        'my_new_rule',
        file,
        `Expected value not found: ${rule.expected_value}`
      ));
    }
  });
}

// Add to run() method
run() {
  // ... existing validations
  this.validateMyNewRule();
  // ...
}
```

## Validation Rules

### 1. Admin Wallet Address

**Purpose:** Ensures the TestNet admin wallet address is consistent across all configuration and documentation files.

**Checks:**
- `.dev.vars.example`
- `.github/copilot-instructions.md`
- `README.md`
- `CLAUDE.md`
- `ADMIN_WALLET_DEPLOYMENT.md`
- `wrangler.toml` (comments)
- `server/routes.ts`

**Expected:** `BDBJFOSYG4N3LHLJN3CHLOLYDGW63SK6YJHECGDYMF75DXL4X3XCQNDLME`

### 2. Token IDs

**Purpose:** Validates consistency of Algorand token IDs across code and documentation.

**Tokens:**
- **$BUD** (753910204) - Harvest commodity token
- **$TERP** (753910205) - Terpene rights/governance token
- **$SLOT** (753910206) - Progression token
- **App ID** (753910199) - Smart contract application ID

**Checks:**
- `client/src/context/AlgorandContext.tsx`
- `.dev.vars.example`
- `.github/copilot-instructions.md`
- `CLAUDE.md`

### 3. Algorand Configuration

**Purpose:** Validates Algorand TestNet configuration parameters.

**Checks:**
- Chain ID: `416002`
- Network: `TestNet`
- Algod Server: `https://testnet-api.algonode.cloud`

### 4. Cloudflare Configuration

**Purpose:** Ensures Cloudflare Workers configuration is consistent.

**Checks:**
- Account ID: `b591c2e07ca352d33076f4d2f8414b89`
- Database ID: `712d926f-c396-473f-96d9-f0dfc3d1d069`
- Database Name: `growpod-primary`

### 5. Environment Variables

**Purpose:** Verifies all required environment variables are documented.

**Required Variables:**
- `DATABASE_URL`
- `VITE_GROWPOD_APP_ID`
- `VITE_BUD_ASSET_ID`
- `VITE_TERP_ASSET_ID`
- `VITE_SLOT_ASSET_ID`
- `VITE_GROWPOD_APP_ADDRESS`
- `ADMIN_WALLET_ADDRESS`

### 6. Token Economy

**Purpose:** Validates token economy values are consistent in documentation.

**Checks:**
- Total supply values
- Cleanup costs
- Breeding costs
- Slot claim costs

## Output Formats

### Console Output

Colored, formatted output with:
- ✓ Success indicators (green)
- ✗ Error indicators (red)
- ⚠ Warning indicators (yellow)
- Detailed error messages with file paths

### JSON Report (`validation-report.json`)

```json
{
  "timestamp": "2026-02-06T04:00:00.000Z",
  "version": "1.0.0",
  "summary": {
    "total_errors": 0,
    "total_warnings": 0,
    "passed": true
  },
  "errors": [],
  "warnings": []
}
```

### Markdown Report (`validation-report.md`)

Human-readable report with:
- Summary section
- Error details with file paths and messages
- Warning list
- Status badge

## GitHub Actions Integration

### Workflow: repository-consistency-check.yml

**Features:**
- Runs validation on every PR and push
- Daily scheduled runs
- Uploads artifacts (reports)
- Creates PR comments with results
- GitHub annotations for errors
- Status checks for branch protection

### PR Comments

When validation runs on a PR, a comment is automatically posted with:
- Pass/fail status
- Collapsible detailed report
- Link to workflow artifacts

### GitHub Annotations

Errors are displayed as inline annotations in the GitHub Files Changed view:
- File-level annotations
- Line-level annotations (when available)
- Error type and message

## Usage Examples

### Check Everything

```bash
node scripts/validate-consistency.js
```

### Check Specific Files Only

Edit `validation-config.json` to enable/disable specific rules:

```json
{
  "validation_rules": {
    "admin_wallet": {
      "enabled": true,
      ...
    },
    "token_ids": {
      "enabled": false,  // Skip this validation
      ...
    }
  }
}
```

### Update Expected Values

To update expected values (e.g., after deploying new contracts):

```json
{
  "validation_rules": {
    "token_ids": {
      "tokens": {
        "BUD": {
          "asset_id": "NEW_ASSET_ID",  // Update here
          ...
        }
      }
    }
  }
}
```

Then run validation to verify consistency across all files.

## Troubleshooting

### Common Issues

#### Validation Fails After Deploying New Contracts

**Solution:** Update `validation-config.json` with new token IDs and contract addresses, then update all referenced files.

#### False Positives

**Solution:** Check if the expected pattern is correctly specified in the config. You may need to adjust the regex pattern or add alternate patterns.

#### Missing Files

**Solution:** Warnings are issued for missing files. Update the `files_to_check` array in the config to remove or correct file paths.

### Debugging

Enable verbose output by modifying the validation script:

```javascript
// In validate-consistency.js
const DEBUG = true;  // Add at top of file

// Add debug logging
if (DEBUG) {
  console.log(`Checking ${file} for pattern: ${pattern}`);
  console.log(`Found ${matches.length} matches`);
}
```

## Extending the System

### Adding Custom Validators

1. Create validator function in `scripts/lib/validators.js`
2. Export the function
3. Import and use in `scripts/validate-consistency.js`
4. Add configuration to `validation-config.json`

### Integrating with CI/CD

The system is designed to integrate with any CI/CD platform:

**GitHub Actions** (included)
- Uses workflow file `.github/workflows/repository-consistency-check.yml`

**Other CI/CD platforms:**
```bash
# Generic CI/CD script
npm install
node scripts/validate-consistency.js
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo "Validation failed"
  exit 1
fi
```

### Adding Notifications

#### Slack Integration

Add to GitHub Actions workflow:

```yaml
- name: Notify Slack
  if: failure()
  uses: slackapi/slack-github-action@v1.24.0
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "Repository consistency validation failed"
      }
```

#### Email Notifications

Add to GitHub Actions workflow:

```yaml
- name: Send email
  if: failure()
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 587
    username: ${{ secrets.EMAIL_USERNAME }}
    password: ${{ secrets.EMAIL_PASSWORD }}
    subject: Validation Failed
    body: file://validation-report.md
```

## Maintenance

### Regular Tasks

1. **Review validation rules monthly** - Ensure rules are still relevant
2. **Update expected values** - When deploying new contracts or changing configuration
3. **Check false positives** - Refine rules to reduce noise
4. **Update file paths** - When files are moved or renamed

### Updating the System

```bash
# Update validation logic
vim scripts/validate-consistency.js

# Update configuration
vim validation-config.json

# Test locally
node scripts/validate-consistency.js

# Commit and push
git add .
git commit -m "Update validation system"
git push
```

## Best Practices

1. **Keep validation-config.json up to date** - This is the single source of truth
2. **Run validation before committing** - Catch issues early
3. **Review validation reports** - Don't ignore warnings
4. **Update documentation** - When validation rules change
5. **Test locally first** - Before pushing to CI/CD

## Support

For issues or questions:
1. Check validation reports for detailed error messages
2. Review this README for configuration options
3. Check workflow logs in GitHub Actions
4. Open an issue with validation report attached

## License

This validation system is part of the GrowPod Empire project and follows the same license.
