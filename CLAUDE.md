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
| Blockchain | Algorand (TEALScript TypeScript contracts) |
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
│   ├── GrowPodEmpire.algo.ts  # Main TEALScript contract (TypeScript)
│   ├── deploy.ts           # TypeScript deployment script
│   ├── tsconfig.json       # TypeScript config for contracts
│   ├── artifacts/          # Compiled output (TEAL + ABI)
│   │   ├── GrowPodEmpire.approval.teal
│   │   ├── GrowPodEmpire.clear.teal
│   │   └── GrowPodEmpire.arc4.json  # ABI definition
│   ├── contract.py         # Legacy PyTeal contract (reference)
│   ├── mint.py, water.py, harvest.py, etc.  # Legacy scripts
│   ├── approval.teal       # Legacy compiled TEAL
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

# Compile smart contract (TEALScript → TEAL)
npm run contract:compile

# Deploy smart contract to TestNet
ALGO_MNEMONIC="..." npm run contract:deploy

# Legacy: Compile PyTeal contract (from contracts/ directory)
# python contract.py
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

### Smart Contract Methods (`contracts/GrowPodEmpire.algo.ts`)

The contract is written in **TEALScript** (TypeScript) and uses ABI method routing (ARC-4).

Pod 1 methods: `mintPod`, `water(uint64)`, `nutrients`, `harvest`, `cleanup(axfer)`
Pod 2 methods: `mintPod2`, `water2(uint64)`, `nutrients2`, `harvest2`, `cleanup2(axfer)`
Shared: `breed(axfer,axfer,asset,asset)`, `checkTerp`, `checkTerp2`, `claimSlotToken(axfer)`, `unlockSlot(axfer)`
Admin: `bootstrap`, `setAsaIds(asset,asset,asset)`

Methods that validate preceding transactions (cleanup, breed, claimSlotToken, unlockSlot) use
TEALScript's `verifyAssetTransferTxn()` for type-safe group transaction validation.

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

The TEALScript contract uses ABI (ARC-4) method routing. Use `AtomicTransactionComposer`
with ABI method calls instead of raw `appArgs`:

```typescript
// Example: Water a plant using ABI method call
import abi from '../../contracts/artifacts/GrowPodEmpire.arc4.json';

const contract = new algosdk.ABIContract(abi);
const waterMethod = contract.getMethodByName(podId === 2 ? 'water2' : 'water');

const atc = new algosdk.AtomicTransactionComposer();
atc.addMethodCall({
  appID: CONTRACT_CONFIG.appId,
  method: waterMethod,
  methodArgs: [600], // cooldownSeconds (uint64)
  sender: account,
  suggestedParams,
  signer: walletSigner,
});

const result = await atc.execute(algodClient, 4);
```

For methods requiring group transactions (cleanup, breed, claimSlotToken, unlockSlot),
add the preceding asset transfer via `atc.addTransaction()` before `atc.addMethodCall()`.

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

1. Add method to the `GrowPodEmpire` class in `contracts/GrowPodEmpire.algo.ts`
2. TEALScript auto-routes ABI methods (no manual router needed)
3. Recompile: `npm run contract:compile`
4. Use the generated ABI (`contracts/artifacts/GrowPodEmpire.arc4.json`) to build frontend calls
5. Add frontend transaction builder in `hooks/use-algorand.ts` using `AtomicTransactionComposer`

## Gotchas

- Token amounts use 6 decimals (multiply/divide by 1,000,000)
- Water cooldown is 10 minutes (600 seconds) - TestNet setting
- Nutrient cooldown is 10 minutes (600 seconds) - TestNet setting
- Pod stages: 0=empty, 1-4=growing, 5=harvest_ready, 6=needs_cleanup
- 10 waters required to reach harvest stage
- Maximum 5 pod slots per player (start with 2)
- Wallet addresses are 58 characters (Algorand format)
- Cleanup only requires 500 $BUD burn (no ALGO fee)
