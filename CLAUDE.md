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
| Backend | Express.js + TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| Blockchain | Algorand (PyTeal smart contracts) |
| Wallet | Pera Wallet (@perawallet/connect) |

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
├── server/                 # Express backend
│   ├── index.ts            # Server entry
│   ├── routes.ts           # API endpoints
│   ├── storage.ts          # Database operations
│   ├── db.ts               # Drizzle connection
│   └── replit_integrations/
│       └── object_storage/ # File uploads
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
# Start development server (frontend + backend)
npm run dev

# Type checking
npm run check

# Build for production
npm run build

# Start production server
npm start

# Push database schema changes
npm run db:push

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
  appId: Number(import.meta.env.VITE_GROWPOD_APP_ID) || 753910199,
  budAssetId: Number(import.meta.env.VITE_BUD_ASSET_ID) || 753910204,
  terpAssetId: Number(import.meta.env.VITE_TERP_ASSET_ID) || 753910205,
  slotAssetId: Number(import.meta.env.VITE_SLOT_ASSET_ID) || 753910206,
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
VITE_GROWPOD_APP_ID=753910199
VITE_BUD_ASSET_ID=753910204
VITE_TERP_ASSET_ID=753910205
VITE_SLOT_ASSET_ID=753910206
VITE_GROWPOD_APP_ADDRESS=...
ADMIN_WALLET_ADDRESS=...  # For admin-only features
```

### Smart Contract Deployment
```bash
ALGO_MNEMONIC="your 25 word mnemonic"
GROWPOD_APP_ID=<after_deployment>
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
