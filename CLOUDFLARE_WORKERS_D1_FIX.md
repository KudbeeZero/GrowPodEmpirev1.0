# Cloudflare Workers Deployment Fix - Complete Guide

## Overview

This document describes the fix for the "Dynamic require of 'path' is not supported" error that was preventing deployment to Cloudflare Workers.

## Problem

The GitHub Actions deployment workflow was failing with:
```
Uncaught Error: Dynamic require of "path" is not supported
  at null.<anonymous> (index.js:12:9)
```

This error occurred because:
1. The worker build was bundling the PostgreSQL `pg` package
2. The `pg` package requires Node.js modules like `path`, `fs`, etc.
3. Cloudflare Workers doesn't support Node.js-specific packages

## Solution

### Dual Database Architecture

The fix implements a dual database architecture:

**Development Environment (Node.js)**:
- Database: PostgreSQL
- Adapter: `server/db.ts`
- ORM: `drizzle-orm/node-postgres`
- Configuration: `DATABASE_URL` environment variable

**Production Environment (Cloudflare Workers)**:
- Database: Cloudflare D1 (SQLite)
- Adapter: `server/d1-db.ts`
- ORM: `drizzle-orm/d1`
- Configuration: `wrangler.toml` database binding

### Key Changes

1. **Created D1 Database Adapter** (`server/d1-db.ts`)
   - Uses `drizzle-orm/d1` instead of `node-postgres`
   - Lazy initialization on first request

2. **Updated Worker Entry Point** (`server/worker.ts`)
   - Accepts D1 database from `env.DB` binding
   - Passes D1 instance to routes on initialization
   - Initializes seed bank with D1 connection

3. **Updated Storage Layer** (`server/storage.ts`)
   - Modified `DatabaseStorage` class to accept database instance
   - Works with both PostgreSQL and D1 connections
   - Updated `initializeSeedBank()` to accept database parameter

4. **Updated Routes** (`server/routes.ts`)
   - Accepts optional database instance parameter
   - Creates storage with provided database connection
   - Supports both PostgreSQL (dev) and D1 (prod)

5. **Optimized Build Configuration** (`script/build.ts`)
   - Separate package allowlists for Node.js vs Workers
   - Workers build externalizes Node.js-specific packages
   - Reduced bundle size from 1.0MB to 204KB
   - Eliminated all dynamic require statements

6. **Added D1 Schema Migration** (`migrations-d1/0001_initial_schema.sql`)
   - SQL schema for D1 database
   - Includes all tables: users, player_stats, songs, announcement_videos, seed_bank, user_seeds
   - SQLite-compatible (uses INTEGER for booleans, TEXT for JSON)

7. **TypeScript Configuration** (`tsconfig.json`)
   - Added `@cloudflare/workers-types` for D1Database type
   - Included `types/` directory for Cloudflare Workers types

## Deployment Steps

### 1. Apply D1 Database Schema

Before the first deployment, apply the database schema to your D1 database:

```bash
npx wrangler d1 execute growpod-primary --file=./migrations-d1/0001_initial_schema.sql --remote
```

Verify the schema was applied:
```bash
npx wrangler d1 execute growpod-primary --command="SELECT name FROM sqlite_master WHERE type='table';" --remote
```

You should see tables: users, player_stats, songs, announcement_videos, seed_bank, user_seeds

### 2. Build and Deploy

The GitHub Actions workflow will handle deployment automatically on push to `main` or `production` branches.

For manual deployment:
```bash
# Build for workers
BUILD_TARGET=worker npm run build

# Deploy to Cloudflare Workers
npx wrangler deploy
```

### 3. Verify Deployment

Monitor the deployment:
```bash
npm run worker:tail
```

Test an API endpoint:
```bash
curl https://gape.kudbee.workers.dev/api/leaderboard/harvests
```

## Build Comparison

### Before (Failed)
- Bundle size: 1.0MB
- Bundled packages: pg, express, and all Node.js dependencies
- Result: "Dynamic require" error at runtime

### After (Fixed)
- Bundle size: 204KB
- Bundled packages: Only drizzle-orm, zod, date-fns (Workers-compatible)
- Externalized: pg, express, and all Node.js-specific packages
- Result: Clean build, no dynamic require errors ✅

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     GrowPod Empire Application                   │
└─────────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
        ┌───────▼────────┐      ┌──────▼─────────┐
        │  Development   │      │   Production   │
        │  (Node.js)     │      │  (CF Workers)  │
        └───────┬────────┘      └──────┬─────────┘
                │                       │
        ┌───────▼────────┐      ┌──────▼─────────┐
        │  server/db.ts  │      │ server/d1-db.ts│
        │  (node-postgres)│      │    (d1)        │
        └───────┬────────┘      └──────┬─────────┘
                │                       │
        ┌───────▼────────┐      ┌──────▼─────────┐
        │  PostgreSQL    │      │ Cloudflare D1  │
        │  (Full SQL)    │      │   (SQLite)     │
        └────────────────┘      └────────────────┘
```

## Database Schema Compatibility

Both databases use the same logical schema, with minor differences:

| Feature | PostgreSQL | D1/SQLite |
|---------|-----------|-----------|
| Primary Key | SERIAL | INTEGER PRIMARY KEY AUTOINCREMENT |
| Boolean | BOOLEAN | INTEGER (0/1) |
| JSON | JSONB | TEXT (JSON string) |
| Timestamps | TIMESTAMP | TIMESTAMP |

These differences are handled automatically by Drizzle ORM.

## Local Development

For local development with PostgreSQL:

1. Ensure `DATABASE_URL` is set:
   ```bash
   export DATABASE_URL="postgresql://user:password@localhost:5432/growpod"
   ```

2. Push schema changes:
   ```bash
   npm run db:push
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

## Testing Workers Locally

To test the worker build locally:

```bash
# Build for workers
BUILD_TARGET=worker npm run build

# Run locally with wrangler
npx wrangler dev
```

This will start a local Cloudflare Workers development environment.

## Troubleshooting

### "table already exists" error
The migration has already been applied. You can verify with:
```bash
npx wrangler d1 execute growpod-primary --command="PRAGMA table_info(users);" --remote
```

### "database not found" error
Verify your database ID in `wrangler.toml` matches your D1 database:
```bash
npx wrangler d1 list
```

### Build failures
If the build fails, ensure you're using the correct target:
```bash
BUILD_TARGET=worker npm run build
```

### TypeScript errors
Run type checking:
```bash
npm run check
```

All type errors should be resolved. If you see errors related to D1Database, ensure `@cloudflare/workers-types` is installed:
```bash
npm install --save-dev @cloudflare/workers-types
```

## Files Modified

- `server/d1-db.ts` (new) - D1 database adapter
- `server/worker.ts` - Updated to use D1
- `server/storage.ts` - Accept database instance parameter
- `server/routes.ts` - Accept database instance parameter
- `script/build.ts` - Separate allowlists for Node.js vs Workers
- `tsconfig.json` - Add Cloudflare Workers types
- `types/cloudflare.d.ts` (new) - D1 type definitions
- `migrations-d1/0001_initial_schema.sql` (new) - D1 schema
- `migrations-d1/README.md` (new) - Migration documentation
- `D1_SETUP.md` - Updated with dual database info

## Success Criteria

- ✅ TypeScript compilation passes
- ✅ Worker build completes (204KB bundle)
- ✅ No "dynamic require" errors
- ✅ Client build successful
- ⏳ D1 schema applied (requires wrangler access)
- ⏳ Deployment succeeds (next test)

## Additional Resources

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Drizzle ORM D1 Adapter](https://orm.drizzle.team/docs/get-started-d1)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- Internal docs:
  - `D1_SETUP.md` - Quick D1 setup guide
  - `migrations-d1/README.md` - Migration management
  - `CLOUDFLARE_DEPLOYMENT.md` - Full deployment guide
