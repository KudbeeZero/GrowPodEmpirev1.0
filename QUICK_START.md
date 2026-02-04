# Quick Start Guide - Repository Management

## For New Contributors

### 1. Read the Documentation
```bash
# Start here
cat CONTRIBUTING.md

# Or view on GitHub
# https://github.com/KudbeeZero/GrowPodEmpirev1.0/blob/main/CONTRIBUTING.md
```

### 2. Create Your Feature Branch
```bash
# Update main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name
```

### 3. Make Your Changes
```bash
# Work on your feature
# Make commits
git add .
git commit -m "feat: add awesome feature"
```

### 4. Submit Pull Request
```bash
# Push your branch
git push origin feature/your-feature-name

# Go to GitHub and create PR
# The PR validation workflow will run automatically
```

## For Maintainers

### Initial Setup
```bash
# 1. Set up branch protection (one-time)
# Follow: BRANCH_PROTECTION_GUIDE.md
# GitHub > Settings > Branches > Add rule

# 2. Run initial branch analysis
./scripts/ai-branch-report.sh

# 3. Clean up any stale branches
./scripts/cleanup-branches.sh
./scripts/cleanup-branches.sh --delete  # if ready
```

### Weekly Maintenance
```bash
# Monday morning routine:

# 1. Check AI branch status
./scripts/ai-branch-report.sh

# 2. Review what would be cleaned
./scripts/cleanup-branches.sh

# 3. Clean up if needed
./scripts/cleanup-branches.sh --delete
```

## For AI Tool Users (Copilot, etc.)

### Working with AI Tools
```bash
# 1. Read AI-specific guidelines
cat AI_WORKFLOW_GUIDE.md

# 2. Use proper branch naming
git checkout -b copilot/your-feature
# or
git checkout -b ai/your-feature

# 3. Review AI suggestions carefully
# - Check for security issues
# - Verify project patterns
# - Test thoroughly

# 4. Submit for review
git push origin copilot/your-feature
# Create PR - will be flagged for extra scrutiny
```

### Monitoring Your AI Branches
```bash
# See all your AI branches
./scripts/ai-branch-report.sh

# Clean up after merging
git push origin --delete copilot/old-feature
```

## Common Commands

### Branch Management
```bash
# List all branches
git branch -a

# Delete local branch
git branch -d feature/done

# Delete remote branch
git push origin --delete feature/done

# Prune stale references
git fetch --prune
```

### Using the Scripts
```bash
# AI branch report
./scripts/ai-branch-report.sh

# Branch cleanup (dry run)
./scripts/cleanup-branches.sh

# Branch cleanup (delete)
./scripts/cleanup-branches.sh --delete

# Custom stale threshold
./scripts/cleanup-branches.sh --days 30

# Help
./scripts/cleanup-branches.sh --help
```

### Build and Test
```bash
# Type check
npm run check

# Build
npm run build

# Development server
npm run dev
```

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     MAIN BRANCH                         │
│              (Single Source of Truth)                   │
└────────────┬────────────────────────────────────────────┘
             │
             ├─── feature/new-feature ──┐
             │                          │
             ├─── fix/bug-fix ─────────┤
             │                          │
             ├─── copilot/ai-work ─────┤
             │                          │
             └─── experiment/test ─────┘
                                        │
                                        │ PR Review
                                        │ CI Checks Pass
                                        │ Code Review
                                        │
                                        ▼
             ┌──────────────────────────────┐
             │    Merge to MAIN             │
             │    Delete Feature Branch     │
             └──────────────────────────────┘
```

## Decision Tree

### Should I Create a Branch?
```
Need to make changes?
├─ YES → Create feature branch from main
│        ├─ New feature? → feature/name
│        ├─ Bug fix? → fix/name
│        ├─ Urgent? → hotfix/name
│        ├─ AI work? → copilot/name
│        └─ Testing? → experiment/name
└─ NO → Stay on main (read-only)
```

### Should I Clean Up a Branch?
```
Check branch status:
├─ Merged to main? → DELETE IT
├─ Stale (>14 days)? → Review then DELETE
├─ Active work? → KEEP IT
└─ Experiment? → DELETE after learning
```

## Emergency Procedures

### Broke the Build?
```bash
# 1. Create fix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/fix-build

# 2. Fix the issue
# 3. Test locally
npm run build

# 4. Push and create urgent PR
git push origin hotfix/fix-build
```

### Accidentally Committed to Main?
```bash
# If not pushed yet:
git reset --soft HEAD~1  # Undo commit, keep changes
git checkout -b fix/proper-branch
git commit -m "feat: proper commit on branch"

# If already pushed:
# Contact maintainer - may need to revert
```

### Lost in Branches?
```bash
# Get your bearings
git status
git branch
./scripts/ai-branch-report.sh

# Return to safety
git checkout main
git pull origin main
```

## Getting Help

| Question | Resource |
|----------|----------|
| How to contribute? | [CONTRIBUTING.md](./CONTRIBUTING.md) |
| How to protect branches? | [BRANCH_PROTECTION_GUIDE.md](./BRANCH_PROTECTION_GUIDE.md) |
| How to use AI tools? | [AI_WORKFLOW_GUIDE.md](./AI_WORKFLOW_GUIDE.md) |
| What changed? | [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) |
| Script usage? | [scripts/README.md](./scripts/README.md) |
| General dev help? | [CLAUDE.md](./CLAUDE.md) |

## Quick Reference

| Action | Command |
|--------|---------|
| Create branch | `git checkout -b feature/name` |
| Push branch | `git push origin feature/name` |
| Update from main | `git merge main` |
| Delete local | `git branch -d feature/name` |
| Delete remote | `git push origin --delete feature/name` |
| Check status | `git status` |
| View branches | `git branch -a` |
| AI report | `./scripts/ai-branch-report.sh` |
| Cleanup | `./scripts/cleanup-branches.sh --delete` |

---

**Remember**: When in doubt, check CONTRIBUTING.md or ask for help!

**Last Updated**: 2026-02-02
