# 📋 Cloudflare Workers Deployment Checklist

Use this checklist to complete your Cloudflare Workers deployment setup.

## ✅ Completed Pre-Deployment Steps

### ✅ 1. Cloudflare Account ID - CONFIGURED
- [x] Account ID obtained: `b591c2e07ca352d33076f4d2f8414b89`
- [x] Updated in `wrangler.toml`

### ✅ 2. D1 Database ID - CONFIGURED
- [x] D1 Database ID obtained: `712d926f-c396-473f-96d9-f0dfc3d1d069`
- [x] Updated in `wrangler.toml`
- [x] Binding name: `DB` (accessible via `env.DB` in code)

### ✅ 3. Domain Code ID - DOCUMENTED
- [x] Domain Code ID: `85a5b265570a47e66762a07932ce8aa8`
- [x] Documented in `wrangler.toml` for reference

## ⚠️ Required Next Steps

### 4. Set Up Secrets

- [ ] Configure DATABASE_URL:
  ```bash
  npx wrangler secret put DATABASE_URL
  ```
  Enter your PostgreSQL connection string when prompted

- [ ] (Optional) Configure admin wallet for TestNet:
  ```bash
  npx wrangler secret put ADMIN_WALLET_ADDRESS
  # Enter: HW6U3RKLOYEW2X2L4DERSJHBPG6G6UTKDWBSS2MKPZJOSAWKLP72NTIMNQ
  ```

### 5. Local Development Setup

- [ ] Create local environment file:
  ```bash
  cp .dev.vars.example .dev.vars
  ```
- [ ] Edit `.dev.vars` with your local development values
- [ ] Ensure `.dev.vars` is git-ignored (already configured)

## 🚀 Deployment Checklist

### 6. Test Build Locally

- [ ] Install dependencies (if not already done):
  ```bash
  npm install
  ```
- [ ] Run type check:
  ```bash
  npm run check
  ```
- [ ] Build the application:
  ```bash
  npm run build
  ```
- [ ] Verify `dist/index.cjs` was created

### 7. Test Locally with Wrangler

- [ ] Start local development server:
  ```bash
  npm run worker:dev
  ```
- [ ] Test your application at the provided URL
- [ ] Stop the server (Ctrl+C) when done

### 8. Deploy to Cloudflare Workers

- [ ] Deploy to production:
  ```bash
  npm run worker:deploy
  ```
- [ ] Note the deployed URL
- [ ] Test the deployed application

### 9. Monitor Your Deployment

- [ ] View real-time logs:
  ```bash
  npm run worker:tail
  ```
- [ ] Check Cloudflare Dashboard: https://dash.cloudflare.com/
- [ ] Verify worker is running and healthy

## 🔄 GitHub Actions Setup (Optional)

### 10. Configure GitHub Secrets

For automated deployment on every push:

- [ ] Go to your GitHub repository settings
- [ ] Navigate to **Settings** → **Secrets and variables** → **Actions**
- [ ] Add `CLOUDFLARE_API_TOKEN`:
  - Get token from: https://dash.cloudflare.com/profile/api-tokens
  - Use "Edit Cloudflare Workers" template
  - Add as repository secret
- [ ] Add `CLOUDFLARE_ACCOUNT_ID`:
  - Use: `b591c2e07ca352d33076f4d2f8414b89`
  - Add as repository secret

### 11. Test Automated Deployment

- [ ] Push a commit to `main` or `production` branch
- [ ] Check **Actions** tab in GitHub
- [ ] Verify workflow runs successfully
- [ ] Check deployed application

## 📊 Post-Deployment Checklist

### 12. Verify Everything Works

- [ ] Application loads correctly
- [ ] Database connections work
- [ ] Authentication functions (if applicable)
- [ ] Algorand wallet connection works
- [ ] All API endpoints respond correctly

### 13. Database Migrations (If Using D1)

If you're using D1 as your primary database:

- [ ] Generate migrations:
  ```bash
  npx drizzle-kit generate
  ```
- [ ] Apply migrations to D1 database:
  ```bash
  npx wrangler d1 execute growpod-primary --file=./drizzle/migrations/0000_migration.sql
  ```

### 14. Documentation

- [ ] Read [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md) for detailed info
- [ ] Read [D1_SETUP.md](./D1_SETUP.md) for D1 configuration (already configured!)
- [ ] Read [GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md) for CI/CD
- [ ] Bookmark [CLOUDFLARE_SETUP_SUMMARY.md](./CLOUDFLARE_SETUP_SUMMARY.md)

## 🎉 Configuration Status

✅ **Account ID**: Configured  
✅ **D1 Database ID**: Configured  
✅ **Domain Code ID**: Documented  
⏳ **Secrets**: Needs setup  
⏳ **Deployment**: Ready to deploy!

## 🆘 Troubleshooting

If you encounter issues:

1. **Authentication errors**: Verify your login with `npx wrangler login`
2. **Database errors**: Check D1 database ID in `wrangler.toml` (already configured)
3. **Build errors**: Ensure all dependencies are installed and TypeScript compiles
4. **Secret errors**: Verify secrets are set with `npx wrangler secret list`

See [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md) → Troubleshooting for more help.

## 🔗 Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run worker:whoami` | Get account info |
| `npm run build` | Build application |
| `npm run worker:dev` | Test locally |
| `npm run worker:deploy` | Deploy to Cloudflare |
| `npm run worker:tail` | View logs |
| `npx wrangler secret put NAME` | Add secret |
| `npx wrangler secret list` | List secrets |
| `npx wrangler d1 list` | List D1 databases |

---

**Current Status**: Configuration complete! Ready to set up secrets and deploy.

**Next Step**: Run `npx wrangler secret put DATABASE_URL` to configure your database connection.
