# CLAUDE.md - GrowPod Empire Development Guide

This document provides guidance for AI assistants working with the GrowPod Empire codebase.

## Project Overview

GrowPod Empire is a blockchain-based idle farming game built on **Algorand TestNet**. Players manage virtual hydroponic grow pods, cultivating plants through growth cycles to harvest **$BUD** tokens. The game features genetic breeding mechanics, terpene discovery, and a dual-token economy.

### Core Game Loop
1. **Mint Pod** - Create a GrowPod (NFT-like local state)
2. **Plant Seed** - Random or premium seed with DNA hash
3. **Water** (10 min cooldown) - 10 waters = ready to harvest
4. **Add Nutrients** (10 min cooldown) - Bonus yield
5. **Harvest** - Mint $BUD based on care quality
6. **Cleanup** - Burn 500 $BUD to reset pod

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS (dark cyberpunk theme) |
| Routing | Wouter |
| State | TanStack Query |
| Backend | Express.js (Node.js, deployed via Cloudflare Workers) |
| Database | PostgreSQL (Drizzle ORM) |
| Storage | PostgreSQL (no separate object storage service) |
| Blockchain | Algorand (PyTeal smart contracts) |
| Wallet | Pera Wallet (@txnlab/use-wallet-react) |

## Project Structure

```
GrowPodEmpirev1.0/
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.tsx         # Main app with routing
│   │   ├── main.tsx        # Entry point
│   │   ├── components/     # Reusable UI components
│   │   │   ├── ui/         # shadcn/ui components
│   │   │   ├── PodCard.tsx # GrowPod display card
│   │   │   ├── Navigation.tsx
│   │   │   └── ...
│   │   ├── pages/          # Route pages
│   │   │   ├── Dashboard.tsx   # Main game screen
│   │   │   ├── SeedBank.tsx    # Premium seed store
│   │   │   ├── CombinerLab.tsx # Breeding lab
│   │   │   ├── Store.tsx       # In-game shop
│   │   │   └── ...
│   │   ├── hooks/          # React hooks
│   │   │   ├── use-algorand.ts  # Blockchain interactions
│   │   │   ├── use-toast.ts
│   │   │   └── ...
│   │   ├── context/        # React context
│   │   │   └── AlgorandContext.tsx  # Wallet + chain state
│   │   └── lib/            # Utilities
├── src/                    # Cloudflare Worker backend
│   └── worker.ts           # Hono API server
├── migrations/             # D1 database migrations
│   └── 001_init.sql        # Initial schema
├── docs/                   # Architecture documentation
│   └── DYNAMIC_NFT_ARCHITECTURE.md
├── shared/                 # Shared code
│   ├── schema.ts           # Drizzle schema + types
│   └── routes.ts           # API route definitions
├── contracts/              # Algorand smart contracts
│   ├── contract.py         # Main PyTeal contract
│   ├── bootstrap.py        # Create $BUD/$TERP ASAs
│   ├── mint.py, water.py, harvest.py, etc.
│   ├── approval.teal       # Compiled TEAL
│   └── clear.teal
└── package.json
```

## Development Commands

```bash
# Start development servers (frontend + backend)
npm run dev

# Type checking
npm run check

# Build for production
npm run build

# Deploy to Cloudflare Workers
npx wrangler deploy

# Run D1 migrations
npx wrangler d1 execute growpod-empire-db --file=./migrations/001_init.sql

# Set secrets
npx wrangler secret put DATABASE_URL
npx wrangler secret put ADMIN_WALLET_ADDRESS

# View worker logs
npx wrangler tail

# Compile smart contract (from contracts/ directory)
python contract.py
```

## Key Files and Patterns

### Database Schema (`shared/schema.ts`)

Tables:
- `users` - Wallet address, balances, announcement tracking
- `playerStats` - Harvest counts, earnings, achievements
- `songs` - Jukebox audio tracks
- `announcementVideos` - Admin announcement videos
- `seedBank` - Premium seeds with attributes
- `userSeeds` - User's purchased seed inventory

Types exported:
- `User`, `InsertUser`
- `PlayerStats`, `PodData`, `PlayerState`
- `SeedBankItem`, `UserSeed`

### Algorand Integration (`client/src/context/AlgorandContext.tsx`)

```typescript
// Contract configuration
export const CONTRACT_CONFIG = {
  appId: Number(import.meta.env.VITE_GROWPOD_APP_ID) || 755243944,
  budAssetId: Number(import.meta.env.VITE_BUD_ASSET_ID) || 755243947,
  terpAssetId: Number(import.meta.env.VITE_TERP_ASSET_ID) || 755243948,
  slotAssetId: Number(import.meta.env.VITE_SLOT_ASSET_ID) || 755243949,
  appAddress: import.meta.env.VITE_GROWPOD_APP_ADDRESS || '...',
};
```

Key hooks from `use-algorand.ts`:
- `useAlgorand()` - Wallet connection state
- `useTokenBalances(account)` - $BUD, $TERP, $SLOT, ALGO balances
- `useGameState(account)` - Pod data from local state
- `useTransactions()` - Transaction builders for game actions

### Smart Contract Methods (`contracts/contract.py`)

Pod 1 methods: `mint_pod`, `water`, `nutrients`, `harvest`, `cleanup`
Pod 2 methods: `mint_pod_2`, `water_2`, `nutrients_2`, `harvest_2`, `cleanup_2`
Shared: `breed`, `check_terp`, `check_terp_2`, `claim_slot_token`, `unlock_slot`
Admin: `bootstrap`, `set_asa_ids`

Local state keys per pod:
- `stage` (0=empty, 1-4=growing, 5=ready, 6=needs_cleanup)
- `water_count`, `last_watered`
- `nutrient_count`, `last_nutrients`
- `dna`, `terpene_profile`

### API Routes (`server/routes.ts`)

Main endpoints:
- `POST /api/users/login` - Register/login user
- `GET /api/users/:walletAddress` - Get user data
- `POST /api/stats/record-harvest` - Record harvest for leaderboards
- `GET /api/leaderboard/{harvests|bud|terp}` - Leaderboards
- `GET /api/seed-bank` - Available premium seeds
- `POST /api/seed-bank/:id/purchase` - Buy a seed
- `GET /api/user-seeds/:walletAddress` - User's seed inventory
- `GET /api/jukebox/songs` - Music tracks

## Conventions

### Import Paths

```typescript
// Client-side aliases (defined in tsconfig.json)
import { Button } from "@/components/ui/button";
import { useAlgorand } from "@/hooks/use-algorand";
import type { User } from "@shared/schema";
```

### Component Patterns

- Use shadcn/ui components from `@/components/ui/`
- Pages go in `client/src/pages/`
- Custom hooks in `client/src/hooks/`
- Use `useToast()` for user notifications
- Use `useQuery`/`useMutation` from TanStack Query for API calls

### State Management

- Wallet state via `AlgorandContext`
- Server state via TanStack Query
- Local UI state via React useState
- Blockchain state fetched via `algodClient.accountInformation()`

### Styling

- Tailwind CSS with custom dark cyberpunk theme
- Color tokens: `primary`, `secondary`, `muted`, `accent`, `destructive`
- Use `cn()` utility from `@/lib/utils` for conditional classes
- Framer Motion for animations

### Blockchain Transactions

```typescript
// Example: Water a plant
const waterPlant = useCallback(async (podId: number): Promise<string | null> => {
  const suggestedParams = await algodClient.getTransactionParams().do();

  const txn = algosdk.makeApplicationNoOpTxnFromObject({
    sender: account,
    suggestedParams,
    appIndex: CONTRACT_CONFIG.appId,
    appArgs: [new TextEncoder().encode(podId === 2 ? 'water_2' : 'water')],
  });

  const signedTxns = await signTransactions([txn]);
  return await submitTransaction(signedTxns);
}, [account, signTransactions]);
```

### Error Handling

- Use Zod schemas for input validation
- Wrap async operations in try/catch
- Return appropriate HTTP status codes
- Use toast notifications for user feedback

## Environment Variables

### Required
```bash
DATABASE_URL=postgresql://...
```

### Optional (for blockchain features)
```bash
VITE_GROWPOD_APP_ID=755243944
VITE_BUD_ASSET_ID=755243947
VITE_TERP_ASSET_ID=755243948
VITE_SLOT_ASSET_ID=755243949
VITE_GROWPOD_APP_ADDRESS=CWGAVWZRVKKFHRYZHEPQPELVJMFNW2QMIWNEB2H3ZXCKOXRIPKWCW2IBRI
ADMIN_WALLET_ADDRESS=HW6U3RKLOYEW2X2L4DERSJHBPG6G6UTKDWBSS2MKPZJOSAWKLP72NTIMNQ  # TestNet admin wallet
```

### Smart Contract Deployment (TestNet)
```bash
ALGO_MNEMONIC="final adapt purpose intact naive action garbage curious feature tourist sense strong present snack control orbit pudding federal budget plug volcano olympic soda absorb monitor"
GROWPOD_APP_ID=755243944

# See ADMIN_WALLET_DEPLOYMENT.md for complete deployment guide
```

## Testing Notes

- TestNet ALGO from faucet: https://bank.testnet.algorand.network/
- TestNet cooldowns: 10 minutes for both water and nutrients
- Network: Algorand TestNet (Chain ID: 416002)
- Algod API: https://testnet-api.algonode.cloud

## Token Economy

### $BUD (Harvest Token)
- Total Supply: 10B (6 decimals)
- Minted on harvest (base 0.25g = 250,000,000 units)
- Burns: Cleanup (500), Breeding (1,000), Slot claims (2,500)

### $TERP (Governance Token)
- Fixed Supply: 100M (6 decimals)
- Minted on rare terpene discovery (5K-50K reward)

### $SLOT (Progression Token)
- Limited supply, 0 decimals
- Claimed after 5 harvests + 2,500 $BUD burn
- Burned to unlock additional pod slots (max 5)

### $SMOKE (Prediction Market Token)
- Obtained by burning $BUD (1:1 ratio)
- Used for prediction market trading
- Cannot be converted back to $BUD

## Prediction Markets

Players can trade on crypto price predictions using $SMOKE tokens.

### Market Types
- **15-minute markets** - Quick predictions on BTC, SOL, ETH
- **Hourly markets** - Longer-term price predictions
- **Auto-generated** - Markets created automatically via cron triggers

### Database Tables
- `smoke_balances` - User $SMOKE holdings
- `prediction_markets` - Active and resolved markets
- `market_positions` - User positions (yes/no shares)
- `market_orders` - Trade history
- `market_templates` - Templates for auto-generation

## Biomass NFT System (Planned)

Harvested plants become tradeable NFTs with dynamic properties.

### Key Concepts
- **Biomass NFT** - ARC-69 compliant NFT representing harvested plant
- **DNA-based visuals** - Plant appearance derived from genetic hash
- **Strain Registry** - Unique strain discoveries
- **Breeding** - Combine two Biomass NFTs to create offspring

### Database Tables
- `biomass_nfts` - NFT metadata and ownership
- `strain_registry` - Discovered strain types
- `breeding_history` - Breeding event log

### Architecture
See `docs/DYNAMIC_NFT_ARCHITECTURE.md` for full implementation details.

## Common Tasks

### Adding a New Page

1. Create component in `client/src/pages/NewPage.tsx`
2. Add route in `client/src/App.tsx`:
   ```tsx
   <Route path="/new-page" component={NewPage} />
   ```
3. Add navigation link in `components/Navigation.tsx`

### Adding a New API Endpoint

1. Add route in `server/routes.ts`
2. Add storage method in `server/storage.ts` if needed
3. Add schema if needed in `shared/schema.ts`

### Adding a Smart Contract Method

1. Add method in `contracts/contract.py`
2. Add to router `Cond` at bottom of `approval_program()`
3. Recompile: `python contract.py`
4. Add frontend transaction builder in `hooks/use-algorand.ts`

## Gotchas

- Token amounts use 6 decimals (multiply/divide by 1,000,000)
- Water cooldown is 10 minutes (600 seconds) - TestNet setting
- Nutrient cooldown is 10 minutes (600 seconds) - TestNet setting
- Pod stages: 0=empty, 1-4=growing, 5=harvest_ready, 6=needs_cleanup
- 10 waters required to reach harvest stage
- Maximum 5 pod slots per player (start with 2)
- Wallet addresses are 58 characters (Algorand format)
- Cleanup only requires 500 $BUD burn (no ALGO fee)
