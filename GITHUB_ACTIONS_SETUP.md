# GitHub Actions Setup for Cloudflare Workers

This guide explains how to configure GitHub repository secrets for automated Cloudflare Workers deployment.

## Required Secrets

To enable automated deployment via GitHub Actions, you need to configure two secrets in your GitHub repository:

### 1. CLOUDFLARE_API_TOKEN

This is your Cloudflare API token with permissions to deploy Workers.

**How to create:**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click on your profile icon → **My Profile** → **API Tokens**
3. Click **Create Token**
4. Use the **Edit Cloudflare Workers** template, or create a custom token with these permissions:
   - **Account Resources**:
     - Workers Scripts: Edit
     - Workers Routes: Edit
     - Workers KV: Edit (if using KV)
     - D1: Edit
   - **Account Settings**: Read
5. Click **Continue to summary** → **Create Token**
6. Copy the token (you won't be able to see it again!)

**Add to GitHub:**
1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `CLOUDFLARE_API_TOKEN`
5. Value: Paste your API token
6. Click **Add secret**

### 2. CLOUDFLARE_ACCOUNT_ID

This is your Cloudflare account ID.

**How to find:**

1. Run locally:
   ```bash
   npm run worker:whoami
   ```
   
2. Or find it in [Cloudflare Dashboard](https://dash.cloudflare.com/):
   - Select any site
   - Look in the URL: `https://dash.cloudflare.com/{account_id}/...`
   - Or check the right sidebar under "Account ID"

**Add to GitHub:**
1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `CLOUDFLARE_ACCOUNT_ID`
5. Value: Paste your account ID
6. Click **Add secret**

## Workflow Configuration

The workflow is already configured in `.github/workflows/deploy-cloudflare.yml`.

### Deployment Triggers

The workflow will automatically deploy when:
- You push to the `main` branch
- You push to the `production` branch
- You manually trigger it from GitHub Actions tab

### Manual Deployment

To manually trigger a deployment:

1. Go to your repository on GitHub
2. Click **Actions** tab
3. Select **Deploy to Cloudflare Workers** workflow
4. Click **Run workflow** button
5. Select the branch
6. Click **Run workflow**

## Workflow Status

After setup, you can monitor deployments:

1. Go to **Actions** tab in your repository
2. Click on any workflow run to see details
3. View logs for each step

## Environment Variables in GitHub Actions

If you need to pass additional build-time environment variables:

1. Add them as repository secrets (for sensitive values)
2. Or add them to the workflow file as environment variables:

```yaml
- name: Build application
  run: npm run build
  env:
    VITE_CUSTOM_VAR: ${{ secrets.CUSTOM_VAR }}
```

## Protecting Production

To add protection rules for the production branch:

1. Go to **Settings** → **Branches**
2. Add a branch protection rule for `production`
3. Enable:
   - Require pull request reviews before merging
   - Require status checks to pass before merging
   - Include administrators (optional)

## Troubleshooting

### "Authentication error" in workflow
- Verify `CLOUDFLARE_API_TOKEN` is set correctly
- Ensure the token hasn't expired
- Check token permissions include Workers Scripts and D1

### "Account not found"
- Verify `CLOUDFLARE_ACCOUNT_ID` is correct
- Ensure account ID matches the account where your D1 databases are

### Build failures
- Check the workflow logs in GitHub Actions
- Ensure the build passes locally: `npm run build`
- Verify all dependencies are in package.json (not just devDependencies)

## Security Best Practices

1. **Never commit secrets** to your repository
2. **Use minimum permissions** for API tokens
3. **Rotate tokens regularly** (e.g., every 90 days)
4. **Monitor deployments** via GitHub Actions logs
5. **Set up branch protection** for production branches

## Next Steps

After setting up GitHub Actions:

1. Test the deployment by pushing to main branch
2. Monitor the Actions tab for deployment status
3. Check Cloudflare Dashboard to verify the worker is deployed
4. Test your deployed application

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Cloudflare Workers GitHub Action](https://github.com/cloudflare/wrangler-action)
- [Managing GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
