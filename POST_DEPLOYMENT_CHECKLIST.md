# Post-Deployment Verification Checklist

Use this checklist after deploying the smart contract with the new admin wallet to ensure everything is configured correctly.

## ✅ Deployment Verification

### 1. Contract Deployment
- [ ] Contract successfully deployed to TestNet
- [ ] App ID received and recorded
- [ ] Contract address generated and recorded
- [ ] All three tokens ($BUD, $TERP, Slot) created via bootstrap

### 2. Run Verification Script
```bash
python scripts/verify-deployment.py <APP_ID>
```

Expected output:
- ✅ Contract found on TestNet
- ✅ Creator matches expected admin wallet: `ZK55X7SGIGMLGORVNJHHPTYZMZOGSQNVROBHX7N27X6ZEQRHAZ2UPKOXQU`
- ✅ Owner matches expected admin wallet
- ✅ All ASAs created (BUD, TERP, Slot)
- ✅ ASA creators match admin wallet

### 3. Update Environment Files

#### Update `.dev.vars` (local development)
```bash
ADMIN_WALLET_ADDRESS=ZK55X7SGIGMLGORVNJHHPTYZMZOGSQNVROBHX7N27X6ZEQRHAZ2UPKOXQU
ALGO_MNEMONIC="wheat spread skull erosion actual patient noble abstract valve switch fire bottom ceiling coral visa connect marine accident forum kite finger energy convince above small"
VITE_GROWPOD_APP_ID=<new_app_id>
VITE_BUD_ASSET_ID=<new_bud_id>
VITE_TERP_ASSET_ID=<new_terp_id>
VITE_SLOT_ASSET_ID=<new_slot_id>
VITE_GROWPOD_APP_ADDRESS=<new_app_address>
```

- [ ] `.dev.vars` updated with new contract IDs

#### Update `.replit` (Replit environment)
```toml
[userenv.shared]
VITE_GROWPOD_APP_ID = "<new_app_id>"
VITE_BUD_ASSET_ID = "<new_bud_id>"
VITE_TERP_ASSET_ID = "<new_terp_id>"
VITE_SLOT_ASSET_ID = "<new_slot_id>"
VITE_GROWPOD_APP_ADDRESS = "<new_app_address>"
```

- [ ] `.replit` updated with new contract IDs

#### Update Cloudflare Secrets (production)
```bash
npx wrangler secret put ADMIN_WALLET_ADDRESS
# Enter: ZK55X7SGIGMLGORVNJHHPTYZMZOGSQNVROBHX7N27X6ZEQRHAZ2UPKOXQU
```

- [ ] Cloudflare `ADMIN_WALLET_ADDRESS` secret configured
- [ ] Cloudflare environment variables set for VITE_ prefixed values

### 4. Verify on AlgoExplorer

Visit the following URLs (replace with actual IDs):

- Contract: `https://testnet.algoexplorer.io/application/<APP_ID>`
- $BUD Token: `https://testnet.algoexplorer.io/asset/<BUD_ID>`
- $TERP Token: `https://testnet.algoexplorer.io/asset/<TERP_ID>`
- Slot Token: `https://testnet.algoexplorer.io/asset/<SLOT_ID>`

Check:
- [ ] Contract exists and is active
- [ ] Global state shows correct owner address
- [ ] $BUD total supply: 10,000,000,000 (with 6 decimals)
- [ ] $TERP total supply: 100,000,000 (with 6 decimals)
- [ ] Slot token created with correct parameters
- [ ] All tokens show admin wallet as creator/manager

## ✅ Code Configuration Verification

### 5. Update Frontend Configuration

File: `client/src/context/AlgorandContext.tsx`

Verify the `CONTRACT_CONFIG` uses environment variables:
```typescript
export const CONTRACT_CONFIG = {
  appId: Number(import.meta.env.VITE_GROWPOD_APP_ID) || 753910199,
  budAssetId: Number(import.meta.env.VITE_BUD_ASSET_ID) || 753910204,
  terpAssetId: Number(import.meta.env.VITE_TERP_ASSET_ID) || 753910205,
  slotAssetId: Number(import.meta.env.VITE_SLOT_ASSET_ID) || 753910206,
  appAddress: import.meta.env.VITE_GROWPOD_APP_ADDRESS || '...',
};
```

- [ ] Contract configuration reads from environment variables
- [ ] No hardcoded IDs in production code paths

### 6. Update Server Configuration

File: `server/routes.ts`

Verify admin wallet check:
```typescript
const ADMIN_WALLET = process.env.ADMIN_WALLET_ADDRESS || "";
```

- [ ] Server reads admin wallet from environment
- [ ] Admin routes properly protected

## ✅ Functional Testing

### 7. Build and Start Application
```bash
npm run build
npm run dev
```

- [ ] Application builds without errors
- [ ] Application starts successfully
- [ ] No console errors related to contract configuration

### 8. Wallet Connection Test

Using Pera Wallet on TestNet:
- [ ] Can connect wallet to application
- [ ] Wallet shows as connected
- [ ] Can see ALGO balance

### 9. Opt-In Test
- [ ] Can opt-in to application
- [ ] Transaction succeeds
- [ ] Local state initialized correctly
- [ ] Shows 2 initial pod slots

### 10. Token Opt-In Test
- [ ] Can opt-in to $BUD token
- [ ] Can opt-in to $TERP token
- [ ] Can opt-in to Slot token
- [ ] All opt-ins succeed

### 11. Game Flow Test
- [ ] Can mint a pod (Pod 1)
- [ ] Pod shows as stage 1 (growing)
- [ ] Can water the plant
- [ ] Cooldown enforced (10 minutes on TestNet)
- [ ] Can add nutrients
- [ ] Stage progresses correctly
- [ ] Can harvest when ready (stage 5)
- [ ] $BUD minted to wallet
- [ ] Can cleanup pod (burns 500 $BUD)

### 12. Admin Functions Test (Admin Wallet Only)

Connect with admin wallet:
- [ ] Can access admin panel (if implemented)
- [ ] Admin-protected endpoints work
- [ ] Non-admin wallets blocked from admin functions

### 13. Multi-Pod Test
- [ ] Can mint second pod (Pod 2)
- [ ] Both pods function independently
- [ ] Correct state separation between pods

### 14. Breeding Test (if enough $BUD)
- [ ] Can breed two plants
- [ ] Burns 1,000 $BUD
- [ ] Creates new DNA hash
- [ ] Breeding succeeds

### 15. Slot Progression Test
- [ ] Harvest count increments after each harvest
- [ ] After 5 harvests, can claim slot token
- [ ] Slot token claim burns 2,500 $BUD
- [ ] Can unlock additional pod slots (up to 5 total)

## ✅ Security Verification

### 16. Network Configuration
- [ ] Chain ID set to 416002 (TestNet)
- [ ] Algod API points to TestNet: `https://testnet-api.algonode.cloud`
- [ ] No MainNet references in configuration
- [ ] `.dev.vars` and `.env` files in `.gitignore`

### 17. Secret Management
- [ ] Mnemonic not committed to repository
- [ ] Admin wallet address documented but mnemonic secured
- [ ] Cloudflare secrets properly configured
- [ ] GitHub secrets configured for CI/CD (if applicable)

### 18. Contract Permissions
- [ ] Only admin wallet can call `bootstrap`
- [ ] Only admin wallet can call `set_asa_ids`
- [ ] Regular users can opt-in
- [ ] Regular users can play game functions

## ✅ Documentation Updates

### 19. Update Documentation
- [ ] `ADMIN_WALLET_DEPLOYMENT.md` reflects actual deployment
- [ ] `README.md` has correct contract IDs (if hardcoded)
- [ ] `CLAUDE.md` updated with new IDs
- [ ] Any deployment logs saved for reference

### 20. Git Repository
- [ ] All changes committed
- [ ] Sensitive files (.dev.vars, .env) not committed
- [ ] Changes pushed to repository
- [ ] PR/branch up to date

## ✅ Monitoring and Maintenance

### 21. Set Up Monitoring
- [ ] Bookmark AlgoExplorer pages for quick access
- [ ] Note contract address for balance checks
- [ ] Note when tokens were created
- [ ] Document TestNet ALGO usage

### 22. Backup and Recovery
- [ ] Admin mnemonic securely backed up
- [ ] Contract IDs recorded in multiple places
- [ ] Deployment date/time documented
- [ ] Know how to redeploy if needed

## 🎉 Deployment Complete!

Once all checkboxes are complete, your GrowPod Empire smart contract is fully deployed and operational on Algorand TestNet with the new admin wallet.

## Common Issues and Solutions

### Issue: "Insufficient funds" during deployment
**Solution**: Fund admin wallet with TestNet ALGO from https://bank.testnet.algorand.network/

### Issue: Contract deployed but tokens not created
**Solution**: Run bootstrap again or check if `bootstrap` was called during deployment

### Issue: Users can't opt-in
**Solution**: Verify contract is funded (needs ALGO for inner transactions)

### Issue: Wrong network detected
**Solution**: Check Pera Wallet is set to TestNet, not MainNet

### Issue: Admin functions not working
**Solution**: Verify `ADMIN_WALLET_ADDRESS` environment variable matches actual admin wallet

## Resources

- **TestNet Faucet**: https://bank.testnet.algorand.network/
- **AlgoExplorer TestNet**: https://testnet.algoexplorer.io/
- **Algorand Developer Docs**: https://developer.algorand.org/
- **Pera Wallet**: https://perawallet.app/
- **Deployment Guide**: See `ADMIN_WALLET_DEPLOYMENT.md`
