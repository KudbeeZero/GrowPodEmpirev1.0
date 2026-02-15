# Validation System - Usage Examples

This document provides practical examples of using the repository consistency monitoring system.

## Example 1: Daily Validation Check

Run before starting development work:

```bash
# Run full validation
npm run validate

# Expected output:
# ✓ Loaded validation config v1.0.0
# 
# Repository Consistency Validator v1.0.0
# 
# Validating Admin Wallet Address...
#   ✓ All files pass
# 
# Validating Token IDs...
#   ✓ All tokens consistent
# ...
```

## Example 2: After Deploying New Smart Contract

When you deploy a new contract with new token IDs:

**Step 1: Update the config**
```bash
vim validation-config.json
```

Update token IDs:
```json
{
  "validation_rules": {
    "token_ids": {
      "tokens": {
        "BUD": {
          "asset_id": "NEW_BUD_ID",  // <-- Update
          "app_id": "NEW_APP_ID",    // <-- Update
          ...
        }
      }
    }
  }
}
```

**Step 2: Run validation to find all files to update**
```bash
npm run validate
```

Output will show:
```
✗ 3 ERRORS FOUND

1. [token_ids] client/src/context/AlgorandContext.tsx
   BUD token ID NEW_BUD_ID not found

2. [token_ids] .dev.vars.example
   BUD token ID NEW_BUD_ID not found
...
```

**Step 3: Update all files listed**
```bash
# Update each file with new token IDs
vim client/src/context/AlgorandContext.tsx
vim .dev.vars.example
...
```

**Step 4: Verify all fixed**
```bash
npm run validate
# Should show: ✓ All validation checks passed!
```

## Example 3: Adding a New Configuration Value

Add validation for a new environment variable:

**Step 1: Add to validation config**
```json
{
  "validation_rules": {
    "environment_variables": {
      "required_vars": [
        "DATABASE_URL",
        "MY_NEW_VAR"  // <-- Add new variable
      ]
    }
  }
}
```

**Step 2: Run validation**
```bash
npm run validate
```

**Step 3: Update documentation files**
Based on validation output, add `MY_NEW_VAR` to:
- `.dev.vars.example`
- Documentation files
- Configuration examples

## Example 4: Pre-Commit Hook

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash

echo "Running repository consistency validation..."
npm run validate:quiet

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Validation failed! Run 'npm run validate' to see errors."
    echo ""
    exit 1
fi

echo "✅ Validation passed"
```

Make executable:
```bash
chmod +x .git/hooks/pre-commit
```

## Example 5: CI/CD Integration

The GitHub Actions workflow automatically runs on:

**Pull Requests:**
```yaml
# Automatically triggers on PR
on:
  pull_request:
    branches: [main, production]
```

**View results:**
1. Go to PR page
2. Click "Checks" tab
3. Find "Repository Consistency Check"
4. View logs and download artifacts

**Manual trigger:**
1. Go to Actions tab
2. Select "Repository Consistency Check"
3. Click "Run workflow"
4. Select branch
5. Click "Run workflow" button

## Example 6: Disabling Specific Checks

Temporarily disable a check:

```json
{
  "validation_rules": {
    "token_economy": {
      "enabled": false  // <-- Disable this check
    }
  }
}
```

Run validation:
```bash
npm run validate
# Will skip token_economy validation
```

## Example 7: Debugging Validation Failures

When validation fails:

**Step 1: Check the error**
```bash
npm run validate
```

Output:
```
✗ 1 ERROR FOUND

1. [admin_wallet] server/routes.ts
   Admin wallet address not found: BDBJF...
```

**Step 2: Check the file**
```bash
grep -n "ADMIN_WALLET" server/routes.ts
```

**Step 3: View full context**
```bash
cat validation-report.md
```

**Step 4: Fix the issue**
```bash
vim server/routes.ts
# Add the missing admin wallet reference
```

**Step 5: Verify fix**
```bash
npm run validate
# Should now pass
```

## Example 8: Batch Update After Config Change

Script to update multiple files:

```bash
#!/bin/bash
# update-token-ids.sh

OLD_BUD_ID="753910204"
NEW_BUD_ID="999999999"

FILES=(
  "client/src/context/AlgorandContext.tsx"
  ".dev.vars.example"
  ".github/copilot-instructions.md"
  "CLAUDE.md"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Updating $file..."
    sed -i "s/$OLD_BUD_ID/$NEW_BUD_ID/g" "$file"
  fi
done

echo "Running validation..."
npm run validate
```

## Example 9: Custom Validation Rule

Add a custom validation for database schema version:

**Step 1: Add config**
```json
{
  "validation_rules": {
    "database_schema": {
      "enabled": true,
      "version": "1.0.0",
      "files_to_check": [
        "shared/schema.ts",
        "drizzle.config.ts"
      ]
    }
  }
}
```

**Step 2: Add validation logic**
```javascript
// In scripts/validate-consistency.js

validateDatabaseSchema() {
  if (!this.config.validation_rules.database_schema.enabled) {
    return;
  }

  console.log(`\n${colors.cyan}Validating Database Schema...${colors.reset}`);
  const rule = this.config.validation_rules.database_schema;
  
  // Custom validation logic here
  // ...
}

// Add to run() method
run() {
  // ... existing validations
  this.validateDatabaseSchema();
  // ...
}
```

## Example 10: Viewing Validation History

**Via GitHub Actions:**
1. Go to Actions tab
2. Select "Repository Consistency Check"
3. View workflow runs history
4. Click on any run to view results
5. Download artifacts for detailed reports

**Via Git:**
```bash
# View validation reports from previous commits
git log --all --full-history -- validation-report.md

# Checkout old report
git show <commit>:validation-report.md
```

## Example 11: Integration with Code Review

Add validation check requirement:

**In `.github/workflows/repository-consistency-check.yml`:**
```yaml
- name: Set status check
  uses: actions/github-script@v7
  with:
    script: |
      await github.rest.repos.createCommitStatus({
        owner: context.repo.owner,
        repo: context.repo.repo,
        sha: context.sha,
        state: '${{ steps.validation.outputs.exit_code == 0 && "success" || "failure" }}',
        context: 'Repository Consistency',
        description: 'Validation ${{ steps.validation.outputs.exit_code == 0 && "passed" || "failed" }}'
      });
```

**In branch protection:**
- Add "Repository Consistency" as required status check

## Example 12: Notification on Failure

Add Slack notification:

```yaml
- name: Notify Slack on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "❌ Repository validation failed",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Repository Consistency Check Failed*\n\nBranch: `${{ github.ref }}`\nCommit: `${{ github.sha }}`"
            }
          }
        ]
      }
```

## Best Practices

1. **Run before committing**
   ```bash
   npm run validate && git commit
   ```

2. **Update config when deploying**
   - Deploy new contracts → Update IDs in config → Run validation

3. **Review warnings**
   - Warnings indicate potential issues
   - Don't ignore them without investigation

4. **Keep config updated**
   - When adding new files, add to `files_to_check`
   - When removing files, remove from config

5. **Use in CI/CD**
   - Let automation catch inconsistencies
   - Review PR validation results

6. **Document exceptions**
   - If a file doesn't need a value, document why
   - Update config to exclude it

## Troubleshooting Common Issues

### Issue: Too many false positives
**Solution:** Refine the regex pattern in config or adjust `files_to_check`

### Issue: Validation takes too long
**Solution:** Disable non-critical checks or reduce `files_to_check` scope

### Issue: Missing files warning
**Solution:** Update `files_to_check` to remove non-existent files

### Issue: Pattern not matching
**Solution:** Check if special characters need escaping in regex

### Issue: GitHub Actions failing
**Solution:** Check workflow logs, verify config syntax, ensure dependencies installed

## Getting Help

- 📖 Full documentation: `VALIDATION_SYSTEM.md`
- 🚀 Quick reference: `VALIDATION_QUICK_REFERENCE.md`
- 🐛 Report issues: GitHub Issues
- 💬 Questions: Open a discussion

## Advanced Topics

See `VALIDATION_SYSTEM.md` for:
- Creating custom validators
- Extending the validation library
- Integration with other tools
- Performance optimization
- Security considerations
