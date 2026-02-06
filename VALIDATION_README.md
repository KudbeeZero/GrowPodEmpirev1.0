# Repository Consistency Monitoring System

> **Automated validation system for maintaining consistency across configuration files, documentation, and code.**

[![Status](https://img.shields.io/badge/status-production--ready-success)]()
[![Version](https://img.shields.io/badge/version-1.0.0-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

## 🎯 Overview

This system automatically validates and monitors consistency across the GrowPod Empire repository, ensuring that critical configuration values, token IDs, and documentation remain synchronized.

## ✨ Features

- 🔍 **Static Code Analysis** - Scans files for discrepancies using regex patterns
- 📋 **Dynamic Configuration** - All rules defined in JSON, easy to update
- 🤖 **Automated Checks** - Runs on PRs, commits, and daily schedule
- 📊 **Multiple Report Formats** - Console, JSON, Markdown, GitHub annotations
- 🔧 **Modular Design** - Reusable validation functions, easy to extend
- ⚡ **Fast Execution** - Completes in 1-2 seconds locally

## 🚀 Quick Start

### Run Validation

```bash
# Run full validation
npm run validate

# Run in silent mode
npm run validate:quiet

# View reports
cat validation-report.md
cat validation-report.json
```

### What Gets Validated

| Category | Details |
|----------|---------|
| **Admin Wallet** | TestNet admin wallet consistency across 10 files |
| **Token IDs** | $BUD (753910204), $TERP (753910205), $SLOT (753910206) |
| **App ID** | Smart contract application ID (753910199) |
| **Algorand Config** | Chain ID (416002), Network (TestNet), Algod server |
| **Cloudflare** | Account ID, Database ID, Database name |
| **Env Variables** | Documentation of 7 required environment variables |
| **Token Economy** | Supply values and cost consistency |

## 📚 Documentation

| Document | Purpose | Audience |
|----------|---------|----------|
| **[VALIDATION_SYSTEM.md](./VALIDATION_SYSTEM.md)** | Complete system documentation | All users |
| **[VALIDATION_QUICK_REFERENCE.md](./VALIDATION_QUICK_REFERENCE.md)** | Quick command reference | Daily users |
| **[VALIDATION_EXAMPLES.md](./VALIDATION_EXAMPLES.md)** | 12 practical usage examples | Developers |
| **[VALIDATION_CONFIG_SCHEMA.md](./VALIDATION_CONFIG_SCHEMA.md)** | Configuration schema reference | Advanced users |
| **[VALIDATION_IMPLEMENTATION_SUMMARY.md](./VALIDATION_IMPLEMENTATION_SUMMARY.md)** | Implementation overview | Maintainers |
| **[VALIDATION_FILE_STRUCTURE.md](./VALIDATION_FILE_STRUCTURE.md)** | Complete file structure | All users |

## 🏗️ System Architecture

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       v
┌─────────────────────────────┐
│  npm run validate           │
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│  validate-consistency.js    │
│  • Loads config             │
│  • Scans files              │
│  • Generates reports        │
└──────┬──────────────────────┘
       │
       ├────────────┬──────────┐
       v            v          v
  ┌────────┐  ┌────────┐  ┌────────┐
  │ Console│  │  JSON  │  │   MD   │
  │ Output │  │ Report │  │ Report │
  └────────┘  └────────┘  └────────┘
```

## 🔧 Core Components

### 1. Configuration (`validation-config.json`)
- Single source of truth for all validation rules
- JSON format, easy to edit
- 4.3 KB, version controlled

### 2. Static Analyzer (`scripts/validate-consistency.js`)
- Main validation engine
- Pattern matching and file scanning
- Report generation with built-in helper methods
- 17 KB, executable

### 3. GitHub Actions (`.github/workflows/repository-consistency-check.yml`)
- Automated CI/CD integration
- Runs on PRs, commits, daily schedule
- PR comments and status checks
- 5.9 KB

## 🎯 Usage Examples

### Daily Validation

```bash
# Before committing changes
npm run validate

# If errors found, fix them and re-run
vim problematic-file.ts
npm run validate
```

### After Deploying Contracts

```bash
# 1. Update token IDs in config
vim validation-config.json

# 2. Run validation to find all files to update
npm run validate

# 3. Update files listed in errors
# 4. Re-run validation
npm run validate  # Should pass now
```

### Pre-commit Hook

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
npm run validate:quiet || exit 1
```

## 📊 Output Formats

### Console (Colored)
- ✓ Green checkmarks for passing checks
- ✗ Red X for errors
- ⚠ Yellow warnings
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
- Error details with file paths
- Warning list
- Status badge

## 🤖 GitHub Actions Integration

### Automatic Triggers
- ✅ Every PR to main/production
- ✅ Every push to main/production
- ✅ Daily at midnight UTC
- ✅ Manual workflow dispatch

### Features
- PR comments with validation results
- Artifact uploads (reports)
- Inline file annotations
- Status checks for branch protection

## 🛠️ Extending the System

### Add a New Validation Rule

1. **Update config** (`validation-config.json`):
```json
{
  "validation_rules": {
    "my_new_rule": {
      "enabled": true,
      "expected_value": "some_value",
      "files_to_check": ["file1.ts", "file2.md"]
    }
  }
}
```

2. **Add validation logic** (`scripts/validate-consistency.js`):
```javascript
validateMyNewRule() {
  // Add validation logic here
}
```

3. **Test**:
```bash
npm run validate
```

## 📈 Performance

| Metric | Value |
|--------|-------|
| Local execution | 1-2 seconds |
| CI/CD execution | 15-20 seconds |
| Memory usage | Minimal (<50 MB) |
| CPU usage | Low (single-threaded) |
| Dependencies | None (Node.js built-ins only) |

## 🔒 Security

- ✅ No secrets in config file
- ✅ No network requests
- ✅ Read-only file operations
- ✅ Sandboxed execution in CI/CD
- ✅ Version controlled

## 🐛 Troubleshooting

### Validation Fails

1. Read the error message carefully
2. Check the file listed in the error
3. Add or update the expected value
4. Re-run validation

### False Positives

1. Check if the pattern is correct in `validation-config.json`
2. Verify the file actually needs the value
3. Update `files_to_check` if necessary

### Missing Files

Warnings are issued for missing files. Update the config to remove non-existent files from `files_to_check`.

## 📞 Support

- 📖 **Full Documentation**: [VALIDATION_SYSTEM.md](./VALIDATION_SYSTEM.md)
- 🚀 **Quick Start**: [VALIDATION_QUICK_REFERENCE.md](./VALIDATION_QUICK_REFERENCE.md)
- 💡 **Examples**: [VALIDATION_EXAMPLES.md](./VALIDATION_EXAMPLES.md)
- 🐛 **Issues**: [GitHub Issues](https://github.com/KudbeeZero/GrowPodEmpirev1.0/issues)

## 🤝 Contributing

When contributing to the validation system:

1. Test changes locally with `npm run validate`
2. Update relevant documentation
3. Add examples for new features
4. Ensure backward compatibility

## 📝 License

This validation system is part of the GrowPod Empire project and follows the same MIT license.

## 🎉 Credits

Implemented as part of the GrowPod Empire repository consistency initiative.

---

**Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Last Updated**: February 6, 2026
