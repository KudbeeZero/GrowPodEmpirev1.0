# Contributing to GrowPod Empire

Thank you for your interest in contributing to GrowPod Empire! This document provides guidelines for contributing to the project and maintaining a clean, organized repository structure.

## Table of Contents

- [Branching Strategy](#branching-strategy)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Branch Management](#branch-management)
- [AI Tools Integration](#ai-tools-integration)
- [Code Standards](#code-standards)

## Branching Strategy

### Main Branch: Single Source of Truth

The `main` branch is the **single source of truth** for the GrowPod Empire project. All production-ready code resides here, and all development should eventually merge back into `main`.

### Branch Types

We use the following branch naming conventions:

- **Feature Branches**: `feature/<feature-name>` or `copilot/<feature-name>`
  - For new features or enhancements
  - Example: `feature/new-breeding-mechanic`
  
- **Bug Fix Branches**: `fix/<bug-description>` or `copilot/fix-<issue>`
  - For bug fixes and corrections
  - Example: `fix/harvest-calculation-error`
  
- **Hotfix Branches**: `hotfix/<critical-fix>`
  - For urgent production fixes
  - Example: `hotfix/security-vulnerability`
  
- **Experimental Branches**: `experiment/<experiment-name>`
  - For experimental features or research
  - Should be clearly marked and cleaned up regularly

### Branch Lifecycle

1. **Create**: Always create new branches from an up-to-date `main`
2. **Develop**: Make your changes in the feature branch
3. **Review**: Submit a pull request for review
4. **Merge**: Merge back into `main` after approval
5. **Delete**: Delete the branch after successful merge

## Development Workflow

### 1. Starting New Work

Always start from the latest `main` branch:

```bash
# Make sure you're on main
git checkout main

# Pull the latest changes
git pull origin main

# Create your feature branch
git checkout -b feature/your-feature-name
```

### 2. Making Changes

Follow these steps when making changes:

1. **Make small, focused commits**
   ```bash
   git add <files>
   git commit -m "Clear, descriptive commit message"
   ```

2. **Keep your branch up to date**
   ```bash
   git checkout main
   git pull origin main
   git checkout feature/your-feature-name
   git merge main
   ```

3. **Run validation checks**
   ```bash
   npm run check    # Type checking
   npm run build    # Build verification
   npm run dev      # Manual testing
   ```

### 3. Before Submitting a Pull Request

- [ ] Code builds successfully (`npm run build`)
- [ ] Type checking passes or expected errors are documented (`npm run check`)
- [ ] Changes have been manually tested
- [ ] Commit messages are clear and descriptive
- [ ] Branch is up to date with `main`
- [ ] No unnecessary files are included (check `.gitignore`)

## Pull Request Process

### Creating a Pull Request

1. **Push your branch to GitHub**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create the PR on GitHub**
   - Base branch: `main`
   - Compare branch: your feature branch
   - Fill out the PR template with:
     - Clear description of changes
     - Related issues or tickets
     - Testing performed
     - Screenshots (if UI changes)

3. **PR Review Requirements**
   - All CI checks must pass
   - Code review by at least one maintainer
   - No merge conflicts with `main`
   - Documentation updated if needed

### After Merge

Once your PR is merged:

1. **Delete your feature branch**
   ```bash
   # Delete local branch
   git branch -d feature/your-feature-name
   
   # Delete remote branch
   git push origin --delete feature/your-feature-name
   ```

2. **Update your local main**
   ```bash
   git checkout main
   git pull origin main
   ```

## Branch Management

### Regular Branch Cleanup

To keep the repository organized, regularly review and clean up branches:

#### List All Branches
```bash
# List local branches
git branch

# List remote branches
git branch -r

# List all branches with last commit info
git branch -a -v
```

#### Delete Merged Branches
```bash
# Delete local branch (safe - only deletes if merged)
git branch -d branch-name

# Force delete local branch (use with caution)
git branch -D branch-name

# Delete remote branch
git push origin --delete branch-name
```

#### Prune Stale References
```bash
# Remove references to deleted remote branches
git fetch --prune

# Or
git remote prune origin
```

### Finding Stale Branches

Identify branches that haven't been updated recently:

```bash
# Show branches and their last commit date
for branch in $(git branch -r | grep -v HEAD); do
  echo -e "$(git show --format="%ci %cr" $branch | head -n 1) \t$branch"
done | sort -r
```

## AI Tools Integration

### Working with GitHub Copilot and AI Assistants

When using AI tools (GitHub Copilot, Copilot Workspace, etc.):

#### 1. Control Branch Creation

- **Always review** before allowing AI to create new branches
- **Manually confirm** branch names follow the project conventions
- **Prevent automatic branching** in AI tool settings when possible

#### 2. Review AI-Generated Code

- **Never blindly accept** AI suggestions
- **Test thoroughly** before committing
- **Ensure consistency** with existing codebase patterns
- **Check for security issues** in AI-generated code

#### 3. Managing AI-Generated Branches

If AI tools create unwanted branches:

```bash
# Review all branches
git branch -a

# Delete unwanted AI branches locally
git branch -D copilot/unwanted-feature

# Delete from remote
git push origin --delete copilot/unwanted-feature
```

#### 4. Consolidating AI Work

If AI work is scattered across multiple branches:

```bash
# Cherry-pick specific commits from AI branches
git checkout main
git checkout -b feature/consolidated-work
git cherry-pick <commit-hash>

# Or merge specific branches
git merge --no-ff feature/ai-branch-1
```

## Code Standards

### TypeScript and Code Quality

- Follow existing code patterns in the repository
- Use TypeScript path aliases (`@/`, `@shared/`)
- Maintain type safety (14 known type errors are acceptable)
- Use shadcn/ui components for UI consistency

### Commit Message Format

Use clear, descriptive commit messages:

```
<type>: <short description>

<optional longer description>

<optional footer>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
```
feat: add terpene discovery mechanic to harvest
fix: correct $BUD calculation for nutrient bonuses
docs: update README with new deployment steps
```

### File Organization

- Keep components in `client/src/components/`
- Keep pages in `client/src/pages/`
- Keep hooks in `client/src/hooks/`
- Use `shared/` for code shared between client and server
- Never commit `node_modules/`, `dist/`, or `.env` files

## Getting Help

### Questions and Discussions

- **GitHub Issues**: Report bugs or request features
- **Pull Request Comments**: Discuss specific code changes
- **Documentation**: Check `README.md`, `CLAUDE.md`, and related docs

### Resources

- [README.md](./README.md) - Project overview
- [CLAUDE.md](./CLAUDE.md) - Development guide
- [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md) - Deployment guide
- [BRANCH_PROTECTION_GUIDE.md](./BRANCH_PROTECTION_GUIDE.md) - Branch protection setup

## Review and Maintenance

This contributing guide should be reviewed and updated regularly to ensure it remains relevant and helpful for all contributors.

**Last Updated**: 2026-02-02
