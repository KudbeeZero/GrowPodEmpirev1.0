# D1 Database Migrations

This directory contains SQL migration files for the Cloudflare D1 database used in production.

## Applying Migrations

To apply migrations to your D1 database, use the Wrangler CLI:

```bash
# Apply all migrations
npx wrangler d1 execute growpod-primary --file=./migrations-d1/0001_initial_schema.sql --remote

# Or apply locally for testing
npx wrangler d1 execute growpod-primary --file=./migrations-d1/0001_initial_schema.sql --local
```

## Important Notes

### Dual Database Setup

This project uses two different database systems:

1. **PostgreSQL** - For local development (via `server/db.ts`)
   - Uses Drizzle ORM with `drizzle-orm/node-postgres`
   - Configured via `DATABASE_URL` environment variable
   - Schema push: `npm run db:push`

2. **Cloudflare D1 (SQLite)** - For production deployment (via `server/d1-db.ts`)
   - Uses Drizzle ORM with `drizzle-orm/d1`
   - Configured in `wrangler.toml` with database binding
   - Schema managed via SQL migrations in this directory

### Schema Differences

While we try to keep the schemas identical, there are some differences due to database engine limitations:

- **Boolean fields**: PostgreSQL uses native `BOOLEAN`, D1/SQLite uses `INTEGER` (0/1)
- **JSON fields**: PostgreSQL uses native `JSONB`, D1/SQLite uses `TEXT` with JSON strings
- **Serial/AutoIncrement**: PostgreSQL uses `SERIAL`, D1/SQLite uses `INTEGER PRIMARY KEY AUTOINCREMENT`

These differences are handled by Drizzle ORM at the application level.

## Current Migrations

### 0001_initial_schema.sql
Creates the initial database schema including:
- `users` - User accounts and wallet addresses
- `player_stats` - Harvest leaderboards and player achievements
- `songs` - Jukebox audio tracks
- `announcement_videos` - Admin announcement videos
- `seed_bank` - Premium seed catalog
- `user_seeds` - User seed inventory

## Creating New Migrations

When you add new tables or modify the schema:

1. Update the schema in `shared/schema.ts` (PostgreSQL version)
2. Create a new migration file in this directory with the next number (e.g., `0002_add_feature.sql`)
3. Write the equivalent SQLite/D1 SQL for your changes
4. Test locally first: `npx wrangler d1 execute growpod-primary --file=./migrations-d1/XXXX.sql --local`
5. Apply to production: `npx wrangler d1 execute growpod-primary --file=./migrations-d1/XXXX.sql --remote`

## Checking Database Status

To check what tables exist in your D1 database:

```bash
# Remote (production)
npx wrangler d1 execute growpod-primary --command="SELECT name FROM sqlite_master WHERE type='table';" --remote

# Local
npx wrangler d1 execute growpod-primary --command="SELECT name FROM sqlite_master WHERE type='table';" --local
```

To check a specific table's schema:

```bash
npx wrangler d1 execute growpod-primary --command="PRAGMA table_info(users);" --remote
```

## Seeding Data

The application automatically seeds the `seed_bank` table with default premium seeds on first run via `server/storage.ts:initializeSeedBank()`.

If you need to manually seed data, create a SQL file with INSERT statements and run it with:

```bash
npx wrangler d1 execute growpod-primary --file=./migrations-d1/seed_data.sql --remote
```

## Backup and Restore

To backup your D1 database:

```bash
npx wrangler d1 export growpod-primary --output=backup.sql --remote
```

To restore:

```bash
npx wrangler d1 execute growpod-primary --file=backup.sql --remote
```

## Troubleshooting

### "table already exists" errors
If you get this error, the migration has already been applied. D1 migrations are not tracked automatically, so you need to keep track manually or use `CREATE TABLE IF NOT EXISTS`.

### Different data in dev vs production
Remember that PostgreSQL (dev) and D1 (production) are separate databases. Changes made locally don't sync to production automatically.

### Migration rollback
D1 doesn't have built-in rollback support. To rollback, you need to create a new migration that reverses the changes (e.g., `DROP TABLE`, `ALTER TABLE`, etc.).
