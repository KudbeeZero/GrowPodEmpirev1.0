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
- **Key Tables**: users (wallet address, token balances, timestamps), player_stats (leaderboard tracking)
- **Database Setup**: Run `npm run db:push` to sync schema from shared/schema.ts to PostgreSQL
- **Note**: This project uses `db:push` for schema sync rather than migration files

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

### Seed Bank System (Latest)
- **Seed Bank Page**: Premium genetics marketplace at /seed-bank with stylish seed profile cards
- **Rarity Tiers**: Common, Uncommon, Rare, Legendary, Mythic with distinct visual styles
- **Seed Attributes**: Custom terpene profiles, effects, flavor notes, THC/CBD ranges, growth bonuses
- **Glow Effects**: Each seed has customizable glow color for visual distinction
- **Limited Supply**: Seeds can have optional total supply limits
- **Per-User Limits**: maxPerUser field enforces purchase limits (legendaries/mythics = 1 per player)
- **Admin Controls**: Seed creation and deletion available in Admin page
- **Database**: seed_bank table (seed metadata), user_seeds table (player inventory) with foreign key references
- **Seed Usage**: Players can use purchased seeds when planting in pods (instead of mystery seeds). Uses POST /api/user-seeds/:seedId/use endpoint
- **Available Seeds** (10 total):
  - **Common**: Crystal Cookies (500 $BUD), Strawberry Fields (600 $BUD)
  - **Uncommon**: Midnight Mango (1K $BUD), Electric Lemonade (1.2K $BUD), Golden Sunset (1.5K $BUD)
  - **Rare**: Neon Nebula (2.5K $BUD), Arctic Thunder (3K $BUD)
  - **Legendary**: Purple Diddy Punch (5K $BUD), Quantum Kush (7.5K $BUD)
  - **Mythic**: Void Walker (15K $BUD)
- **API Endpoints**:
  - GET `/api/seed-bank` - List all available seeds
  - GET `/api/seed-bank/:id` - Get specific seed details
  - POST `/api/seed-bank` - Create seed (admin only)
  - DELETE `/api/seed-bank/:id` - Delete seed (admin only)
  - POST `/api/seed-bank/:id/purchase` - Purchase seed with $BUD
  - GET `/api/seed-bank/user/:walletAddress` - Get user's seed inventory

### Announcement Video System
- **Mandatory Video Announcements**: Admin-uploaded videos shown to users as fullscreen modal
- **Fullscreen Modal**: Video plays in centered modal with cyberpunk styling, close button only appears after video ends
- **Per-User Watch Tracking**: Database tracks which users have watched each announcement via lastSeenAnnouncementId
- **Account-Aware**: Modal resets when wallet account changes, ensuring each user must watch
- **Admin Page**: /admin route (protected by ADMIN_WALLET_ADDRESS env var) for uploading announcement videos
- **Object Storage Integration**: Videos stored via Replit Object Storage with signed URLs
- **Database**: New `announcement_videos` table (id, objectPath, createdAt), users table gets lastSeenAnnouncementId field
- **API Endpoints**:
  - GET `/api/announcement/check?walletAddress=` - Check if user needs to watch (returns needsToWatch, announcement)
  - POST `/api/announcements` - Upload new announcement (admin only)
  - POST `/api/announcement/:id/watched?walletAddress=` - Mark announcement as watched for user

### Jukebox Feature
- **Music Player**: Full-featured audio player at /jukebox with cyberpunk aesthetic
- **Audio Visualizer**: Real-time frequency visualization using Canvas API with neon effects
- **Player Controls**: Play/pause, skip, shuffle, repeat modes, volume control with progress bar
- **Song Management**: Add songs via dialog with title, artist, and audio file upload
- **Object Storage Integration**: Audio files stored via Replit Object Storage with signed URLs
- **Database**: New `songs` table tracking title, artist, objectPath, playCount
- **Navigation**: Added to Game dropdown (desktop) and Game section (mobile)
- **API Endpoints**:
  - GET `/api/jukebox/songs` - List all songs
  - POST `/api/jukebox/songs` - Add song (title, artist, objectPath)
  - POST `/api/jukebox/songs/:id/play` - Increment play count
  - DELETE `/api/jukebox/songs/:id` - Remove song

### Navigation & Mobile Responsive Improvements
- **Desktop Navigation**: Redesigned with shadcn NavigationMenu dropdowns
  - Dashboard as standalone link
  - "Game" dropdown: Seed Vault, Combiner Lab, Supply Store, Cure Vault
  - "Community" dropdown: Leaderboards, Stats, Achievements, How to Play
- **Mobile Menu**: Sheet-based slide-out with ScrollArea for scrolling
  - Section dividers for Game/Community categories
  - 48px minimum touch targets (exceeds Apple's 44px guideline)
  - Safe area insets for phones with notches (iPhone X+, modern Android)
- **CSS Safe Areas**: Added pb-safe, pt-safe, px-safe utility classes
- **Horizontal Overflow**: Prevented with overflow-x: hidden on html/body

### Community Features
- **Tutorial Page**: Step-by-step guide for new players at /tutorial
- **Leaderboards**: Rankings by harvests, $BUD earned, and $TERP earned at /leaderboards
- **Statistics Dashboard**: Global game metrics at /stats
- **Achievements System**: 8 milestone badges tracking player progress at /achievements
- **Social Sharing**: Share harvest results on X/Twitter with dialog after each harvest
- **Player Stats Database**: New player_stats table tracking harvests, tokens earned, rare terpenes

### API Endpoints Added
- GET `/api/leaderboard/harvests` - Top players by harvest count
- GET `/api/leaderboard/bud` - Top players by $BUD earned
- GET `/api/leaderboard/terp` - Top players by $TERP earned
- GET `/api/stats/global` - Global game statistics
- POST `/api/stats/record-harvest` - Record harvest for leaderboard tracking

### Browser Notification System
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