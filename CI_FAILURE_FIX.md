# CI Failure Fix Guide

## Problem Summary

The GitHub Actions workflow "Deploy to Cloudflare Workers" is failing at step 7 with the following error:

```
✘ [ERROR] In a non-interactive environment, it's necessary to set a CLOUDFLARE_API_TOKEN environment variable for wrangler to work.
```

**Workflow Run**: https://github.com/KudbeeZero/GrowPodEmpirev1.0/actions/runs/21670855863/job/62478055136#step:7:1

## Root Cause

The GitHub repository is missing required secrets that the workflow needs to deploy to Cloudflare Workers:
- `CLOUDFLARE_API_TOKEN` - API token for authenticating with Cloudflare
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account identifier

## Solution

You need to add these secrets to your GitHub repository. Follow these steps:

### Step 1: Create Cloudflare API Token

1. **Log in to Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com/

2. **Navigate to API Tokens**
   - Click on your profile icon (top-right corner)
   - Select **My Profile**
   - Click on **API Tokens** in the left sidebar
   - Click **Create Token** button

3. **Configure Token Permissions**
   - Option A: Use the **Edit Cloudflare Workers** template (recommended)
   - Option B: Create custom token with these permissions:
     - **Account Resources**:
       - Workers Scripts: Edit
       - Workers Routes: Edit
       - Workers KV: Edit
       - D1: Edit
     - **Account Settings**: Read
   
4. **Create and Copy Token**
   - Click **Continue to summary**
   - Click **Create Token**
   - **IMPORTANT**: Copy the token immediately - you won't be able to see it again!

### Step 2: Get Your Cloudflare Account ID

**Option A: From Cloudflare Dashboard**
1. Go to https://dash.cloudflare.com/
2. Select any site/worker
3. Look in the URL: `https://dash.cloudflare.com/{YOUR_ACCOUNT_ID}/...`
4. Or check the right sidebar under "Account ID"

**Option B: Using Wrangler CLI Locally**
```bash
npx wrangler whoami
```

Copy your Account ID from the output.

### Step 3: Add Secrets to GitHub Repository

1. **Navigate to Repository Settings**
   - Go to https://github.com/KudbeeZero/GrowPodEmpirev1.0
   - Click on **Settings** tab
   - Go to **Secrets and variables** → **Actions** in the left sidebar

2. **Add CLOUDFLARE_API_TOKEN**
   - Click **New repository secret** button
   - Name: `CLOUDFLARE_API_TOKEN`
   - Value: Paste the API token you copied in Step 1
   - Click **Add secret**

3. **Add CLOUDFLARE_ACCOUNT_ID**
   - Click **New repository secret** button again
   - Name: `CLOUDFLARE_ACCOUNT_ID`
   - Value: Paste your Account ID from Step 2
   - Click **Add secret**

### Step 4: Verify Configuration

After adding the secrets, you should see them listed (values will be hidden):
- ✓ `CLOUDFLARE_API_TOKEN`
- ✓ `CLOUDFLARE_ACCOUNT_ID`

### Step 5: Trigger Deployment

**Option A: Push to main branch**
```bash
git commit --allow-empty -m "Trigger CI after adding secrets"
git push origin main
```

**Option B: Manual workflow trigger**
1. Go to https://github.com/KudbeeZero/GrowPodEmpirev1.0/actions
2. Select **Deploy to Cloudflare Workers** workflow
3. Click **Run workflow** button
4. Select `main` branch
5. Click **Run workflow**

### Step 6: Monitor Deployment

1. Go to **Actions** tab
2. Click on the new workflow run
3. Watch the deployment progress
4. Verify all steps complete successfully, including step 7 "Deploy to Cloudflare Workers"

## Expected Result

After adding the secrets, the workflow should:
1. ✅ Checkout repository
2. ✅ Setup Node.js
3. ✅ Install dependencies
4. ✅ Type check
5. ✅ Build application
6. ✅ Deploy to Cloudflare Workers (previously failing)

## Additional Configuration (Optional)

### Database Configuration

If you want full database functionality in your deployed worker, you may also need to set:

**Option A: Using Cloudflare D1 (SQLite)**
- Already configured in `wrangler.toml`
- No additional secrets needed
- Requires D1 databases to be created

**Option B: Using External PostgreSQL**
1. Get a Workers-compatible PostgreSQL connection string from:
   - [Neon](https://neon.tech) - Serverless PostgreSQL
   - [Supabase](https://supabase.com) - PostgreSQL with REST API
   - Cloudflare Hyperdrive
2. Add as repository secret:
   - Name: `DATABASE_URL`
   - Value: Your connection string

## Troubleshooting

### Issue: "Authentication error"
- **Cause**: Token is invalid or expired
- **Fix**: Create a new API token and update the secret

### Issue: "Account not found"
- **Cause**: Wrong Account ID
- **Fix**: Verify Account ID from Cloudflare Dashboard

### Issue: "Insufficient permissions"
- **Cause**: API token doesn't have required permissions
- **Fix**: Create new token with Workers Scripts, D1, and KV edit permissions

### Issue: Build still fails after adding secrets
- **Cause**: Workflow might be using cached values
- **Fix**: Try deleting and re-adding the secrets, then trigger deployment again

## Security Best Practices

1. ✅ **Never commit API tokens** to your repository
2. ✅ **Use minimum required permissions** when creating tokens
3. ✅ **Rotate tokens regularly** (every 90 days recommended)
4. ✅ **Monitor deployments** via GitHub Actions logs
5. ✅ **Enable branch protection** for production branches

## References

- [GitHub Actions Setup Guide](GITHUB_ACTIONS_SETUP.md)
- [Cloudflare Workers Deployment Guide](CLOUDFLARE_DEPLOYMENT.md)
- [Cloudflare API Token Documentation](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)
- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

## Summary

The fix requires just **2 simple steps**:
1. Create a Cloudflare API token with Workers permissions
2. Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as GitHub repository secrets

Once these secrets are configured, your CI/CD pipeline will automatically deploy to Cloudflare Workers on every push to the `main` or `production` branches.
