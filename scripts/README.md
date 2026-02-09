# GrowPod Empire - Scripts

This directory contains utility scripts for managing the GrowPod Empire repository, including deployment and branch management.

## Deployment Scripts

### `deploy-testnet.sh`
**Automated TestNet deployment script**

One-click script that deploys the smart contract to Algorand TestNet.

**Usage:**
```bash
./scripts/deploy-testnet.sh
```

**What it does:**
- Checks Python dependencies
- Compiles the PyTeal contract
- Deploys to Algorand TestNet
- Funds the contract address
- Bootstraps $BUD, $TERP, and Slot tokens
- Outputs environment variables

**Prerequisites:**
- Python 3.11+ with `py-algorand-sdk` and `pyteal`
- Admin wallet funded with 2+ TestNet ALGO
- Admin mnemonic configured

**See also:** `ADMIN_WALLET_DEPLOYMENT.md` for complete instructions

---

### `verify-deployment.py`
**Post-deployment verification tool**

Verifies that the smart contract is correctly deployed and configured.

**Usage:**
```bash
python scripts/verify-deployment.py <APP_ID>
```

**Example:**
```bash
python scripts/verify-deployment.py 755243944
```

**What it checks:**
- ✅ Contract exists on TestNet
- ✅ Owner matches expected admin wallet
- ✅ All tokens ($BUD, $TERP, Slot) created
- ✅ Token creators match admin wallet
- ✅ Global state configured correctly
- ✅ Schema matches expected values

**Output:**
- Contract verification status
- Token details and AlgoExplorer links
- Environment variables for configuration

**See also:** `POST_DEPLOYMENT_CHECKLIST.md` for full verification steps

---

## Branch Management Scripts

### cleanup-branches.sh

Identifies and cleans up stale branches to keep the repository organized.

**Usage:**
```bash
# Dry run - show what would be deleted
./scripts/cleanup-branches.sh

# Show branches older than 30 days
./scripts/cleanup-branches.sh --days 30

# Actually delete stale branches
./scripts/cleanup-branches.sh --delete

# Delete branches older than 30 days
./scripts/cleanup-branches.sh --days 30 --delete

# Show help
./scripts/cleanup-branches.sh --help
```

**Features:**
- Lists merged branches (safe to delete)
- Lists stale branches (older than threshold, not merged)
- Lists active branches
- Dry run mode by default
- Configurable stale threshold
- Color-coded output

**Categories:**
- **Merged branches**: Already merged to main, safe to delete
- **Stale branches**: Not merged, older than threshold
- **Active branches**: Recent activity, not merged yet

### ai-branch-report.sh

Generates a comprehensive report of all AI-generated branches.

**Usage:**
```bash
# Generate report
./scripts/ai-branch-report.sh
```

**Features:**
- Lists all Copilot branches (`copilot/*`)
- Lists all AI branches (`ai/*`)
- Lists all experimental branches (`experiment/*`)
- Shows merge status, age, and commit info
- Provides recommendations based on branch count
- Identifies branches older than 30 days
- Quick actions for common tasks

**Report includes:**
- Branch status (merged or not)
- Commits ahead of main
- Age since last commit
- Last commit author and message
- Recommendations for cleanup

## Examples

### Weekly Branch Cleanup

```bash
# 1. Generate AI branch report
./scripts/ai-branch-report.sh

# 2. Review the report and decide what to clean

# 3. Dry run cleanup to see what would be deleted
./scripts/cleanup-branches.sh

# 4. If satisfied, actually delete
./scripts/cleanup-branches.sh --delete
```

### Monthly Aggressive Cleanup

```bash
# Delete branches older than 30 days
./scripts/cleanup-branches.sh --days 30 --delete

# Review remaining AI branches
./scripts/ai-branch-report.sh
```

### Quick Status Check

```bash
# Just see the current state
./scripts/ai-branch-report.sh | head -20
```

## Scheduling

You can schedule these scripts to run automatically:

### Using cron (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Add weekly report (every Monday at 9 AM)
0 9 * * 1 cd /path/to/repo && ./scripts/ai-branch-report.sh

# Add monthly cleanup (first day of month at 2 AM)
0 2 1 * * cd /path/to/repo && ./scripts/cleanup-branches.sh --days 30 --delete
```

### Using GitHub Actions

Create `.github/workflows/branch-cleanup.yml`:

```yaml
name: Weekly Branch Cleanup

on:
  schedule:
    # Every Monday at 9:00 AM UTC
    - cron: '0 9 * * 1'
  workflow_dispatch:

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Generate AI Branch Report
        run: ./scripts/ai-branch-report.sh
      
      - name: Cleanup Stale Branches
        run: ./scripts/cleanup-branches.sh --delete
```

## Safety Features

Both scripts include safety measures:

1. **Dry Run Default**: `cleanup-branches.sh` defaults to dry run mode
2. **Protected Branches**: Never touches `main` or `production`
3. **Clear Output**: Color-coded, human-readable output
4. **Error Handling**: Graceful handling of edge cases
5. **Confirmation**: Clear indication of what will be deleted

## Customization

### Modify Stale Threshold

Edit the script or use the `--days` parameter to change what's considered "stale":

```bash
# Consider branches stale after 7 days
./scripts/cleanup-branches.sh --days 7

# Consider branches stale after 60 days
./scripts/cleanup-branches.sh --days 60
```

### Add Branch Patterns

To track additional branch patterns, edit `ai-branch-report.sh`:

```bash
# Add new pattern
if [[ "$branch_name" == mypattern/* ]]; then
  mypattern_branches+=("$branch")
fi
```

## Troubleshooting

### "Not in a git repository"

Make sure you're running the script from within the repository:

```bash
cd /path/to/GrowPodEmpirev1.0
./scripts/cleanup-branches.sh
```

### "Permission denied"

Make the scripts executable:

```bash
chmod +x scripts/*.sh
```

### "Command not found"

Use the relative path:

```bash
./scripts/cleanup-branches.sh
```

Or add to PATH:

```bash
export PATH="$PATH:$(pwd)/scripts"
cleanup-branches.sh
```

## Best Practices

1. **Run reports first**: Always check `ai-branch-report.sh` before cleanup
2. **Start with dry run**: Review what would be deleted
3. **Clean up regularly**: Weekly or bi-weekly cleanup prevents accumulation
4. **Document decisions**: If keeping old branches, add notes
5. **Test locally**: Try scripts locally before scheduling automation

## Related Documentation

### Deployment
- [ADMIN_WALLET_DEPLOYMENT.md](../ADMIN_WALLET_DEPLOYMENT.md) - Complete deployment guide
- [POST_DEPLOYMENT_CHECKLIST.md](../POST_DEPLOYMENT_CHECKLIST.md) - Verification checklist
- [ADMIN_WALLET_UPDATE_SUMMARY.md](../ADMIN_WALLET_UPDATE_SUMMARY.md) - Quick reference

### Branch Management
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Branch workflow guidelines
- [BRANCH_PROTECTION_GUIDE.md](../BRANCH_PROTECTION_GUIDE.md) - Protecting main branch
- [AI_WORKFLOW_GUIDE.md](../AI_WORKFLOW_GUIDE.md) - Working with AI tools

## Contributing

If you improve these scripts or add new ones:

1. Test thoroughly before committing
2. Update this README
3. Add error handling
4. Include help text (`--help`)
5. Use color-coded output for clarity

---

**Last Updated**: 2026-02-04

## Quick Links

### Deployment
- [ADMIN_WALLET_DEPLOYMENT.md](../ADMIN_WALLET_DEPLOYMENT.md) - Complete deployment guide
- [POST_DEPLOYMENT_CHECKLIST.md](../POST_DEPLOYMENT_CHECKLIST.md) - Verification checklist
- [ADMIN_WALLET_UPDATE_SUMMARY.md](../ADMIN_WALLET_UPDATE_SUMMARY.md) - Quick reference

### Branch Management
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Branch workflow guidelines
- [BRANCH_PROTECTION_GUIDE.md](../BRANCH_PROTECTION_GUIDE.md) - Protecting main branch
- [AI_WORKFLOW_GUIDE.md](../AI_WORKFLOW_GUIDE.md) - Working with AI tools
