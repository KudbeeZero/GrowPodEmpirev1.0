#!/usr/bin/env python3
"""
Full Deployment Script for GrowPod Empire
Compiles contract, deploys to TestNet, creates tokens, and outputs env vars.
"""
from algosdk import account, mnemonic, encoding
from algosdk.transaction import (
    ApplicationCreateTxn, 
    StateSchema, 
    OnComplete,
    wait_for_confirmation,
    ApplicationNoOpTxn,
    PaymentTxn
)
from algosdk.v2client import algod
from algosdk.logic import get_application_address
import base64
import os
import sys
import subprocess

# Algorand TestNet configuration
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""
algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

# Contract state schema
# Global: 6 uints (period, cleanup_cost, breed_cost, bud_asset, terp_asset, slot_asset)
#         2 bytes (owner, terp_registry)
# Pod 1: 5 uints (stage, water_count, last_watered, nutrient_count, last_nutrients)
#        2 bytes (dna, terpene_profile)
# Pod 2: same 5 uints + 2 bytes
# Slot progression: 2 uints (harvest_count, pod_slots)
# Total Local: 12 uints, 4 bytes = 16 keys (max allowed)
GLOBAL_SCHEMA = StateSchema(num_uints=6, num_byte_slices=2)
LOCAL_SCHEMA = StateSchema(num_uints=12, num_byte_slices=4)


def compile_contract():
    """Compile the PyTeal contract to TEAL."""
    print("\n[1/4] Compiling contract...")
    script_dir = os.path.dirname(os.path.abspath(__file__))
    contract_path = os.path.join(script_dir, "contract.py")
    
    result = subprocess.run(
        [sys.executable, contract_path],
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        print(f"ERROR: Contract compilation failed!")
        print(result.stderr)
        sys.exit(1)
    
    print("  Contract compiled successfully!")
    return (
        os.path.join(script_dir, "approval.teal"),
        os.path.join(script_dir, "clear.teal")
    )


def compile_teal_to_bytecode(teal_source: str) -> bytes:
    """Compile TEAL source to bytecode using algod."""
    compile_response = algod_client.compile(teal_source)
    return base64.b64decode(compile_response['result'])


def deploy_contract(creator_mnemonic: str, approval_path: str, clear_path: str) -> tuple:
    """Deploy the smart contract to TestNet."""
    print("\n[2/4] Deploying contract to TestNet...")
    
    private_key = mnemonic.to_private_key(creator_mnemonic)
    sender = account.address_from_private_key(private_key)
    
    with open(approval_path, 'r') as f:
        approval_teal = f.read()
    with open(clear_path, 'r') as f:
        clear_teal = f.read()
    
    approval_bytecode = compile_teal_to_bytecode(approval_teal)
    clear_bytecode = compile_teal_to_bytecode(clear_teal)
    
    params = algod_client.suggested_params()
    
    txn = ApplicationCreateTxn(
        sender=sender,
        sp=params,
        on_complete=OnComplete.NoOpOC,
        approval_program=approval_bytecode,
        clear_program=clear_bytecode,
        global_schema=GLOBAL_SCHEMA,
        local_schema=LOCAL_SCHEMA,
        extra_pages=1
    )
    
    signed_txn = txn.sign(private_key)
    try:
        txid = algod_client.send_transaction(signed_txn)
        print(f"  Deployment TX: {txid}")
    except Exception as e:
        print(f"  ERROR sending transaction: {e}")
        raise
    
    confirmed_txn = wait_for_confirmation(algod_client, txid, 4)
    app_id = confirmed_txn['application-index']
    app_address = get_application_address(app_id)
    
    print(f"  Contract deployed!")
    print(f"  App ID: {app_id}")
    print(f"  App Address: {app_address}")
    
    return app_id, app_address


def fund_app_address(creator_mnemonic: str, app_address: str, amount_algo: float = 0.5):
    """Fund the contract address so it can make inner transactions."""
    print(f"\n[3/4] Funding contract address with {amount_algo} ALGO...")
    
    private_key = mnemonic.to_private_key(creator_mnemonic)
    sender = account.address_from_private_key(private_key)
    params = algod_client.suggested_params()
    
    amount_microalgo = int(amount_algo * 1_000_000)
    
    txn = PaymentTxn(
        sender=sender,
        sp=params,
        receiver=app_address,
        amt=amount_microalgo
    )
    
    signed_txn = txn.sign(private_key)
    txid = algod_client.send_transaction(signed_txn)
    print(f"  Funding TX: {txid}")
    wait_for_confirmation(algod_client, txid, 4)
    print(f"  Contract funded with {amount_algo} ALGO!")


def bootstrap_tokens(creator_mnemonic: str, app_id: int) -> tuple:
    """Call bootstrap on the contract to create $BUD, $TERP, and Slot tokens."""
    print("\n[4/4] Bootstrapping $BUD, $TERP, and Slot tokens...")
    
    private_key = mnemonic.to_private_key(creator_mnemonic)
    sender = account.address_from_private_key(private_key)
    params = algod_client.suggested_params()
    params.fee = 4000  # Extra fee for 3 inner txns
    params.flat_fee = True
    
    txn = ApplicationNoOpTxn(
        sender=sender,
        sp=params,
        index=app_id,
        app_args=["bootstrap"]
    )
    
    signed_txn = txn.sign(private_key)
    txid = algod_client.send_transaction(signed_txn)
    print(f"  Bootstrap TX: {txid}")
    
    confirmed_txn = wait_for_confirmation(algod_client, txid, 4)
    
    app_info = algod_client.application_info(app_id)
    global_state = app_info['params']['global-state']
    
    bud_id = None
    terp_id = None
    slot_id = None
    
    for item in global_state:
        key = encoding.base64.b64decode(item['key']).decode('utf-8')
        if key == 'bud_asset':
            bud_id = item['value']['uint']
        elif key == 'terp_asset':
            terp_id = item['value']['uint']
        elif key == 'slot_asset':
            slot_id = item['value']['uint']
    
    if bud_id and terp_id and slot_id:
        print(f"  $BUD Asset ID: {bud_id}")
        print(f"  $TERP Asset ID: {terp_id}")
        print(f"  Slot Token Asset ID: {slot_id}")
    else:
        print("  WARNING: Could not retrieve all ASA IDs from global state")
        print(f"  Global state: {global_state}")
    
    return bud_id, terp_id, slot_id


def main():
    mnemonic_phrase = os.getenv("ALGO_MNEMONIC")
    if not mnemonic_phrase:
        print("=" * 60)
        print("GrowPod Empire - Full Deployment Script")
        print("=" * 60)
        print("\nERROR: ALGO_MNEMONIC environment variable not set.")
        print("\nTo deploy, you need a 25-word Algorand wallet mnemonic.")
        print("1. Create a wallet using Pera Wallet or MyAlgo")
        print("2. Get TestNet ALGO from: https://bank.testnet.algorand.network/")
        print("3. Export your mnemonic (Settings > View Passphrase)")
        print("4. Set the secret: ALGO_MNEMONIC='word1 word2 ... word25'")
        print("\nThen run this script again.")
        sys.exit(1)
    
    private_key = mnemonic.to_private_key(mnemonic_phrase)
    sender = account.address_from_private_key(private_key)
    
    print("=" * 60)
    print("GrowPod Empire - Full Deployment Script")
    print("Network: Algorand TestNet")
    print("=" * 60)
    print(f"\nDeployer Address: {sender}")
    
    account_info = algod_client.account_info(sender)
    balance = account_info.get('amount', 0) / 1_000_000
    print(f"Account Balance: {balance:.6f} ALGO")
    
    if balance < 2:
        print("\nERROR: Insufficient funds. Need at least 2 ALGO for deployment.")
        print(f"Get TestNet ALGO from: https://bank.testnet.algorand.network/")
        print(f"Fund this address: {sender}")
        sys.exit(1)
    
    approval_path, clear_path = compile_contract()
    
    app_id, app_address = deploy_contract(mnemonic_phrase, approval_path, clear_path)
    
    fund_app_address(mnemonic_phrase, app_address, 0.5)
    
    bud_id, terp_id, slot_id = bootstrap_tokens(mnemonic_phrase, app_id)
    
    print("\n" + "=" * 60)
    print("DEPLOYMENT COMPLETE!")
    print("=" * 60)
    
    print("\n--- Environment Variables ---")
    print("Add these to your .env file or Replit Secrets:\n")
    print(f"VITE_GROWPOD_APP_ID={app_id}")
    print(f"VITE_BUD_ASSET_ID={bud_id}")
    print(f"VITE_TERP_ASSET_ID={terp_id}")
    print(f"VITE_SLOT_ASSET_ID={slot_id}")
    print(f"VITE_GROWPOD_APP_ADDRESS={app_address}")
    
    print("\n--- View on AlgoExplorer ---")
    print(f"App:   https://testnet.algoexplorer.io/application/{app_id}")
    print(f"$BUD:  https://testnet.algoexplorer.io/asset/{bud_id}")
    print(f"$TERP: https://testnet.algoexplorer.io/asset/{terp_id}")
    print(f"SLOT:  https://testnet.algoexplorer.io/asset/{slot_id}")
    
    print("\n--- Next Steps ---")
    print("1. Copy the environment variables above to your Replit Secrets")
    print("2. Restart the app to pick up the new configuration")
    print("3. Connect your Pera Wallet and opt-in to start playing!")
    
    return app_id, app_address, bud_id, terp_id, slot_id


if __name__ == "__main__":
    main()
