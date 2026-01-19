# GrowPod Empire - Replit Configuration

## Overview

GrowPod Empire is a blockchain-based idle/farming game built on the Algorand TestNet. Players manage virtual hydroponic grow pods, cultivating plants through a 10-day growth cycle to harvest $BUD tokens. The game features genetic breeding mechanics, terpene discovery, pest/disease management, and a dual-token economy ($BUD for gameplay, $TERP for rare discoveries).

The application uses a full-stack TypeScript architecture with React frontend, Express backend, PostgreSQL database, and PyTeal smart contracts for Algorand blockchain integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, bundled via Vite
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, React hooks for local state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom dark cyberpunk theme, Framer Motion for animations
- **Wallet Integration**: Pera Wallet Connect (@perawallet/connect) for Algorand wallet interactions

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript compiled with tsx
- **API Pattern**: RESTful endpoints defined in shared/routes.ts with Zod validation
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Build System**: Custom esbuild script for production bundling

### Smart Contract Architecture
- **Language**: PyTeal (Python) for Algorand smart contracts
- **Network**: Algorand TestNet (Chain ID 416002)
- **Contract Pattern**: Stateful application with local state per user (stage, water count, DNA, etc.)
- **Scripts**: Separate Python scripts for mint, water, harvest, breed, and cleanup operations

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: shared/schema.ts
- **Key Tables**: users (wallet address, token balances, timestamps)
- **Migrations**: Drizzle Kit with migrations output to ./migrations directory

### Key Design Patterns
- **Shared Types**: Common schema and route definitions in /shared directory used by both frontend and backend
- **Path Aliases**: @/ for client/src, @shared/ for shared directory
- **Mock Data**: Frontend hooks provide mock data when wallet is disconnected for demo purposes
- **Soulbound NFTs**: GrowPod NFTs use clawback mechanism to prevent transfers until first harvest

## External Dependencies

### Blockchain Services
- **Algorand TestNet**: Primary blockchain network via Algonode cloud API (https://testnet-api.algonode.cloud)
- **Pera Wallet**: Mobile and browser wallet for transaction signing
- **Pinata/IPFS**: NFT metadata and image hosting

### Database
- **PostgreSQL**: Primary data store, connection via DATABASE_URL environment variable

### Key npm Packages
- **algosdk**: Algorand JavaScript SDK for blockchain interactions
- **drizzle-orm / drizzle-kit**: Database ORM and migration tooling
- **express / express-session**: HTTP server and session management
- **@tanstack/react-query**: Async state management
- **zod**: Runtime type validation for API contracts

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `ALGO_MNEMONIC`: (for contract deployment scripts) 25-word Algorand wallet mnemonic
- `GROWPOD_APP_ID`: Deployed smart contract application ID
- `BUD_ASSET_ID`: $BUD ASA ID after bootstrap
- `TERP_ASSET_ID`: $TERP ASA ID after bootstrap
- `GROWPOD_APP_ADDRESS`: Contract application address

## Recent Changes (January 2026)

### Browser Notification System (Latest)
- Push notifications via Web Notification API (browser-based, not Pera Wallet)
- Dashboard includes "Enable Notifications" button to request permission
- Scheduled notifications for each pod:
  - **30 min before water ready**: "Pod #X water in 30 min"
  - **Water ready**: "Pod #X needs water!"
  - **30 min before nutrients ready**: "Pod #X nutrients in 30 min"
  - **Nutrient ready**: "Pod #X ready for nutrients!"
- Navigation bar shows badge when plants need attention (water or harvest ready)
- Notifications use unique tags to prevent duplicates per pod

### Pod Slot Progression System
- Players now start with 2 pod slots and can unlock up to 5 total slots
- After every 5 harvests, players can claim 1 Slot Token
- Claiming a Slot Token requires burning 2,500 $BUD
- Burning 1 Slot Token unlocks 1 new pod slot
- Progression: 5 harvests → 2,500 $BUD → 1 Slot Token → 1 new slot

### Tri-Token Economy
- **$BUD**: 10B total supply cap, 6 decimals, minted on harvest
- **$TERP**: 100M fixed supply, 6 decimals, minted on rare terpene profiles (5k-50k reward)
- **Slot Token**: 1M fixed supply, 0 decimals, earned through harvests for slot unlocks

### Contract Local State Optimization
- Optimized local state to fit Algorand's 16-key limit
- Removed start_round fields from both pods
- Current local state: 12 uints + 4 bytes = 16 keys (maximum allowed)
- Pod 1: stage, water_count, last_watered, nutrient_count, last_nutrients, dna, terpene_profile
- Pod 2: stage_2, water_count_2, last_watered_2, nutrient_count_2, last_nutrients_2, dna_2, terpene_profile_2
- Slots: harvest_count, pod_slots

### Smart Contract Updates
- Added Slot Token ASA creation in bootstrap (tri-token: BUD, TERP, SLOT)
- Added harvest_count tracking: increments on each harvest
- Added pod_slots tracking: starts at 1, max 5
- Added claim_slot_token method: burn 2,500 $BUD to claim after 5 harvests
- Added unlock_slot method: burn 1 Slot Token to unlock new pod slot
- Cleanup requires burning 500 $BUD + 1 ALGO fee
- Breeding requires burning 1,000 $BUD

### Contract Methods
- **Pod 1**: mint_pod, water, nutrients, harvest, cleanup
- **Pod 2**: mint_pod_2, water_2, nutrients_2, harvest_2, cleanup_2
- **Shared**: check_terp, check_terp_2, breed, bootstrap, set_asa_ids
- **Slots**: claim_slot_token, unlock_slot

### Frontend Updates
- Added slotAssetId to CONTRACT_CONFIG
- Updated useTokenBalances to include slot token balance
- Updated useGameState to return harvestCount, podSlots, canClaimSlotToken, canUnlockSlot
- Added claimSlotToken and unlockSlot transaction functions

### TestNet Growth Cycle (January 2026)
- Water cooldown: 2 hours (7200 seconds) by default
- 10 waters required to reach harvest
- Yield bonuses require 10+ waters/nutrients

### Visual Growth Stage System (v2.0)
- Added 7 unique pod images for each growth stage:
  - Stage 0: Empty pod (generated)
  - Stage 1: Seedling (user-provided)
  - Stage 2: Young plant (user-provided)
  - Stage 3: Vegetative (generated)
  - Stage 4: Flowering (user-provided)
  - Stage 5: Harvest ready (user-provided)
  - Stage 6: Needs cleanup (generated)
- PodCard displays stage-appropriate images with AnimatePresence transitions
- Status-based image selection handles null stages for empty/dead/cleanup pods
- Harvest-ready pods have glowing amber effect

### Frontend Updates
- Enhanced `use-algorand.ts` with algosdk v3 API for balance/state queries
- Added `useTransactions` hook with real blockchain transaction functions:
  - `optInToApp`: Opt into the smart contract
  - `optInToAsset`: Opt into $BUD/$TERP ASAs
  - `mintPod`: Mint new GrowPod NFT + plant seed
  - `waterPlant`: Water plant with 24h cooldown
  - `harvestPlant`: Harvest and receive $BUD tokens
  - `cleanupPod`: Grouped transaction (burn 500 $BUD + 1 ALGO + app call)
  - `breedPlants`: Grouped transaction (burn 1000 $BUD + app call)
- Updated Dashboard with real transaction handlers (not mock)
- Updated CombinerLab with real breed transaction
- Contract config reads from VITE_ environment variables
- Browser-safe encoding (TextEncoder instead of Buffer)

### Environment Variables (Frontend)
Add to `.env` for production:
- `VITE_GROWPOD_APP_ID`: Deployed smart contract application ID
- `VITE_BUD_ASSET_ID`: $BUD ASA ID
- `VITE_TERP_ASSET_ID`: $TERP ASA ID
- `VITE_GROWPOD_APP_ADDRESS`: Contract application address

### Contract Scripts
- `contracts/contract.py`: Main PyTeal contract with all game logic
- `contracts/bootstrap.py`: Creates $BUD and $TERP ASAs
- `contracts/mint.py`: Mints soulbound GrowPod NFT + plants mystery seed
- `contracts/water.py`: Waters plant with 24h cooldown check
- `contracts/harvest.py`: Harvests plant + checks for $TERP reward
- `contracts/clean.py`: Cleanup pod (burn 500 $BUD + 1 ALGO)
- `contracts/breed.py`: Breed two plants (burn 1,000 $BUD)