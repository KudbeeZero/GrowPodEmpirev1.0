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

### Gameplay Updates
- Added 2-pod maximum limit per user for balanced gameplay
- Implemented nutrient system with 6-hour cooldown alongside 24-hour watering
- Added quick "Mint Mystery Seed" button for direct planting from Dashboard
- Updated PodCard with nutrient progress bar and dual Water/Feed action buttons
- Fixed NaN handling for undefined nutrient fields with safe value extraction helpers
- Updated active pod counting to include needs_cleanup status pods

### Smart Contract Updates
- Added support for 2 pods per user with separate local state keys (stage_2, water_count_2, etc.)
- Added nutrient system with 6-hour cooldown (nutrient_count, last_nutrients for both pods)
- Added $BUD and $TERP ASA creation via inner transactions in bootstrap
- Implemented harvest logic with yield calculation (0.25g base = 250,000,000 units)
- Added nutrient bonus: up to 30% extra yield for consistent feeding
- Added `check_and_mint_terp` function for rare terpene profile rewards
- Cleanup requires burning 500 $BUD + 1 ALGO fee
- Breeding requires burning 1,000 $BUD

### Contract Methods
- **Pod 1**: mint_pod, water, nutrients, harvest, cleanup, check_terp
- **Pod 2**: mint_pod_2, water_2, nutrients_2, harvest_2, cleanup_2, check_terp_2
- **Shared**: breed, bootstrap, set_asa_ids

### Token Specifications
- **$BUD**: 10B total supply cap, 6 decimals, minted only on harvest
- **$TERP**: 100M fixed supply, 6 decimals, minted on rare profiles (5k-50k reward)

### TestNet Fast Mode (January 2026)
- Simplified growth cycle: 2 waters to reach harvest (instead of 10)
- Water cooldown: 24h (MainNet) or 2h (TestNet Fast Mode)
- Frontend checkbox "Fast Mode (TestNet)" in Quick Stats card
- Contract water/water_2 methods accept optional cooldown_seconds via args[1]
- Minimum cooldown enforced on-chain at 2 hours (7200s) to prevent abuse
- WATER_COOLDOWN_TESTNET constant (7200s) added to use-algorand.ts
- Yield bonuses now require 2+ waters/nutrients instead of 10

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