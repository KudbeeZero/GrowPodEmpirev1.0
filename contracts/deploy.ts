#!/usr/bin/env npx tsx
/**
 * GrowPod Empire - TypeScript Deployment Script
 *
 * Compiles the TEALScript contract, deploys to Algorand TestNet,
 * funds the contract, and bootstraps $BUD, $TERP, and Slot tokens.
 *
 * Usage:
 *   ALGO_MNEMONIC="word1 word2 ... word25" npx tsx contracts/deploy.ts
 *
 * Prerequisites:
 *   - npm install (to get algosdk and @algorandfoundation/tealscript)
 *   - A funded Algorand TestNet wallet (>= 2 ALGO)
 *   - Get TestNet ALGO from: https://bank.testnet.algorand.network/
 */

import algosdk from 'algosdk';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Algorand TestNet configuration
const ALGOD_ADDRESS = 'https://testnet-api.algonode.cloud';
const ALGOD_TOKEN = '';

const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_ADDRESS);

// Contract state schema
// Global: 6 uints (period, cleanup_cost, bud_asset, terp_asset, slot_asset + 1 spare), 2 bytes (owner, terp_registry)
// Local: 12 uints + 4 bytes = 16 keys (max allowed)
const GLOBAL_SCHEMA = new algosdk.modelsv2.ApplicationStateSchema({
  numUint: BigInt(6),
  numByteSlice: BigInt(2),
});

const LOCAL_SCHEMA = new algosdk.modelsv2.ApplicationStateSchema({
  numUint: BigInt(12),
  numByteSlice: BigInt(4),
});

function compileContract(): { approvalPath: string; clearPath: string } {
  console.log('\n[1/4] Compiling TEALScript contract...');

  const scriptDir = path.dirname(new URL(import.meta.url).pathname);
  const contractPath = path.join(scriptDir, 'GrowPodEmpire.algo.ts');
  const artifactsDir = path.join(scriptDir, 'artifacts');

  // Ensure artifacts directory exists
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

  // Compile using TEALScript CLI
  execSync(`npx tealscript "${contractPath}" "${artifactsDir}"`, {
    stdio: 'inherit',
    cwd: path.resolve(scriptDir, '..'),
  });

  const approvalPath = path.join(artifactsDir, 'GrowPodEmpire.approval.teal');
  const clearPath = path.join(artifactsDir, 'GrowPodEmpire.clear.teal');

  if (!fs.existsSync(approvalPath) || !fs.existsSync(clearPath)) {
    console.error('ERROR: Compiled TEAL files not found!');
    console.error(`Expected: ${approvalPath}`);
    console.error(`Expected: ${clearPath}`);
    process.exit(1);
  }

  console.log('  Contract compiled successfully!');
  console.log(`  Approval: ${approvalPath}`);
  console.log(`  Clear: ${clearPath}`);

  return { approvalPath, clearPath };
}

async function compileTealToBytecode(tealSource: string): Promise<Uint8Array> {
  const compileResponse = await algodClient.compile(Buffer.from(tealSource)).do();
  return new Uint8Array(Buffer.from(compileResponse.result, 'base64'));
}

async function deployContract(
  creatorMnemonic: string,
  approvalPath: string,
  clearPath: string
): Promise<{ appId: number; appAddress: string }> {
  console.log('\n[2/4] Deploying contract to TestNet...');

  const account = algosdk.mnemonicToSecretKey(creatorMnemonic);
  const sender = account.addr;

  const approvalTeal = fs.readFileSync(approvalPath, 'utf-8');
  const clearTeal = fs.readFileSync(clearPath, 'utf-8');

  const approvalBytecode = await compileTealToBytecode(approvalTeal);
  const clearBytecode = await compileTealToBytecode(clearTeal);

  const suggestedParams = await algodClient.getTransactionParams().do();

  const txn = algosdk.makeApplicationCreateTxnFromObject({
    sender: sender,
    suggestedParams,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    approvalProgram: approvalBytecode,
    clearProgram: clearBytecode,
    numGlobalInts: Number(GLOBAL_SCHEMA.numUint),
    numGlobalByteSlices: Number(GLOBAL_SCHEMA.numByteSlice),
    numLocalInts: Number(LOCAL_SCHEMA.numUint),
    numLocalByteSlices: Number(LOCAL_SCHEMA.numByteSlice),
    extraPages: 1,
  });

  const signedTxn = txn.signTxn(account.sk);

  let txId: string;
  try {
    const response = await algodClient.sendRawTransaction(signedTxn).do();
    txId = response.txId;
    console.log(`  Deployment TX: ${txId}`);
  } catch (e) {
    console.error(`  ERROR sending transaction: ${e}`);
    throw e;
  }

  const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
  const appId = Number(confirmedTxn.applicationIndex);
  const appAddress = algosdk.getApplicationAddress(appId);

  console.log('  Contract deployed!');
  console.log(`  App ID: ${appId}`);
  console.log(`  App Address: ${appAddress}`);

  return { appId, appAddress };
}

async function fundAppAddress(
  creatorMnemonic: string,
  appAddress: string,
  amountAlgo: number = 0.5
): Promise<void> {
  console.log(`\n[3/4] Funding contract address with ${amountAlgo} ALGO...`);

  const account = algosdk.mnemonicToSecretKey(creatorMnemonic);
  const suggestedParams = await algodClient.getTransactionParams().do();
  const amountMicroAlgo = Math.floor(amountAlgo * 1_000_000);

  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: account.addr,
    receiver: appAddress,
    amount: amountMicroAlgo,
    suggestedParams,
  });

  const signedTxn = txn.signTxn(account.sk);
  const response = await algodClient.sendRawTransaction(signedTxn).do();
  console.log(`  Funding TX: ${response.txId}`);

  await algosdk.waitForConfirmation(algodClient, response.txId, 4);
  console.log(`  Contract funded with ${amountAlgo} ALGO!`);
}

async function bootstrapTokens(
  creatorMnemonic: string,
  appId: number
): Promise<{ budId: number; terpId: number; slotId: number }> {
  console.log('\n[4/4] Bootstrapping $BUD, $TERP, and Slot tokens...');

  const account = algosdk.mnemonicToSecretKey(creatorMnemonic);
  const suggestedParams = await algodClient.getTransactionParams().do();

  // Extra fee for 3 inner transactions (asset creation)
  suggestedParams.fee = BigInt(4000);
  suggestedParams.flatFee = true;

  // Load the ABI from the compiled artifacts
  const scriptDir = path.dirname(new URL(import.meta.url).pathname);
  const abiPath = path.join(scriptDir, 'artifacts', 'GrowPodEmpire.arc4.json');

  let txn: algosdk.Transaction;

  if (fs.existsSync(abiPath)) {
    // Use ABI method call
    const abiJson = JSON.parse(fs.readFileSync(abiPath, 'utf-8'));
    const contract = new algosdk.ABIContract(abiJson);
    const bootstrapMethod = contract.getMethodByName('bootstrap');

    const atc = new algosdk.AtomicTransactionComposer();
    atc.addMethodCall({
      appID: appId,
      method: bootstrapMethod,
      methodArgs: [],
      sender: account.addr,
      suggestedParams,
      signer: algosdk.makeBasicAccountTransactionSigner(account),
    });

    const result = await atc.execute(algodClient, 4);
    console.log(`  Bootstrap TX: ${result.txIDs[0]}`);
  } else {
    // Fallback to raw app call
    txn = algosdk.makeApplicationNoOpTxnFromObject({
      sender: account.addr,
      suggestedParams,
      appIndex: appId,
      appArgs: [new TextEncoder().encode('bootstrap')],
    });

    const signedTxn = txn.signTxn(account.sk);
    const response = await algodClient.sendRawTransaction(signedTxn).do();
    console.log(`  Bootstrap TX: ${response.txId}`);
    await algosdk.waitForConfirmation(algodClient, response.txId, 4);
  }

  // Read global state to extract created ASA IDs
  const appInfo = await algodClient.getApplicationByID(appId).do();
  const globalState = appInfo.params?.globalState || [];

  let budId = 0;
  let terpId = 0;
  let slotId = 0;

  for (const item of globalState) {
    const key = Buffer.from(item.key, 'base64').toString('utf-8');
    if (key === 'bud_asset') {
      budId = Number(item.value.uint);
    } else if (key === 'terp_asset') {
      terpId = Number(item.value.uint);
    } else if (key === 'slot_asset') {
      slotId = Number(item.value.uint);
    }
  }

  if (budId && terpId && slotId) {
    console.log(`  $BUD Asset ID: ${budId}`);
    console.log(`  $TERP Asset ID: ${terpId}`);
    console.log(`  Slot Token Asset ID: ${slotId}`);
  } else {
    console.log('  WARNING: Could not retrieve all ASA IDs from global state');
    console.log(`  Global state: ${JSON.stringify(globalState)}`);
  }

  return { budId, terpId, slotId };
}

async function main(): Promise<void> {
  const mnemonicPhrase = process.env.ALGO_MNEMONIC;

  if (!mnemonicPhrase) {
    console.log('='.repeat(60));
    console.log('GrowPod Empire - TypeScript Deployment Script');
    console.log('='.repeat(60));
    console.log('\nERROR: ALGO_MNEMONIC environment variable not set.');
    console.log('\nTo deploy, you need a 25-word Algorand wallet mnemonic.');
    console.log('1. Create a wallet using Pera Wallet or MyAlgo');
    console.log('2. Get TestNet ALGO from: https://bank.testnet.algorand.network/');
    console.log('3. Export your mnemonic (Settings > View Passphrase)');
    console.log("4. Set the secret: ALGO_MNEMONIC='word1 word2 ... word25'");
    console.log('\nThen run this script again.');
    process.exit(1);
  }

  const account = algosdk.mnemonicToSecretKey(mnemonicPhrase);
  const sender = account.addr;

  console.log('='.repeat(60));
  console.log('GrowPod Empire - TypeScript Deployment Script');
  console.log('Network: Algorand TestNet');
  console.log('='.repeat(60));
  console.log(`\nDeployer Address: ${sender}`);

  const accountInfo = await algodClient.accountInformation(sender).do();
  const balance = Number(accountInfo.amount) / 1_000_000;
  console.log(`Account Balance: ${balance.toFixed(6)} ALGO`);

  if (balance < 2) {
    console.log('\nERROR: Insufficient funds. Need at least 2 ALGO for deployment.');
    console.log(`Get TestNet ALGO from: https://bank.testnet.algorand.network/`);
    console.log(`Fund this address: ${sender}`);
    process.exit(1);
  }

  const { approvalPath, clearPath } = compileContract();
  const { appId, appAddress } = await deployContract(mnemonicPhrase, approvalPath, clearPath);
  await fundAppAddress(mnemonicPhrase, appAddress, 0.5);
  const { budId, terpId, slotId } = await bootstrapTokens(mnemonicPhrase, appId);

  console.log('\n' + '='.repeat(60));
  console.log('DEPLOYMENT COMPLETE!');
  console.log('='.repeat(60));

  console.log('\n--- Environment Variables ---');
  console.log('Add these to your .env file or Replit Secrets:\n');
  console.log(`VITE_GROWPOD_APP_ID=${appId}`);
  console.log(`VITE_BUD_ASSET_ID=${budId}`);
  console.log(`VITE_TERP_ASSET_ID=${terpId}`);
  console.log(`VITE_SLOT_ASSET_ID=${slotId}`);
  console.log(`VITE_GROWPOD_APP_ADDRESS=${appAddress}`);

  console.log('\n--- View on AlgoExplorer ---');
  console.log(`App:   https://testnet.algoexplorer.io/application/${appId}`);
  console.log(`$BUD:  https://testnet.algoexplorer.io/asset/${budId}`);
  console.log(`$TERP: https://testnet.algoexplorer.io/asset/${terpId}`);
  console.log(`SLOT:  https://testnet.algoexplorer.io/asset/${slotId}`);

  console.log('\n--- Next Steps ---');
  console.log('1. Copy the environment variables above to your .env or Replit Secrets');
  console.log('2. Restart the app to pick up the new configuration');
  console.log('3. Connect your Pera Wallet and opt-in to start playing!');
  console.log('4. Update frontend hooks to use ABI method calls (see ARC-4 spec)');
}

main().catch((err) => {
  console.error('Deployment failed:', err);
  process.exit(1);
});
