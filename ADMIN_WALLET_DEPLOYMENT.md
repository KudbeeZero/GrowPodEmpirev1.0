# Admin Wallet Deployment Guide - TestNet Only

This guide explains how to deploy the GrowPod Empire smart contract with the updated admin wallet on Algorand TestNet.

## Admin Wallet Information (TestNet Only)

**⚠️ WARNING: This wallet is for TestNet deployment only. Never use TestNet mnemonics on MainNet.**

- **Mnemonic**: `wheat spread skull erosion actual patient noble abstract valve switch fire bottom ceiling coral visa connect marine accident forum kite finger energy convince above small`
- **Address**: `ZK55X7SGIGMLGORVNJHHPTYZMZOGSQNVROBHX7N27X6ZEQRHAZ2UPKOXQU`
- **Network**: Algorand TestNet (Chain ID: 416002)

## Prerequisites

Before deploying, ensure you have:

1. **Python 3.11+** with required packages:
   ```bash
   pip install py-algorand-sdk pyteal
   ```

2. **TestNet ALGO** - Fund the admin wallet with at least 2 ALGO:
   - Visit: https://bank.testnet.algorand.network/
   - Enter address: `ZK55X7SGIGMLGORVNJHHPTYZMZOGSQNVROBHX7N27X6ZEQRHAZ2UPKOXQU`
   - Request TestNet ALGO

3. **Environment Variables** - Set the mnemonic:
   ```bash
   export ALGO_MNEMONIC="wheat spread skull erosion actual patient noble abstract valve switch fire bottom ceiling coral visa connect marine accident forum kite finger energy convince above small"
   ```

## Deployment Steps

### Step 1: Compile the Contract

From the repository root:

```bash
cd contracts
python3 contract.py
```

This generates:
- `approval.teal` - Main contract logic
- `clear.teal` - Clear state program

### Step 2: Deploy to TestNet

Deploy the contract and create tokens:

```bash
cd contracts
ALGO_MNEMONIC="wheat spread skull erosion actual patient noble abstract valve switch fire bottom ceiling coral visa connect marine accident forum kite finger energy convince above small" python3 deploy.py
```

The script will:
1. ✅ Compile the contract
2. ✅ Deploy to TestNet
3. ✅ Fund the contract address
4. ✅ Bootstrap $BUD, $TERP, and Slot tokens
5. ✅ Output environment variables

### Step 3: Update Environment Configuration

After successful deployment, the script outputs environment variables. Update these files:

#### Update `.dev.vars` (local development):
```bash
ADMIN_WALLET_ADDRESS=ZK55X7SGIGMLGORVNJHHPTYZMZOGSQNVROBHX7N27X6ZEQRHAZ2UPKOXQU
ALGO_MNEMONIC="wheat spread skull erosion actual patient noble abstract valve switch fire bottom ceiling coral visa connect marine accident forum kite finger energy convince above small"
VITE_GROWPOD_APP_ID=<new_app_id>
VITE_BUD_ASSET_ID=<new_bud_id>
VITE_TERP_ASSET_ID=<new_terp_id>
VITE_SLOT_ASSET_ID=<new_slot_id>
VITE_GROWPOD_APP_ADDRESS=<new_app_address>
```

#### Update `.replit` (Replit environment):
```toml
[userenv.shared]
VITE_GROWPOD_APP_ID = "<new_app_id>"
VITE_BUD_ASSET_ID = "<new_bud_id>"
VITE_TERP_ASSET_ID = "<new_terp_id>"
VITE_SLOT_ASSET_ID = "<new_slot_id>"
VITE_GROWPOD_APP_ADDRESS = "<new_app_address>"
```

#### Update Cloudflare Secrets (production):
```bash
npx wrangler secret put ADMIN_WALLET_ADDRESS
# Enter: ZK55X7SGIGMLGORVNJHHPTYZMZOGSQNVROBHX7N27X6ZEQRHAZ2UPKOXQU

# Optional: If you need to redeploy from Cloudflare
npx wrangler secret put ALGO_MNEMONIC
# Enter the mnemonic when prompted
```

### Step 4: Update Code References

The deployment script automatically updates environment variables, but verify these files reference the correct configuration:

- `client/src/context/AlgorandContext.tsx` - Contract configuration
- `server/routes.ts` - Admin wallet verification
- `.replit` - Development environment

### Step 5: Verify Deployment

1. **Check on AlgoExplorer**:
   - Application: https://testnet.algoexplorer.io/application/`<app_id>`
   - $BUD Token: https://testnet.algoexplorer.io/asset/`<bud_id>`
   - $TERP Token: https://testnet.algoexplorer.io/asset/`<terp_id>`
   - Slot Token: https://testnet.algoexplorer.io/asset/`<slot_id>`

2. **Test in Application**:
   ```bash
   npm run dev
   ```
   - Connect Pera Wallet to TestNet
   - Opt-in to the application
   - Test minting a pod

3. **Verify Admin Functions**:
   - Admin wallet should have full access to admin endpoints
   - Other wallets should have restricted access where applicable

## Security Notes

### TestNet vs MainNet

**Current Configuration: TestNet Only**

- Chain ID: `416002` (TestNet)
- Algod API: `https://testnet-api.algonode.cloud`
- All token amounts are for testing purposes only

**⚠️ NEVER use TestNet credentials on MainNet**

### Admin Wallet Permissions

The admin wallet (`ZK55X7SGIGMLGORVNJHHPTYZMZOGSQNVROBHX7N27X6ZEQRHAZ2UPKOXQU`) has:

- **Smart Contract Owner**: Can call `bootstrap` and `set_asa_ids`
- **Token Manager**: Has manager, reserve, freeze, and clawback roles for $BUD, $TERP, and Slot tokens
- **Admin API Access**: Can upload songs, announcements, and manage seed bank (if `ADMIN_WALLET_ADDRESS` is set in server environment)

### Protecting Secrets

1. **Never commit** `.dev.vars` or `.env` files (they're in `.gitignore`)
2. **Use Cloudflare Secrets** for production environment variables
3. **Use GitHub Secrets** for CI/CD deployment automation
4. **Rotate credentials** if compromised

## Troubleshooting

### Insufficient Balance Error

```
ERROR: Insufficient funds. Need at least 2 ALGO for deployment.
```

**Solution**: Fund the admin wallet with TestNet ALGO:
- Visit: https://bank.testnet.algorand.network/
- Request ALGO for: `ZK55X7SGIGMLGORVNJHHPTYZMZOGSQNVROBHX7N27X6ZEQRHAZ2UPKOXQU`

### Network Connection Error

```
URLError: <urlopen error [Errno -5] No address associated with hostname>
```

**Solution**: Check your internet connection and TestNet API availability:
- Test: `curl https://testnet-api.algonode.cloud/health`
- Alternative API: `https://testnet-api.4160.nodely.io` (update in `deploy.py`)

### ASA Already Created Error

```
ERROR: ASA IDs already set
```

**Solution**: This contract instance already has tokens. Either:
1. Use the existing tokens (check global state)
2. Deploy a new contract instance

### Wrong Network

If you accidentally configured for MainNet:

1. **Stop immediately**
2. Verify `CHAIN_ID = 416002` in `AlgorandContext.tsx`
3. Verify `ALGOD_SERVER = 'https://testnet-api.algonode.cloud'`
4. Re-check all environment variables

## Post-Deployment Checklist

- [ ] Contract deployed successfully
- [ ] All three tokens ($BUD, $TERP, Slot) created
- [ ] Environment variables updated in `.dev.vars`
- [ ] Environment variables updated in `.replit` (if applicable)
- [ ] Cloudflare secrets configured (for production)
- [ ] Contract verified on TestNet AlgoExplorer
- [ ] Admin wallet can access admin functions
- [ ] Regular users can opt-in and play
- [ ] Documentation updated with new contract IDs

## Redeployment

If you need to redeploy (new features, bug fixes, etc.):

1. Compile updated contract: `python3 contract.py`
2. Run deployment script with same mnemonic
3. Update environment variables with new IDs
4. Users will need to opt-in to new contract
5. Previous contract data is preserved on-chain but inaccessible

## Resources

- **Algorand TestNet Faucet**: https://bank.testnet.algorand.network/
- **AlgoExplorer TestNet**: https://testnet.algoexplorer.io/
- **Pera Wallet**: https://perawallet.app/ (switch to TestNet in settings)
- **Algorand Developer Docs**: https://developer.algorand.org/
- **PyTeal Documentation**: https://pyteal.readthedocs.io/

## Support

For issues or questions:
1. Check this guide first
2. Review contract code in `contracts/contract.py`
3. Check deployment logs for specific errors
4. Verify TestNet API status at https://status.algonode.io/
