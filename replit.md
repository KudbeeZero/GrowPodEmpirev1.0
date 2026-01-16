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