# Branch Protection Rules Guide

This guide explains how to set up and configure branch protection rules for the GrowPod Empire repository to maintain code quality and prevent accidental changes to the `main` branch.

## Table of Contents

- [Why Branch Protection?](#why-branch-protection)
- [Setting Up Branch Protection](#setting-up-branch-protection)
- [Recommended Protection Rules](#recommended-protection-rules)
- [Managing Protection Rules](#managing-protection-rules)
- [Troubleshooting](#troubleshooting)

## Why Branch Protection?

Branch protection rules help ensure that:

- **No direct commits to `main`**: All changes go through pull requests
- **Code review is mandatory**: At least one reviewer must approve changes
- **CI checks pass**: Automated tests and builds must succeed
- **No force pushes**: Prevents rewriting history on protected branches
- **Merge conflicts are resolved**: Branches must be up to date before merging

## Setting Up Branch Protection

### Step 1: Navigate to Branch Protection Settings

1. Go to your repository on GitHub: `https://github.com/KudbeeZero/GrowPodEmpirev1.0`
2. Click on **Settings** tab
3. Click on **Branches** in the left sidebar
4. Under "Branch protection rules", click **Add rule** or **Add branch protection rule**

### Step 2: Configure the Branch Pattern

In the "Branch name pattern" field, enter:
```
main
```

This will apply the protection rules specifically to the `main` branch.

## Recommended Protection Rules

### Essential Rules (Minimum Protection)

These rules should **always** be enabled for the `main` branch:

#### ✅ Require a pull request before merging
- Prevents direct pushes to `main`
- Forces all changes to go through PR review process
- **Settings**:
  - ✅ Required approvals: `1` (at least one reviewer)
  - ✅ Dismiss stale pull request approvals when new commits are pushed
  - ⬜ Require review from Code Owners (optional, if you have CODEOWNERS file)

#### ✅ Require status checks to pass before merging
- Ensures CI/CD pipeline passes before merge
- **Settings**:
  - ✅ Require branches to be up to date before merging
  - Add these status checks (if they exist):
    - `deploy / Deploy to Cloudflare Workers` (from deploy-cloudflare.yml)
    - Any other CI checks you add

#### ✅ Require conversation resolution before merging
- Ensures all PR comments are addressed
- Prevents merging with unresolved discussions

#### ✅ Do not allow bypassing the above settings
- Applies rules to administrators too
- Recommended for consistency

### Advanced Rules (Enhanced Protection)

These rules provide additional safety but may require more workflow adjustments:

#### ⚠️ Require signed commits (Optional)
- Requires commits to be cryptographically signed
- Adds extra security layer
- **Note**: Requires developers to set up GPG keys

#### ⚠️ Require linear history (Optional)
- Prevents merge commits; only allows rebase or squash merges
- Keeps commit history clean
- **Note**: May conflict with some workflows

#### ⚠️ Require deployments to succeed before merging (Optional)
- Requires successful deployment to an environment
- Useful if you have staging environments

### Rules NOT Recommended

These rules might be too restrictive for the current workflow:

#### ❌ Lock branch
- Makes branch read-only
- Only use temporarily for emergency maintenance

#### ❌ Allow force pushes
- **Should remain DISABLED**
- Allowing force pushes defeats the purpose of protection

#### ❌ Allow deletions
- **Should remain DISABLED**
- Prevents accidental deletion of `main` branch

## Configuration Example

Here's a complete configuration for the `main` branch:

### Branch Protection Rule: `main`

```yaml
Branch name pattern: main

Protection Rules:
├─ Require a pull request before merging
│  ├─ Required approvals: 1
│  ├─ Dismiss stale pull request approvals: ✅
│  └─ Require review from Code Owners: ⬜
│
├─ Require status checks to pass before merging
│  ├─ Require branches to be up to date: ✅
│  └─ Status checks:
│     └─ deploy / Deploy to Cloudflare Workers
│
├─ Require conversation resolution: ✅
│
├─ Require signed commits: ⬜
│
├─ Require linear history: ⬜
│
├─ Do not allow bypassing settings: ✅
│
├─ Allow force pushes: ❌ (DISABLED)
│
└─ Allow deletions: ❌ (DISABLED)
```

## Managing Protection Rules

### Updating Existing Rules

1. Go to **Settings** → **Branches**
2. Find the rule for `main`
3. Click **Edit** button
4. Modify the settings as needed
5. Click **Save changes**

### Temporarily Bypassing Rules

If you need to bypass protection (emergency situations only):

**Option 1: Temporarily Disable Rule**
1. Edit the branch protection rule
2. Uncheck the rules you need to bypass
3. Make your changes
4. **Immediately re-enable the rules**

**Option 2: Use Administrator Override**
1. If "Do not allow bypassing" is disabled
2. Administrators can force merge
3. **Use with extreme caution**

### Creating Additional Protected Branches

You may want to protect other long-lived branches:

- `production` - For production-ready code
- `staging` - For pre-production testing
- `develop` - For development integration (if using GitFlow)

Follow the same steps but use different branch name patterns.

## Working with Protected Branches

### Standard Workflow

When `main` is protected, follow this workflow:

```bash
# 1. Create feature branch from main
git checkout main
git pull origin main
git checkout -b feature/my-feature

# 2. Make changes and commit
git add .
git commit -m "feat: add new feature"

# 3. Push to GitHub
git push origin feature/my-feature

# 4. Create Pull Request on GitHub
# - Base: main
# - Compare: feature/my-feature

# 5. Wait for:
# - CI checks to pass
# - Code review approval
# - All conversations resolved

# 6. Merge via GitHub UI
# (Merge button will only be enabled when all requirements are met)

# 7. Delete branch after merge
git push origin --delete feature/my-feature
```

### Handling Failed Status Checks

If CI checks fail:

1. Review the error in the GitHub Actions tab
2. Fix the issue in your branch
3. Commit and push the fix
4. CI will automatically re-run
5. Wait for green checkmarks before merging

### Handling Merge Conflicts

If your branch is out of date:

```bash
# Update your branch with latest main
git checkout main
git pull origin main
git checkout feature/my-feature
git merge main

# Resolve any conflicts
# Edit conflicting files
git add .
git commit -m "Merge main into feature branch"

# Push updated branch
git push origin feature/my-feature
```

## Troubleshooting

### Problem: "Cannot merge - required status checks not passing"

**Solution**:
- Check the Actions tab for failed workflows
- Fix the failing tests or builds
- Push the fixes to your branch

### Problem: "Cannot merge - branch is out of date"

**Solution**:
```bash
git checkout main
git pull origin main
git checkout feature/my-feature
git merge main
git push origin feature/my-feature
```

### Problem: "Cannot merge - requires 1 approval"

**Solution**:
- Request a review from a team member
- Wait for approval before merging
- Address any review comments

### Problem: "Cannot push to protected branch"

**Solution**:
- This is expected! You should not push directly to `main`
- Create a pull request instead
- Follow the standard workflow above

### Problem: "Need to make urgent hotfix"

**Solution**:
```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-fix

# Make the fix
git add .
git commit -m "hotfix: fix critical issue"

# Push and create PR
git push origin hotfix/critical-fix

# Get expedited review and merge
# Consider having a "hotfix" label for priority review
```

## Best Practices

### For Maintainers

1. **Review PRs promptly** to avoid blocking contributors
2. **Provide constructive feedback** in code reviews
3. **Keep protection rules documented** and up to date
4. **Regularly audit** branch protection settings
5. **Train new contributors** on the workflow

### For Contributors

1. **Always work in feature branches** - never directly in `main`
2. **Keep PRs small and focused** - easier to review
3. **Write clear PR descriptions** - explain what and why
4. **Respond to review feedback** promptly
5. **Keep your branch up to date** with `main`

### For AI Tool Users

1. **Prevent AI from pushing to `main`** directly
2. **Review AI-generated branches** before creating PRs
3. **Test AI changes locally** before pushing
4. **Consolidate AI work** into meaningful PRs
5. **Clean up unused AI branches** regularly

## Additional Resources

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Project contribution guidelines
- [README.md](./README.md) - Project overview and setup

## Quick Reference

| Action | Command | Notes |
|--------|---------|-------|
| Create feature branch | `git checkout -b feature/name` | Always from `main` |
| Push feature branch | `git push origin feature/name` | Ready for PR |
| Update branch with main | `git merge main` | From your feature branch |
| Delete local branch | `git branch -d feature/name` | After merge |
| Delete remote branch | `git push origin --delete feature/name` | Clean up |
| List protection rules | GitHub UI only | Settings → Branches |

---

**Remember**: Branch protection is a safety net, not a hindrance. It helps maintain code quality and prevents mistakes. Embrace the workflow! 🚀

**Last Updated**: 2026-02-02
