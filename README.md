# GrowPod Empire V2.0

A blockchain-based idle/farming game built on **Algorand TestNet**. Players manage virtual hydroponic grow pods, cultivating plants through a 10-day growth cycle to harvest **$BUD** tokens. Features genetic breeding mechanics, terpene discovery, pest/disease management, and a dual-token economy.

## 📚 Documentation

- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contribution guidelines and workflow
- **[BRANCH_PROTECTION_GUIDE.md](./BRANCH_PROTECTION_GUIDE.md)** - Branch protection setup
- **[AI_WORKFLOW_GUIDE.md](./AI_WORKFLOW_GUIDE.md)** - Working with AI tools
- **[CLAUDE.md](./CLAUDE.md)** - Detailed development guide
- **[CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md)** - Deployment guide

## Tech Stack

- **Smart Contracts**: PyTeal (Algorand)
- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS (dark cyberpunk theme)
- **Wallet**: Pera Wallet Connect (@perawallet/connect)
- **Backend**: Express.js + PostgreSQL (Drizzle ORM)
- **Deployment**: Cloudflare Workers (optional)

## Token Economy

### $BUD (Harvest Commodity Token)
- **Total Supply Cap**: 10,000,000,000 (10B) with 6 decimals
- **Minted**: Only on harvest (0.25g base = 250,000,000 units per mature plant)
- **Burns**: Cleanup (500 $BUD), Breeding (1,000 $BUD), Store items, Upgrades

### $TERP (Terpene Rights/Governance Token)
- **Fixed Supply**: 100,000,000 (100M) with 6 decimals
- **Minted**: On rare/unique terpene-minor profiles at harvest (5,000–50,000 reward)
- **Staking**: 40% perpetual royalties on strain seed sales

## Core Gameplay

1. **Mint Pod**: Create soulbound GrowPod NFT (non-transferable until first harvest)
2. **Plant Seed**: Random DNA hash with hidden terpene/minor profile
3. **Water**: 2-hour cooldown, 10 waters = ready to harvest
4. **Harvest**: Mint $BUD based on yield calculation, check for rare $TERP
5. **Cleanup**: Burn 500 $BUD + 1 ALGO to reset pod for next cycle
6. **Breed**: Combine two plants in Combiner Lab (1,000 $BUD) for hybrid seeds

## Deployment Steps

### 1. Prerequisites
```bash
# Install AlgoKit
pip install algokit

# Install Python dependencies
pip install py-algorand-sdk pyteal

# Get TestNet ALGO from faucet
# https://bank.testnet.algorand.network/
```

### 2. Set Environment Variables
```bash
export ALGO_MNEMONIC="your twenty five word mnemonic here"
```

### 3. Compile Smart Contract
```bash
cd contracts
python contract.py
```

This generates:
- `approval.teal` - Main contract logic
- `clear.teal` - Clear state program

### 4. Deploy Contract (AlgoKit)
```bash
# Build the contract
algokit build

# Deploy to TestNet
algokit deploy --network testnet
```

### 5. Bootstrap ASAs ($BUD and $TERP)
```bash
python contracts/bootstrap.py
```

Save the output Asset IDs and update:
- `CONTRACT_CONFIG` in `client/src/hooks/use-algorand.ts`
- Environment variables for scripts

### 6. Set ASA IDs in Contract
```bash
export GROWPOD_APP_ID=<your_app_id>
export BUD_ASSET_ID=<bud_asset_id>
export TERP_ASSET_ID=<terp_asset_id>

python contracts/bootstrap.py  # If APP_ID is set, it will call set_asa_ids
```

### 7. Run Frontend
```bash
npm install
npm run dev
```

## Contract Scripts

| Script | Description |
|--------|-------------|
| `contracts/contract.py` | Main smart contract (PyTeal) |
| `contracts/bootstrap.py` | Create $BUD and $TERP ASAs |
| `contracts/mint.py` | Mint soulbound GrowPod NFT |
| `contracts/water.py` | Water plant (24h cooldown) |
| `contracts/harvest.py` | Harvest + check $TERP reward |
| `contracts/clean.py` | Cleanup pod (burn 500 $BUD + 1 ALGO) |
| `contracts/breed.py` | Breed plants (burn 1,000 $BUD) |

## Frontend Pages

- **Dashboard**: Pod status, balances, quick actions
- **Seed Vault**: View stored mystery/hybrid seeds
- **Combiner Lab**: Breed two plants for hybrid seeds
- **Supply Store**: Buy nutrients/controls with $BUD
- **Cure Vault**: Cure $BUD for bonus yields

## Environment Variables

```bash
# Required for deployment
ALGO_MNEMONIC=<25-word-mnemonic>

# Set after deployment
GROWPOD_APP_ID=<contract_app_id>
GROWPOD_APP_ADDRESS=<contract_address>
BUD_ASSET_ID=<bud_asa_id>
TERP_ASSET_ID=<terp_asa_id>

# Database
DATABASE_URL=<postgresql_connection_string>
```

## TestNet Cooldowns

For faster testing, the TestNet deployment uses reduced cooldowns:

| Cooldown | Duration |
|----------|----------|
| Water    | 10 minutes (600s) |
| Nutrients| 10 minutes (600s) |

### Technical Details
- The smart contract accepts an optional `cooldown_seconds` argument (args[1]) for the water methods
- Default cooldown is 600 seconds (10 minutes) for TestNet
- **Security**: The contract enforces a minimum cooldown of 600 seconds (10 minutes) on-chain

## Security Features

- **Configurable Water Cooldown**: 10 minute default for TestNet, enforced on-chain
- **Atomic Burns**: $BUD burns grouped with actions (cleanup, breed)
- **Soulbound NFTs**: Clawback mechanism prevents transfers
- **DNA Uniqueness**: Cryptographic hashing for plant genetics
- **Inner Transactions**: $BUD/$TERP minting via contract

## Network

- **Chain ID**: 416002 (Algorand TestNet)
- **Algod API**: https://testnet-api.algonode.cloud
- **Explorer**: https://testnet.algoexplorer.io

## Cloudflare Workers Deployment

For deploying to Cloudflare Workers with D1 databases, see the comprehensive guide:

📖 **[CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md)**

### Quick Start

```bash
# Run the automated setup script
./setup-cloudflare.sh

# Or manually:
npm run worker:whoami        # Get account info
npm run build                # Build for production
npm run worker:deploy        # Deploy to Cloudflare
```

### Required Secrets

Configure these secrets for Cloudflare Workers deployment:

```bash
# Database connection (if using external PostgreSQL)
npx wrangler secret put DATABASE_URL

# Other secrets as needed
npx wrangler secret put ADMIN_WALLET_ADDRESS
```

### GitHub Actions

Automated deployment is configured via `.github/workflows/deploy-cloudflare.yml`.

Required repository secrets:
- `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

## Repository Management

### Branch Management

The `main` branch is the single source of truth for this project. All development work should:
1. Start from the latest `main` branch
2. Go through pull request review
3. Merge back to `main` after approval
4. Delete feature branches after merge

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed workflow guidelines.

### Branch Cleanup Tools

Use the provided scripts to manage branches:

```bash
# Generate AI branch report
./scripts/ai-branch-report.sh

# Clean up stale branches (dry run)
./scripts/cleanup-branches.sh

# Actually delete stale branches
./scripts/cleanup-branches.sh --delete
```

### Setting Up Branch Protection

To protect the `main` branch from accidental changes:
1. Go to **Settings** → **Branches** → **Add rule**
2. Follow the guide in [BRANCH_PROTECTION_GUIDE.md](./BRANCH_PROTECTION_GUIDE.md)

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on:
- Branching strategy
- Development workflow
- Pull request process
- Code standards
- Working with AI tools

## License

MIT
