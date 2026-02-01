# Quick Setup: Configure D1 Database IDs

This file provides instructions for configuring your 3 D1 database IDs in the Cloudflare Workers deployment.

## Step 1: Locate Your D1 Database IDs

If you were provided with 3 D1 database IDs, have them ready. They should look like:
- Database 1 ID: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Database 2 ID: `yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy`
- Database 3 ID: `zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz`

If you need to create new D1 databases, run:
```bash
npx wrangler d1 create growpod-primary
npx wrangler d1 create growpod-secondary
npx wrangler d1 create growpod-tertiary
```

## Step 2: Update wrangler.toml

Open `wrangler.toml` and replace the placeholder values:

### Before:
```toml
[[d1_databases]]
binding = "DB"
database_name = "growpod-primary"
database_id = "YOUR_D1_DATABASE_ID_1"

[[d1_databases]]
binding = "DB2"
database_name = "growpod-secondary"
database_id = "YOUR_D1_DATABASE_ID_2"

[[d1_databases]]
binding = "DB3"
database_name = "growpod-tertiary"
database_id = "YOUR_D1_DATABASE_ID_3"
```

### After (with your actual IDs):
```toml
[[d1_databases]]
binding = "DB"
database_name = "growpod-primary"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

[[d1_databases]]
binding = "DB2"
database_name = "growpod-secondary"
database_id = "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy"

[[d1_databases]]
binding = "DB3"
database_name = "growpod-tertiary"
database_id = "zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz"
```

## Step 3: Get Your Cloudflare Account ID

Run:
```bash
npm run worker:whoami
```

Copy your account ID and add it to `wrangler.toml`:
```toml
account_id = "your_account_id_here"
```

## Step 4: Set Up Secrets

Set your DATABASE_URL secret (PostgreSQL connection string):
```bash
npx wrangler secret put DATABASE_URL
```

When prompted, enter your PostgreSQL connection string, for example:
```
postgresql://username:password@host:5432/database
```

## Step 5: Deploy

```bash
npm run build
npm run worker:deploy
```

## Automated Setup

Alternatively, use the automated setup script:
```bash
./setup-cloudflare.sh
```

This script will:
1. Login to Cloudflare
2. Get your account ID
3. Help you configure D1 database IDs
4. Set up secrets
5. Create local development environment file

## Troubleshooting

### "database not found" error
- Verify your database IDs are correct in `wrangler.toml`
- Ensure you're logged into the correct Cloudflare account
- Run `npx wrangler d1 list` to see your available databases

### "account_id not set" error
- Run `npm run worker:whoami` to get your account ID
- Update the `account_id` field in `wrangler.toml`

### Permission errors
- Ensure you have proper permissions in your Cloudflare account
- Verify your API token has Workers and D1 permissions

## Additional Resources

- Full deployment guide: [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md)
- Cloudflare D1 Docs: https://developers.cloudflare.com/d1/
- Wrangler CLI Docs: https://developers.cloudflare.com/workers/wrangler/
