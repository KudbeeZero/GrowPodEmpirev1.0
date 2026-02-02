# GrowPod Empire - Copilot Instructions

## Repository Overview

GrowPod Empire is a blockchain-based idle farming game built on **Algorand TestNet**. Players manage virtual hydroponic grow pods, cultivating plants through growth cycles to harvest **$BUD** tokens. The game features genetic breeding mechanics, terpene discovery, and a dual-token economy ($BUD and $TERP).

**Repository Type**: Full-stack web application  
**Languages**: TypeScript (frontend/backend), Python (smart contracts)  
**Size**: ~2800+ modules in client bundle  
**Key Technologies**: React 18, Vite, Express.js, PostgreSQL, PyTeal (Algorand)

## Build and Validation Commands

### Installation and Setup

**ALWAYS** run `npm install` after cloning or when package.json changes:
```bash
npm install
```

Expected time: ~15-30 seconds. The installation may show deprecation warnings for @walletconnect packages and some security vulnerabilities - these are acceptable and known.

### Type Checking

```bash
npm run check
```

**Important**: The TypeScript check currently reports 14 errors in 3 files (CombinerLab.tsx, Dashboard.tsx, SeedVault.tsx). These are known type inference issues with seed objects and do NOT block the build. The build process will complete successfully even with these type errors present.

### Build Process

```bash
npm run build
```

This command:
1. Builds the client (React frontend) using Vite
2. Builds the server using esbuild
3. Outputs to `dist/` directory

**Expected time**: ~10-15 seconds  
**Expected output**: 
- `dist/public/` - Client assets (2.1MB+ of bundled JS/CSS)
- `dist/index.cjs` - Server bundle (1.1MB)

The build will show a warning about chunk sizes >500KB - this is expected and acceptable for now.

### Development Server

```bash
npm run dev
```

Starts both frontend (Vite dev server) and backend (Express) concurrently. The frontend typically runs on port 5173 and proxies API requests to the backend.

### Database Operations

**Push schema changes to database:**
```bash
npm run db:push
```

Requires `DATABASE_URL` environment variable to be set.

### Smart Contract Compilation

From the `contracts/` directory:
```bash
python contract.py
```

Generates `approval.teal` and `clear.teal` files. Requires Python with pyteal and py-algorand-sdk installed.

## Project Layout and Architecture

### Directory Structure

```
/
├── .github/
│   └── workflows/
│       └── deploy-cloudflare.yml    # CI/CD for Cloudflare Workers
├── client/                          # React frontend application
│   └── src/
│       ├── App.tsx                  # Main router and app structure
│       ├── main.tsx                 # Entry point
│       ├── components/
│       │   ├── ui/                  # shadcn/ui component library
│       │   ├── PodCard.tsx          # GrowPod display component
│       │   └── Navigation.tsx       # Main navigation
│       ├── pages/
│       │   ├── Dashboard.tsx        # Main game screen
│       │   ├── SeedBank.tsx         # Premium seed store
│       │   ├── CombinerLab.tsx      # Breeding mechanics
│       │   ├── SeedVault.tsx        # Seed inventory
│       │   └── Store.tsx            # In-game shop
│       ├── hooks/
│       │   ├── use-algorand.ts      # Blockchain integration
│       │   └── use-toast.ts         # Toast notifications
│       ├── context/
│       │   └── AlgorandContext.tsx  # Wallet and chain state
│       └── lib/                     # Utility functions
├── server/                          # Express.js backend
│   ├── index.ts                     # Server entry point
│   ├── routes.ts                    # API endpoint definitions
│   ├── storage.ts                   # Database operations
│   └── db.ts                        # Drizzle ORM connection
├── shared/                          # Shared TypeScript code
│   ├── schema.ts                    # Database schema and types
│   └── routes.ts                    # API route definitions
├── contracts/                       # Algorand smart contracts
│   ├── contract.py                  # Main PyTeal contract
│   ├── approval.teal                # Compiled TEAL (generated)
│   ├── clear.teal                   # Clear state program (generated)
│   └── bootstrap.py                 # ASA creation script
└── package.json                     # Dependencies and scripts
```

### Key Configuration Files

- `tsconfig.json` - TypeScript configuration with path aliases (@/, @shared/)
- `vite.config.ts` - Frontend build configuration
- `tailwind.config.ts` - Tailwind CSS theme (cyberpunk dark theme)
- `drizzle.config.ts` - Database ORM configuration
- `wrangler.toml` - Cloudflare Workers configuration

### Import Path Aliases

The project uses TypeScript path aliases:
- `@/` - Points to `client/src/`
- `@shared/` - Points to `shared/`

Example:
```typescript
import { Button } from "@/components/ui/button";
import { useAlgorand } from "@/hooks/use-algorand";
import type { User } from "@shared/schema";
```

## CI/CD and Validation

### GitHub Actions Workflow

The repository has one workflow: `.github/workflows/deploy-cloudflare.yml`

**Triggers**: Push to `main` or `production` branches, or manual dispatch

**Steps**:
1. Checkout code
2. Setup Node.js 20
3. Install dependencies with `npm ci`
4. Run type check with `npm run check`
5. Build with `npm run build`
6. Deploy to Cloudflare Workers using wrangler

**Required Secrets**:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

### Pre-commit Validation Steps

Before committing changes, validate:
1. `npm run check` - Type checking (expect 14 known errors)
2. `npm run build` - Ensure build completes successfully
3. Manual testing of changed functionality in dev mode

## Database Schema

The application uses Drizzle ORM with PostgreSQL. Key tables:

- **users** - Wallet addresses, balances, metadata
- **playerStats** - Harvest counts, total earnings, achievements
- **seedBank** - Premium seeds available for purchase
- **userSeeds** - User's purchased seed inventory
- **songs** - Jukebox audio tracks
- **announcementVideos** - Admin announcements

Types are exported from `shared/schema.ts` as both the table type and `Insert` variants (e.g., `User`, `InsertUser`).

## Blockchain Integration

### Smart Contract Configuration

Contract addresses and IDs are configured in `client/src/context/AlgorandContext.tsx`:

```typescript
export const CONTRACT_CONFIG = {
  appId: 753910199,           // Main application ID
  budAssetId: 753910204,      // $BUD token ASA ID
  terpAssetId: 753910205,     // $TERP token ASA ID
  slotAssetId: 753910206,     // $SLOT token ASA ID
  appAddress: "...",          // Contract address
};
```

### Key Hooks and Methods

From `client/src/hooks/use-algorand.ts`:
- `useAlgorand()` - Wallet connection state and methods
- `useTokenBalances(account)` - Fetch $BUD, $TERP, $SLOT, ALGO balances
- `useGameState(account)` - Read pod state from smart contract local state
- `useTransactions()` - Transaction builders for game actions

### Smart Contract Methods

Pod operations (per pod):
- `mint_pod`, `mint_pod_2` - Create new pod
- `water`, `water_2` - Water plant (10 min cooldown)
- `nutrients`, `nutrients_2` - Add nutrients (10 min cooldown)
- `harvest`, `harvest_2` - Harvest and mint $BUD
- `cleanup`, `cleanup_2` - Reset pod (burns 500 $BUD)

Shared operations:
- `breed` - Combine two plants (burns 1,000 $BUD)
- `check_terp`, `check_terp_2` - Check terpene profile for rewards
- `claim_slot_token`, `unlock_slot` - Pod slot management

### Local State Keys (per pod)

- `stage` - Growth stage (0=empty, 1-4=growing, 5=ready, 6=needs_cleanup)
- `water_count` - Number of times watered
- `last_watered` - Timestamp of last water
- `nutrient_count` - Number of nutrients added
- `last_nutrients` - Timestamp of last nutrient
- `dna` - Plant genetics hash
- `terpene_profile` - Terpene profile data

## API Endpoints

Main API routes (defined in `server/routes.ts`):

- `POST /api/users/login` - Register/login user
- `GET /api/users/:walletAddress` - Get user data
- `POST /api/stats/record-harvest` - Record harvest for leaderboards
- `GET /api/leaderboard/{harvests|bud|terp}` - Get leaderboards
- `GET /api/seed-bank` - List available premium seeds
- `POST /api/seed-bank/:id/purchase` - Purchase a seed
- `GET /api/user-seeds/:walletAddress` - Get user's seed inventory
- `GET /api/jukebox/songs` - Get music tracks

## Environment Variables

### Required for Development

```bash
DATABASE_URL=postgresql://...
```

### Optional (Blockchain Features)

```bash
VITE_GROWPOD_APP_ID=753910199
VITE_BUD_ASSET_ID=753910204
VITE_TERP_ASSET_ID=753910205
VITE_SLOT_ASSET_ID=753910206
VITE_GROWPOD_APP_ADDRESS=...
ADMIN_WALLET_ADDRESS=...
```

### For Smart Contract Deployment

```bash
ALGO_MNEMONIC="your twenty five word mnemonic"
GROWPOD_APP_ID=<after_deployment>
```

## Common Patterns and Conventions

### Component Structure

- Use shadcn/ui components from `@/components/ui/`
- Page components go in `client/src/pages/`
- Custom hooks in `client/src/hooks/`
- Use `useToast()` for user notifications
- Use TanStack Query (`useQuery`/`useMutation`) for API calls

### State Management

- Wallet state via `AlgorandContext`
- Server state via TanStack Query
- Local UI state via React `useState`
- Blockchain state fetched via `algodClient.accountInformation()`

### Styling

- Tailwind CSS with custom dark cyberpunk theme
- Color tokens: `primary`, `secondary`, `muted`, `accent`, `destructive`
- Use `cn()` utility from `@/lib/utils` for conditional classes
- Framer Motion for animations

### Error Handling

- Use Zod schemas for input validation
- Wrap async operations in try/catch
- Return appropriate HTTP status codes
- Display user-friendly error messages via toast notifications

## Known Issues and Workarounds

1. **TypeScript Errors**: The codebase currently has 14 type errors in 3 files. These do not block the build process and can be ignored temporarily. The issues are related to seed object type inference in CombinerLab, Dashboard, and SeedVault components.

2. **Token Amounts**: All token amounts use 6 decimals. Always multiply/divide by 1,000,000 when converting between display values and blockchain values.

3. **Cooldowns**: TestNet uses 10-minute cooldowns for both water and nutrients (600 seconds). This is enforced on-chain.

4. **Pod Stages**: Remember that stage 0 = empty, stages 1-4 = growing, stage 5 = ready to harvest, stage 6 = needs cleanup.

## Testing and Validation

There are no automated tests in the repository currently. Manual testing approach:

1. Start dev server: `npm run dev`
2. Connect Pera Wallet to Algorand TestNet
3. Get TestNet ALGO from: https://bank.testnet.algorand.network/
4. Test game flow: mint pod → plant → water → harvest → cleanup
5. Test API endpoints using the UI or directly

## Additional Documentation

For more detailed guidance, see:
- `CLAUDE.md` - Detailed development guide for AI assistants
- `README.md` - Project overview and deployment steps
- `CLOUDFLARE_DEPLOYMENT.md` - Cloudflare Workers deployment guide

## Instructions for Copilot

When making changes to this codebase:

1. **Always** run `npm install` if package.json changes
2. **Always** run `npm run check` before committing (but accept the 14 known errors)
3. **Always** run `npm run build` to verify the build succeeds
4. **Do not** try to fix the existing TypeScript errors unless specifically asked
5. **Use** the existing patterns and conventions described above
6. **Check** the CLAUDE.md file for additional context on game mechanics
7. **Remember** token amounts need multiplication/division by 1,000,000
8. **Test** changes manually in dev mode when UI changes are involved
9. **Follow** the existing code style (Tailwind classes, shadcn/ui components)
10. **Use** TanStack Query for all API calls instead of direct fetch
