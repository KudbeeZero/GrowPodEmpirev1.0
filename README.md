# GrowPod Empire V2.0

A blockchain-based idle/farming game built on **Algorand TestNet**. Players manage virtual hydroponic grow pods, cultivating plants through a 10-day growth cycle to harvest **$BUD** tokens. Features genetic breeding mechanics, terpene discovery, pest/disease management, and a dual-token economy.

## 📚 Documentation

- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contribution guidelines and workflow
- **[BRANCH_PROTECTION_GUIDE.md](./BRANCH_PROTECTION_GUIDE.md)** - Branch protection setup
- **[AI_WORKFLOW_GUIDE.md](./AI_WORKFLOW_GUIDE.md)** - Working with AI tools
- **[CLAUDE.md](./CLAUDE.md)** - Detailed development guide
- **[CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md)** - Deployment guide
- **[CANNABIS_HISTORY_FEATURE.md](./CANNABIS_HISTORY_FEATURE.md)** - History of Cannabis feature documentation
- **[VALIDATION_SYSTEM.md](./VALIDATION_SYSTEM.md)** - Repository consistency validation system
- **[VALIDATION_QUICK_REFERENCE.md](./VALIDATION_QUICK_REFERENCE.md)** - Quick reference for validation commands

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

### 2. Deploy Smart Contract to TestNet

**Quick Start: Use the deployment script**
```bash
./scripts/deploy-testnet.sh
```

This automated script will:
- Compile the contract
- Deploy to TestNet using the configured admin wallet
- Bootstrap $BUD, $TERP, and Slot tokens
- Output environment variables for your configuration

**For detailed deployment instructions and admin wallet information, see:**
- `ADMIN_WALLET_DEPLOYMENT.md` - Complete deployment guide with admin wallet setup

**Alternative: Manual deployment**
```bash
# Set environment variable
export ALGO_MNEMONIC="your twenty five word mnemonic here"

# Compile and deploy
cd contracts
python3 contract.py
python3 deploy.py
```

### 3. Run Frontend
```bash
npm install
npm run dev
```

## Contract Scripts

| Script | Description |
|--------|-------------|
| `contracts/contract.py` | Main smart contract (PyTeal) - compiles to TEAL |
| `contracts/deploy.py` | Full deployment script - deploys contract and bootstraps tokens |
| `contracts/bootstrap.py` | Legacy script - creates $BUD and $TERP ASAs separately |
| `scripts/deploy-testnet.sh` | **Recommended** - One-click deployment script with admin wallet |

## Frontend Pages

- **Dashboard**: Pod status, balances, quick actions
- **Seed Vault**: View stored mystery/hybrid seeds
- **Combiner Lab**: Breed two plants for hybrid seeds
- **Supply Store**: Buy nutrients/controls with $BUD
- **Cure Vault**: Cure $BUD for bonus yields
- **Cannabis History**: Educational section exploring 5000 years of cannabis history with interactive features (Timeline, Quiz, Myths, World Map)

## Environment Variables

See `ADMIN_WALLET_DEPLOYMENT.md` for complete setup instructions.

### Local Development (.dev.vars)
```bash
# Admin wallet (TestNet only)
ADMIN_WALLET_ADDRESS=ZK55X7SGIGMLGORVNJHHPTYZMZOGSQNVROBHX7N27X6ZEQRHAZ2UPKOXQU
ALGO_MNEMONIC="your 25-word mnemonic here"

# Contract configuration (set after deployment)
VITE_GROWPOD_APP_ID=<contract_app_id>
VITE_GROWPOD_APP_ADDRESS=<contract_address>
VITE_BUD_ASSET_ID=<bud_asa_id>
VITE_TERP_ASSET_ID=<terp_asa_id>
VITE_SLOT_ASSET_ID=<slot_asa_id>

# Database
DATABASE_URL=<postgresql_connection_string>
```

### Production (Cloudflare Secrets)
```bash
npx wrangler secret put ADMIN_WALLET_ADDRESS
npx wrangler secret put DATABASE_URL
# VITE_ variables are set in build-time environment
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
