# Quick Fix: CI Deployment Failure

## 🔴 Problem
GitHub Actions failing at "Deploy to Cloudflare Workers" step with:
```
ERROR: CLOUDFLARE_API_TOKEN environment variable required
```

## ✅ Solution (2 Steps)

### 1. Get Your Cloudflare Credentials

**API Token:**
- Go to: https://dash.cloudflare.com/profile/api-tokens
- Click "Create Token"
- Use "Edit Cloudflare Workers" template
- Copy the token (save it!)

**Account ID:**
- Go to: https://dash.cloudflare.com/
- Find it in URL or sidebar under "Account ID"
- Or run: `npx wrangler whoami`

### 2. Add to GitHub

- Go to: https://github.com/KudbeeZero/GrowPodEmpirev1.0/settings/secrets/actions
- Click "New repository secret"
- Add these two secrets:

| Name | Value |
|------|-------|
| `CLOUDFLARE_API_TOKEN` | Your API token from step 1 |
| `CLOUDFLARE_ACCOUNT_ID` | Your Account ID from step 1 |

## 🚀 Test It

Push to main branch or manually trigger workflow:
```bash
git commit --allow-empty -m "Test CI after adding secrets"
git push origin main
```

Or: Actions → Deploy to Cloudflare Workers → Run workflow

## 📖 Need More Details?

See [CI_FAILURE_FIX.md](CI_FAILURE_FIX.md) for complete instructions and troubleshooting.
