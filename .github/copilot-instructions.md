# GitHub Copilot Instructions for GrowPod Empire

## Project Overview

GrowPod Empire is a blockchain-based idle farming game on **Algorand TestNet**. Players manage hydroponic grow pods, cultivating plants through growth cycles to harvest **$BUD** tokens with genetic breeding mechanics and terpene discovery.

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript, Tailwind CSS (dark cyberpunk theme)
- **Backend**: Hybrid architecture - Express.js (development/legacy) + Cloudflare Workers (production deployment)
- **Database**: PostgreSQL with Drizzle ORM (development), D1 (Cloudflare Workers production)
- **Blockchain**: Algorand (PyTeal smart contracts), Pera Wallet
- **State Management**: TanStack Query, React Context
- **Routing**: Wouter

## Project Structure

```
project-root/
├── client/src/          # React frontend
│   ├── App.tsx          # Main app with routing
│   ├── components/      # Reusable UI (shadcn/ui in ui/)
│   ├── pages/           # Route pages (Dashboard, SeedBank, etc.)
│   ├── hooks/           # Custom hooks (use-algorand.ts for blockchain)
│   ├── context/         # AlgorandContext.tsx for wallet state
│   └── lib/             # Utilities
├── server/              # Express backend (development)
│   ├── routes.ts        # API endpoints
│   ├── storage.ts       # Database operations
│   └── db.ts            # Drizzle connection
├── src/                 # Cloudflare Worker (production)
│   ├── worker.ts        # Main worker entry
│   └── security-monitor.ts  # Security monitoring worker
├── shared/              # Shared TypeScript code
│   ├── schema.ts        # Drizzle schema + types
│   └── routes.ts        # API route definitions
└── contracts/           # Algorand smart contracts (PyTeal)
    ├── contract.py      # Main contract
    ├── contract_v2.py   # V2 NFT contract
    └── *.teal           # Compiled TEAL
```

## Development Commands

```bash
npm run dev           # Start dev server (frontend + Express backend)
npm run dev:worker    # Start Cloudflare Worker (alternative backend)
npm run check         # Type checking
npm run build         # Production build
npm run db:push       # Push database schema changes
npx wrangler deploy   # Deploy to Cloudflare Workers
```

## Key Conventions

### Import Paths (TypeScript aliases)
```typescript
import { Button } from "@/components/ui/button";
import { useAlgorand } from "@/hooks/use-algorand";
import type { User } from "@shared/schema";
```

### Component Patterns
- Use shadcn/ui components from `@/components/ui/`
- Pages go in `client/src/pages/`
- Custom hooks in `client/src/hooks/`
- Use `useToast()` for user notifications
- Use TanStack Query (`useQuery`/`useMutation`) for API calls

### Styling
- Tailwind CSS with custom dark theme
- Color tokens: `primary`, `secondary`, `muted`, `accent`, `destructive`
- Use `cn()` utility from `@/lib/utils` for conditional classes
- Framer Motion for animations

### State Management
- Wallet state via `AlgorandContext`
- Server state via TanStack Query
- Local UI state via React `useState`
- Blockchain state from `algodClient.accountInformation()`

### Blockchain Integration
- Contract config in `AlgorandContext.tsx` (`CONTRACT_CONFIG`)
- Transaction builders in `hooks/use-algorand.ts`
- Token amounts use 6 decimals (multiply/divide by 1,000,000)
- Cooldowns: 10 minutes (600s) for water and nutrients (TestNet)

### API Patterns
- Routes defined in `server/routes.ts`
- Database operations in `server/storage.ts`
- Schema/types in `shared/schema.ts`
- Use Zod for input validation
- Return appropriate HTTP status codes

### Error Handling
- Wrap async operations in try/catch
- Use toast notifications for user feedback
- Validate inputs with Zod schemas

## Environment Variables

### Required
- `DATABASE_URL`: PostgreSQL connection string

### Optional (Blockchain)
- `VITE_GROWPOD_APP_ID`: Algorand app ID (default: 754825112)
- `VITE_BUD_ASSET_ID`: $BUD token ID (default: 754825127)
- `VITE_TERP_ASSET_ID`: $TERP token ID (default: 754825128)
- `VITE_SLOT_ASSET_ID`: $SLOT token ID (default: 754825129)
- `VITE_GROWPOD_APP_ADDRESS`: Contract address
- `ADMIN_WALLET_ADDRESS`: For admin features

## Common Tasks

### Adding a New Page
1. Create `client/src/pages/NewPage.tsx`
2. Add route in `client/src/App.tsx`: `<Route path="/new" component={NewPage} />`
3. Add navigation link in `components/Navigation.tsx`

### Adding a New API Endpoint
1. Add route in `server/routes.ts`
2. Add storage method in `server/storage.ts` if needed
3. Update schema in `shared/schema.ts` if needed

### Adding Smart Contract Method
1. Add method in `contracts/contract.py`
2. Add to router in `approval_program()`
3. Recompile: `cd contracts && python contract.py`
4. Add frontend transaction builder in `hooks/use-algorand.ts`

## Important Notes

- Pod stages: 0=empty, 1-4=growing, 5=harvest_ready, 6=needs_cleanup
- 10 waters required to reach harvest stage
- Maximum 5 pod slots per player (start with 2)
- Wallet addresses are 58 characters (Algorand format)
- TestNet network: Chain ID 416002, Algod API: https://testnet-api.algonode.cloud

## Additional Documentation

For comprehensive guidance, see:
- `CLAUDE.md` - Detailed development guide for AI assistants
- `README.md` - Project overview and deployment instructions
- `design_guidelines.md` - UI/UX design patterns
