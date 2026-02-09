# Repository Consistency Validation - Quick Reference

## Quick Commands

```bash
# Run full validation
npm run validate

# Run validation (silent mode)
npm run validate:quiet

# View last validation report
cat validation-report.md

# View JSON report
cat validation-report.json
```

## What Gets Validated

### 1. Admin Wallet Address ✅
- Ensures TestNet admin wallet is consistent across all files
- Expected: `HW6U3RKLOYEW2X2L4DERSJHBPG6G6UTKDWBSS2MKPZJOSAWKLP72NTIMNQ`

### 2. Token IDs ✅
- **$BUD**: 755243947
- **$TERP**: 755243948
- **$SLOT**: 755243949
- **App ID**: 755243944

### 3. Algorand Configuration ✅
- Chain ID: 416002
- Network: TestNet
- Algod Server: https://testnet-api.algonode.cloud

### 4. Cloudflare Configuration ✅
- Account ID
- Database ID
- Database Name

### 5. Environment Variables ✅
- All required env vars documented

### 6. Token Economy ✅
- Supply values
- Cost values

## Output Legend

- `✓` Green - Check passed
- `✗` Red - Error found (must fix)
- `⚠` Yellow - Warning (review recommended)
- `⊘` Gray - Check disabled

## Common Workflows

### Before Committing
```bash
npm run validate
# Fix any errors before committing
```

### After Updating Contracts
```bash
# 1. Update validation-config.json with new IDs
# 2. Run validation to find all files to update
npm run validate
# 3. Update all files listed in errors
# 4. Re-run validation
npm run validate
```

### Disabling Specific Checks
Edit `validation-config.json`:
```json
{
  "validation_rules": {
    "rule_name": {
      "enabled": false  // Disable this check
    }
  }
}
```

## GitHub Actions

### Automatic Runs
- ✅ Every PR to main/production
- ✅ Every push to main/production
- ✅ Daily at midnight UTC
- ✅ Manual trigger

### Viewing Results
1. Go to PR → Checks tab
2. Look for "Repository Consistency Check"
3. View inline annotations in Files Changed
4. Download artifacts for full reports

## Troubleshooting

### Validation Fails
1. Read error message
2. Check the file listed
3. Add/update the expected value
4. Re-run validation

### False Positives
1. Check if pattern is correct in config
2. Verify the file actually needs the value
3. Update `files_to_check` in config if needed

### Missing Files
Warnings are issued - update config to remove non-existent files.

## Configuration File

Location: `validation-config.json`

Structure:
```
validation-config.json
├── version
├── validation_rules
│   ├── admin_wallet
│   ├── token_ids
│   ├── algorand_config
│   ├── cloudflare_config
│   ├── environment_variables
│   └── token_economy
├── alerting
└── exclusions
```

## Full Documentation

See `VALIDATION_SYSTEM.md` for:
- Detailed rule descriptions
- How to add new rules
- Extension guide
- Integration options
- Best practices

## Support

- 📖 Full docs: `VALIDATION_SYSTEM.md`
- 🐛 Issues: Check validation reports
- 💬 Questions: Open GitHub issue
