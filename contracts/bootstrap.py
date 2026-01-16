#!/usr/bin/env python3
"""
Bootstrap script for GrowPod Empire ASAs
Creates $BUD and $TERP tokens on Algorand TestNet
"""
from algosdk import account, mnemonic
from algosdk.transaction import AssetConfigTxn, wait_for_confirmation, ApplicationNoOpTxn
from algosdk.v2client import algod
import os
import sys

# Algorand TestNet configuration
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""
algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

# Token specifications
BUD_SPEC = {
    "name": "GrowPod BUD",
    "unit_name": "BUD",
    "total": 10_000_000_000 * 10**6,  # 10 billion with 6 decimals
    "decimals": 6,
    "url": "https://growpod.empire/assets/bud.json",
    "description": "Harvest commodity token for GrowPod Empire"
}

TERP_SPEC = {
    "name": "GrowPod TERP",
    "unit_name": "TERP", 
    "total": 100_000_000 * 10**6,  # 100 million with 6 decimals (fixed supply)
    "decimals": 6,
    "url": "https://growpod.empire/assets/terp.json",
    "description": "Terpene rights/governance token for GrowPod Empire"
}


def create_asa(creator_mnemonic: str, spec: dict) -> int:
    """Create an Algorand Standard Asset (ASA) with given specifications."""
    private_key = mnemonic.to_private_key(creator_mnemonic)
    sender = account.address_from_private_key(private_key)
    params = algod_client.suggested_params()

    txn = AssetConfigTxn(
        sender=sender,
        sp=params,
        total=spec["total"],
        default_frozen=False,
        unit_name=spec["unit_name"],
        asset_name=spec["name"],
        manager=sender,
        reserve=sender,
        freeze=sender,
        clawback=sender,
        url=spec["url"],
        decimals=spec["decimals"]
    )

    signed_txn = txn.sign(private_key)
    txid = algod_client.send_transaction(signed_txn)
    print(f"Creating {spec['name']}... TXID: {txid}")
    
    confirmed_txn = wait_for_confirmation(algod_client, txid, 4)
    asset_id = confirmed_txn['asset-index']
    print(f"  Created! Asset ID: {asset_id}")
    return asset_id


def set_app_asa_ids(creator_mnemonic: str, app_id: int, bud_id: int, terp_id: int):
    """Call the smart contract to set ASA IDs in global state."""
    private_key = mnemonic.to_private_key(creator_mnemonic)
    sender = account.address_from_private_key(private_key)
    params = algod_client.suggested_params()

    txn = ApplicationNoOpTxn(
        sender=sender,
        sp=params,
        index=app_id,
        app_args=["set_asa_ids", bud_id.to_bytes(8, 'big'), terp_id.to_bytes(8, 'big')]
    )

    signed_txn = txn.sign(private_key)
    txid = algod_client.send_transaction(signed_txn)
    print(f"Setting ASA IDs in contract... TXID: {txid}")
    wait_for_confirmation(algod_client, txid, 4)
    print("  ASA IDs set successfully!")


def main():
    # Get mnemonic from environment or prompt
    mnemonic_phrase = os.getenv("ALGO_MNEMONIC")
    if not mnemonic_phrase:
        print("ALGO_MNEMONIC environment variable not set.")
        print("Please set it with your 25-word Algorand wallet mnemonic.")
        sys.exit(1)
    
    print("=" * 60)
    print("GrowPod Empire - ASA Bootstrap Script")
    print("Network: Algorand TestNet (Chain ID: 416002)")
    print("=" * 60)
    
    # Get sender address
    private_key = mnemonic.to_private_key(mnemonic_phrase)
    sender = account.address_from_private_key(private_key)
    print(f"\nCreator Address: {sender}")
    
    # Check balance
    account_info = algod_client.account_info(sender)
    balance = account_info.get('amount', 0) / 1_000_000
    print(f"Account Balance: {balance:.6f} ALGO")
    
    if balance < 1:
        print("\nERROR: Insufficient funds. Need at least 1 ALGO for ASA creation.")
        print("Get TestNet ALGO from: https://bank.testnet.algorand.network/")
        sys.exit(1)
    
    print("\n--- Creating ASAs ---")
    
    # Create $BUD token
    bud_id = create_asa(mnemonic_phrase, BUD_SPEC)
    
    # Create $TERP token
    terp_id = create_asa(mnemonic_phrase, TERP_SPEC)
    
    print("\n" + "=" * 60)
    print("BOOTSTRAP COMPLETE!")
    print("=" * 60)
    print(f"\n$BUD Asset ID:  {bud_id}")
    print(f"$TERP Asset ID: {terp_id}")
    print(f"\nView on AlgoExplorer:")
    print(f"  $BUD:  https://testnet.algoexplorer.io/asset/{bud_id}")
    print(f"  $TERP: https://testnet.algoexplorer.io/asset/{terp_id}")
    print("\nNext steps:")
    print("  1. Deploy the smart contract using: python contracts/contract.py")
    print("  2. Call set_asa_ids on the contract with these IDs")
    print("  3. Opt-in users to both ASAs before they can receive tokens")
    
    # Optional: Set IDs in contract if APP_ID is provided
    app_id = os.getenv("GROWPOD_APP_ID")
    if app_id:
        print(f"\nSetting ASA IDs in contract (App ID: {app_id})...")
        set_app_asa_ids(mnemonic_phrase, int(app_id), bud_id, terp_id)
    
    return bud_id, terp_id


if __name__ == "__main__":
    main()
