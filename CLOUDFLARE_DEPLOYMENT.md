# Cloudflare Workers Deployment Guide

This guide explains how to deploy GrowPod Empire to Cloudflare Workers.

## ⚠️ Important: Database Architecture

**Current Status**: The application currently uses PostgreSQL with the `node-postgres` driver. Direct PostgreSQL connections are **not supported** in Cloudflare Workers due to TCP socket limitations.

**Recommended Solutions**:
1. **Use a PostgreSQL HTTP Proxy** like [Neon](https://neon.tech) or [Supabase](https://supabase.com) with HTTP/REST APIs
2. **Migrate to Cloudflare D1** (SQLite-based, requires code changes)
3. **Use Cloudflare's Hyperdrive** to proxy PostgreSQL connections

**For GitHub Actions Deployment**: Ensure `DATABASE_URL` is set as a repository secret and points to a Workers-compatible database connection.

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Already installed as dev dependency
3. **Node.js**: Version 18 or higher

## Step 1: Authenticate with Cloudflare

```bash
npx wrangler login
```

This will open a browser window to authenticate with your Cloudflare account.

## Step 2: Get Your Account ID

```bash
npm run worker:whoami
```

Copy your account ID and add it to `wrangler.toml`:

```toml
account_id = "YOUR_ACCOUNT_ID_HERE"
```

## Step 3: Create D1 Databases

You need to create 3 D1 databases (or update to use the ones provided):

```bash
# Create primary database
npx wrangler d1 create growpod-primary

# Create secondary database (if needed)
npx wrangler d1 create growpod-secondary

# Create tertiary database (if needed)
npx wrangler d1 create growpod-tertiary
```

**Important**: If you were already provided with D1 database IDs, update the `database_id` values in `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "growpod-primary"
database_id = "YOUR_PROVIDED_D1_ID_1"

[[d1_databases]]
binding = "DB2"
database_name = "growpod-secondary"
database_id = "YOUR_PROVIDED_D1_ID_2"

[[d1_databases]]
binding = "DB3"
database_name = "growpod-tertiary"
database_id = "YOUR_PROVIDED_D1_ID_3"
```

## Step 4: Run Database Migrations

If using D1 as your primary database, you'll need to migrate your schema:

```bash
# Export your schema to SQL
npx drizzle-kit generate

# Apply migrations to D1
npx wrangler d1 execute growpod-primary --file=./drizzle/migrations/0000_migration.sql
```

## Step 5: Configure Secrets

Set up sensitive environment variables as Cloudflare secrets:

```bash
# If using external PostgreSQL (recommended for production)
npx wrangler secret put DATABASE_URL

# TestNet admin wallet address
npx wrangler secret put ADMIN_WALLET_ADDRESS
# Enter: HW6U3RKLOYEW2X2L4DERSJHBPG6G6UTKDWBSS2MKPZJOSAWKLP72NTIMNQ

# TestNet deployment mnemonic (if needed)
npx wrangler secret put ALGO_MNEMONIC
```

## Step 6: Set Up Local Development

For local development with Wrangler:

1. Copy `.dev.vars.example` to `.dev.vars`:
   ```bash
   cp .dev.vars.example .dev.vars
   ```

2. Fill in your local environment variables in `.dev.vars`

3. Run local development server:
   ```bash
   npm run worker:dev
   ```

## Step 7: Build and Deploy

```bash
# Build the application
npm run build

# Deploy to Cloudflare Workers
npm run worker:deploy
```

## Step 8: Monitor Your Worker

View real-time logs:

```bash
npm run worker:tail
```

## Database Configuration Options

### Option 1: Use D1 (Cloudflare's Native Database)

Update `server/db.ts` to use D1 bindings when running on Cloudflare:

```typescript
// Check if running on Cloudflare Workers
if (globalThis.DB) {
  // Use D1 binding
  export const db = drizzle(globalThis.DB, { schema });
} else {
  // Use PostgreSQL pool for local dev
  export const db = drizzle(pool, { schema });
}
```

### Option 2: Use External PostgreSQL (Current Setup)

Keep your existing PostgreSQL database and set `DATABASE_URL` as a secret:

```bash
npx wrangler secret put DATABASE_URL
# Enter your PostgreSQL connection string when prompted
```

## Troubleshooting

### Build Errors

If you encounter build errors, ensure:
- All dependencies are installed: `npm install`
- TypeScript compiles: `npm run check`
- Build succeeds locally: `npm run build`

### Database Connection Issues

- Verify `DATABASE_URL` secret is set correctly
- Check that D1 database IDs in `wrangler.toml` match your actual databases
- Ensure database migrations have been applied

### Worker Size Limits

Cloudflare Workers have size limits. If your bundle is too large:
- Review `script/build.ts` and ensure proper externals
- Consider splitting large dependencies
- Use Cloudflare's `nodejs_compat` flag (already enabled)

## Additional Resources

- [Wrangler Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Workers Node.js Compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)

## Summary of Commands

```bash
# Development
npm run worker:dev          # Run local worker dev server
npm run dev                  # Run standard Express dev server

# Deployment
npm run build                # Build for production
npm run worker:deploy        # Deploy to Cloudflare Workers

# Management
npm run worker:whoami        # Get account info
npm run worker:tail          # View real-time logs
npx wrangler d1 list         # List D1 databases
npx wrangler secret list     # List configured secrets
```
