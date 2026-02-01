# 📋 Cloudflare Workers Deployment Checklist

Use this checklist to complete your Cloudflare Workers deployment setup.

## ✅ Pre-Deployment Checklist

### 1. Obtain Your D1 Database IDs

You mentioned you have 3 D1 database IDs. Have them ready:

- [ ] D1 Database ID #1: `________________________________`
- [ ] D1 Database ID #2: `________________________________`
- [ ] D1 Database ID #3: `________________________________`

If you don't have them yet:
```bash
npx wrangler d1 create growpod-primary
npx wrangler d1 create growpod-secondary
npx wrangler d1 create growpod-tertiary
```

### 2. Get Your Cloudflare Account ID

- [ ] Get account ID:
  ```bash
  npm run worker:whoami
  ```
- [ ] Copy your account ID: `________________________________`

### 3. Update wrangler.toml

- [ ] Open `wrangler.toml` in your editor
- [ ] Replace `YOUR_ACCOUNT_ID` with your actual account ID (line 8)
- [ ] Replace `YOUR_D1_DATABASE_ID_1` with your first D1 database ID (line 19)
- [ ] Replace `YOUR_D1_DATABASE_ID_2` with your second D1 database ID (line 24)
- [ ] Replace `YOUR_D1_DATABASE_ID_3` with your third D1 database ID (line 29)
- [ ] Save the file

### 4. Set Up Secrets

- [ ] Configure DATABASE_URL:
  ```bash
  npx wrangler secret put DATABASE_URL
  ```
  Enter your PostgreSQL connection string when prompted

- [ ] (Optional) Configure other secrets if needed:
  ```bash
  npx wrangler secret put ADMIN_WALLET_ADDRESS
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
  - Use the account ID from step 2
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
- [ ] Apply migrations to D1 databases:
  ```bash
  npx wrangler d1 execute growpod-primary --file=./drizzle/migrations/0000_migration.sql
  npx wrangler d1 execute growpod-secondary --file=./drizzle/migrations/0000_migration.sql
  npx wrangler d1 execute growpod-tertiary --file=./drizzle/migrations/0000_migration.sql
  ```

### 14. Documentation

- [ ] Read [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md) for detailed info
- [ ] Read [D1_SETUP.md](./D1_SETUP.md) for D1 configuration
- [ ] Read [GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md) for CI/CD
- [ ] Bookmark [CLOUDFLARE_SETUP_SUMMARY.md](./CLOUDFLARE_SETUP_SUMMARY.md)

## 🎉 Success!

When all items are checked, your Cloudflare Workers deployment is complete!

## 🆘 Troubleshooting

If you encounter issues:

1. **Authentication errors**: Verify `CLOUDFLARE_API_TOKEN` and account ID
2. **Database errors**: Check D1 database IDs in `wrangler.toml`
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

**Need help?** See the comprehensive guides in the documentation files.

**Quick setup?** Run `./setup-cloudflare.sh` for an interactive setup wizard!
