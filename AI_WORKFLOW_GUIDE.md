# AI Tools Workflow Guide

This guide provides best practices and workflows for using AI-powered development tools (like GitHub Copilot, Copilot Workspace, ChatGPT, Claude, etc.) with the GrowPod Empire repository while maintaining code quality and repository organization.

## Table of Contents

- [Overview](#overview)
- [General Principles](#general-principles)
- [GitHub Copilot Integration](#github-copilot-integration)
- [Branch Management for AI Work](#branch-management-for-ai-work)
- [Code Review for AI-Generated Code](#code-review-for-ai-generated-code)
- [Consolidating AI Work](#consolidating-ai-work)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

AI development tools can significantly boost productivity, but they require careful management to avoid:
- Unorganized branch proliferation
- Unconsolidated or scattered changes
- Merging untested or low-quality code
- Repository clutter

This guide helps you work effectively with AI while maintaining a clean, organized repository centered around the `main` branch.

## General Principles

### 1. Human in the Loop
**Always review and validate AI-generated code before committing.**

- AI suggestions are starting points, not final solutions
- Test thoroughly before accepting changes
- Verify against project standards and patterns
- Check for security implications

### 2. Main Branch as Source of Truth
**All AI work should ultimately merge back to `main`.**

- Create AI feature branches from latest `main`
- Merge completed work back to `main` via PR
- Delete AI branches after successful merge
- Don't let AI branches accumulate or diverge

### 3. Controlled Experimentation
**Use clearly marked branches for AI experiments.**

- Use `experiment/` prefix for AI trials
- Set expiration dates for experimental branches
- Clean up experiments regularly
- Document outcomes before deletion

## GitHub Copilot Integration

### Copilot Chat and Inline Suggestions

When using Copilot for code suggestions:

#### ✅ Good Practices

```typescript
// 1. Accept inline suggestions for boilerplate
const handleSubmit = async () => {
  // Let Copilot suggest the implementation
}

// 2. Use Copilot Chat to explore approaches
// Q: "How should I handle this blockchain transaction error?"
// Review suggested approach, then implement manually

// 3. Use Copilot for documentation
/**
 * Harvests the plant and mints $BUD tokens
 * @param {number} podId - The pod to harvest (1 or 2)
 * @returns {Promise<string | null>} Transaction ID or null
 */
```

#### ❌ Avoid

```typescript
// Don't blindly accept complex logic
const calculateYield = (water, nutrients, genetics) => {
  // [Large AI-generated function with unclear logic]
  // Always review and understand complex calculations
}

// Don't let Copilot override project patterns
// If project uses TanStack Query, don't accept fetch() suggestions
```

### Copilot Workspace

When using Copilot Workspace for larger changes:

#### Configuration

1. **Set branch preferences**:
   - Default branch: `main`
   - Create branches with prefix: `copilot/`
   - Example: `copilot/fix-harvest-calculation`

2. **Prevent auto-merge**:
   - Always require manual PR review
   - Don't allow direct pushes to `main`
   - Require status checks to pass

#### Workflow

```bash
# 1. Copilot creates branch: copilot/add-new-feature
# 2. Review the changes in GitHub
# 3. Clone locally for testing

git fetch origin
git checkout copilot/add-new-feature

# 4. Test thoroughly
npm run dev
npm run build
npm run check

# 5. If good, create PR to main
# 6. After merge, delete the branch

git push origin --delete copilot/add-new-feature
```

## Branch Management for AI Work

### Naming Conventions

Use clear, descriptive names that indicate AI involvement:

```bash
# Feature work by AI
copilot/add-breeding-mechanic
ai/implement-terpene-rewards

# Bug fixes by AI  
copilot/fix-wallet-connection
ai/fix-harvest-calculation

# Experiments
experiment/ai-test-new-algorithm
experiment/copilot-refactor-hooks
```

### Branch Lifecycle Management

#### Create from Latest Main

```bash
# Always start from latest main
git checkout main
git pull origin main

# Let AI tool create branch, or create manually
git checkout -b copilot/new-feature
```

#### Regular Sync with Main

```bash
# Keep AI branches up to date
git checkout main
git pull origin main
git checkout copilot/new-feature
git merge main

# Resolve conflicts if any
git push origin copilot/new-feature
```

#### Quick Merge and Delete

```bash
# After PR is merged
git checkout main
git pull origin main

# Delete local branch
git branch -d copilot/new-feature

# Delete remote branch
git push origin --delete copilot/new-feature
```

### Preventing Branch Sprawl

Set up a cleanup schedule:

```bash
# Weekly: Review all branches
git branch -a

# Identify old AI branches (older than 2 weeks)
for branch in $(git branch -r | grep -E 'copilot|ai'); do
  echo "$branch: $(git log -1 --format=%cd $branch)"
done

# Delete inactive branches
git push origin --delete copilot/old-experiment
```

## Code Review for AI-Generated Code

### What to Check

#### 1. Security Review

```typescript
// ❌ AI might suggest insecure patterns
const apiKey = "hardcoded-key"; // NEVER do this

// ✅ Verify environment variables are used
const apiKey = import.meta.env.VITE_API_KEY;
```

#### 2. Type Safety

```typescript
// ❌ AI might use 'any' types
function process(data: any) { }

// ✅ Ensure proper typing
function process(data: PodData) { }
```

#### 3. Project Patterns

```typescript
// ❌ AI might not follow project patterns
fetch('/api/users')

// ✅ Use established patterns (TanStack Query)
useQuery({ queryKey: ['users'], queryFn: fetchUsers })
```

#### 4. Error Handling

```typescript
// ❌ AI might miss error cases
const result = await transaction();

// ✅ Add proper error handling
try {
  const result = await transaction();
  toast.success("Transaction complete");
} catch (error) {
  toast.error("Transaction failed");
  console.error(error);
}
```

### Review Checklist

Before merging AI-generated code:

- [ ] Code follows project patterns and conventions
- [ ] No hardcoded secrets or credentials
- [ ] Proper TypeScript types (no unnecessary `any`)
- [ ] Error handling is comprehensive
- [ ] No unnecessary dependencies added
- [ ] Code is tested and working
- [ ] Comments are helpful and accurate
- [ ] No breaking changes to existing functionality
- [ ] Performance is acceptable
- [ ] Security implications considered

## Consolidating AI Work

### Scenario: Multiple AI Branches

If you have several AI-generated branches with related work:

```bash
# List all AI branches
git branch -r | grep -E 'copilot|ai'

# Example output:
# origin/copilot/feature-a
# origin/copilot/feature-b
# origin/copilot/fix-related-issue

# Strategy 1: Cherry-pick useful commits
git checkout main
git checkout -b consolidated-work
git cherry-pick <commit-hash-from-feature-a>
git cherry-pick <commit-hash-from-feature-b>

# Strategy 2: Merge related branches sequentially
git checkout -b consolidated-work main
git merge --no-ff copilot/feature-a
git merge --no-ff copilot/feature-b

# Clean up after consolidation
git push origin --delete copilot/feature-a
git push origin --delete copilot/feature-b
```

### Scenario: Scattered Changes

If AI work is scattered across issues and PRs:

1. **Create a tracking issue**
   - List all related AI work
   - Create checkboxes for each piece
   - Link all related PRs

2. **Consolidate incrementally**
   - Merge smallest, most valuable pieces first
   - Test after each merge
   - Build up to larger changes

3. **Update documentation**
   - Keep README.md current
   - Update CLAUDE.md with new patterns
   - Document architectural decisions

## Best Practices

### 1. Limit AI Branch Count

**Goal**: Never have more than 5 active AI branches at once.

```bash
# Check current count
git branch -r | grep -E 'copilot|ai' | wc -l

# If over 5, consolidate or clean up
```

### 2. Use Descriptive Commit Messages

```bash
# ❌ Poor commit message
git commit -m "AI changes"

# ✅ Good commit message
git commit -m "feat: add terpene discovery mechanic (Copilot-assisted)"
```

### 3. Test AI Changes Locally

```bash
# Always test before pushing
npm run check      # Type checking
npm run build      # Build verification
npm run dev        # Manual testing

# Then push with confidence
git push origin copilot/new-feature
```

### 4. Document AI Assistance

When AI helps with complex logic, add comments:

```typescript
/**
 * Calculate harvest yield based on care quality
 * Formula derived with AI assistance and validated against game requirements
 * Base: 0.25g, Water bonus: +0.02g per water, Nutrient bonus: +0.05g per nutrient
 */
const calculateYield = (waterCount: number, nutrientCount: number) => {
  const base = 0.25;
  const waterBonus = waterCount * 0.02;
  const nutrientBonus = nutrientCount * 0.05;
  return (base + waterBonus + nutrientBonus) * 1_000_000; // Convert to 6 decimals
};
```

### 5. Regular AI Branch Audits

Schedule weekly reviews:

```bash
# Create a cleanup script (see scripts/cleanup-branches.sh)
# Run weekly
./scripts/cleanup-branches.sh

# Or manually review
git branch -a --sort=-committerdate | head -20
```

## Troubleshooting

### Problem: Too Many AI Branches

**Solution**: Aggressive cleanup

```bash
# Find all AI branches older than 2 weeks
for branch in $(git branch -r | grep -E 'copilot|ai'); do
  last_commit=$(git log -1 --format=%ct "$branch")
  now=$(date +%s)
  days=$(( ($now - $last_commit) / 86400 ))
  if [ $days -gt 14 ]; then
    echo "Stale: $branch ($days days old)"
    # git push origin --delete ${branch#origin/}
  fi
done
```

### Problem: Conflicting AI Changes

**Solution**: Sequential integration

```bash
# Don't merge multiple AI branches simultaneously
# Instead, merge one at a time:

git checkout main
git merge copilot/feature-a  # Merge first
git push origin main

git merge copilot/feature-b  # Merge second
# Resolve conflicts here
git push origin main
```

### Problem: AI Generated Bad Code

**Solution**: Don't be afraid to reject

```bash
# If AI code is problematic:
# 1. Close the PR without merging
# 2. Delete the branch
git push origin --delete copilot/bad-implementation

# 3. Create a new branch and implement correctly
git checkout -b fix/proper-implementation main
```

### Problem: Lost Track of Changes

**Solution**: Use GitHub Projects

1. Create a project board for "AI-Assisted Work"
2. Add columns: "Proposed", "In Review", "Testing", "Done"
3. Link all AI PRs to the board
4. Move cards as work progresses

## Tools and Scripts

### Branch Cleanup Script

Create `scripts/cleanup-branches.sh`:

```bash
#!/bin/bash
# See scripts/cleanup-branches.sh for the full script
```

### AI Branch Report Script

Create `scripts/ai-branch-report.sh`:

```bash
#!/bin/bash
# See scripts/ai-branch-report.sh for the full script
```

## Integration with CI/CD

Ensure AI-generated PRs go through the same validation:

```yaml
# .github/workflows/pr-validation.yml
name: PR Validation

on:
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run check
      - run: npm run build
      
      # Add a check for AI-generated PRs
      - name: AI PR Warning
        if: contains(github.head_ref, 'copilot') || contains(github.head_ref, 'ai')
        run: echo "::warning::This PR contains AI-generated code. Extra scrutiny required."
```

## Summary

**Key Takeaways**:

1. ✅ Always review AI-generated code
2. ✅ Test thoroughly before merging
3. ✅ Keep AI branches short-lived
4. ✅ Merge back to `main` regularly
5. ✅ Clean up branches aggressively
6. ✅ Follow project patterns and standards
7. ✅ Use PR process for all AI work
8. ✅ Document AI assistance when helpful

AI tools are powerful assistants, but **you** are the architect. Use AI to boost productivity while maintaining quality and organization.

---

**Related Documentation**:
- [CONTRIBUTING.md](./CONTRIBUTING.md) - General contribution guidelines
- [BRANCH_PROTECTION_GUIDE.md](./BRANCH_PROTECTION_GUIDE.md) - Branch protection setup
- [README.md](./README.md) - Project overview

**Last Updated**: 2026-02-02
