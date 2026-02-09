# Quick Setup: Configure D1 Database ID - CONFIGURED ✅

Your Cloudflare configuration has been updated with your specific IDs.

## Important: Dual Database Architecture

This project uses **two separate databases**:

1. **PostgreSQL** - For local development
   - Accessed via `server/db.ts` using `drizzle-orm/node-postgres`
   - Configured via `DATABASE_URL` environment variable
   - Schema management: `npm run db:push`

2. **Cloudflare D1 (SQLite)** - For production deployment
   - Accessed via `server/d1-db.ts` using `drizzle-orm/d1`
   - Configured in `wrangler.toml` with database binding
   - Schema management: SQL migrations in `migrations-d1/` directory

The application automatically detects the runtime environment and uses the appropriate database.

## ✅ Configuration Complete

The following IDs have been configured in `wrangler.toml`:

### Account ID
```toml
account_id = "b591c2e07ca352d33076f4d2f8414b89"
```

### D1 Database
```toml
[[d1_databases]]
binding = "DB"
database_name = "growpod-primary"
database_id = "712d926f-c396-473f-96d9-f0dfc3d1d069"
```

### Domain Code ID (for reference)
```
85a5b265570a47e66762a07932ce8aa8
```
*Note: This ID is documented for reference. If you need to use it for domain configuration, please refer to Cloudflare's domain settings.*

## Next Steps

Now that your IDs are configured, you can:

### 1. Apply Database Schema

Apply the database schema to your D1 database:
```bash
npx wrangler d1 execute growpod-primary --file=./migrations-d1/0001_initial_schema.sql --remote
```

This creates all the necessary tables for the application.

### 2. Deploy

```bash
BUILD_TARGET=worker npm run build
npm run worker:deploy
```

### 3. Monitor Your Deployment

```bash
npm run worker:tail
```

## Verify Configuration

You can verify your configuration is correct by running:
```bash
npm run worker:whoami
```

This should show your account ID: `b591c2e07ca352d33076f4d2f8414b89`

## Database Access in Code

Your D1 database is now accessible in your worker code via:
```typescript
// Access the database binding
const db = env.DB;

// Example query
const results = await db.prepare("SELECT * FROM users").all();
```

## Additional Configuration

If you need to configure additional D1 databases in the future, you can add more `[[d1_databases]]` blocks to `wrangler.toml` following the same pattern.

## Troubleshooting

### "database not found" error
- Verify your database ID is correct in `wrangler.toml`: `712d926f-c396-473f-96d9-f0dfc3d1d069`
- Ensure you're logged into the correct Cloudflare account
- Run `npx wrangler d1 list` to see your available databases

### Permission errors
- Ensure you have proper permissions in your Cloudflare account
- Verify your API token has Workers and D1 permissions

## Additional Resources

- Full deployment guide: [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md)
- Cloudflare D1 Docs: https://developers.cloudflare.com/d1/
- Wrangler CLI Docs: https://developers.cloudflare.com/workers/wrangler/
