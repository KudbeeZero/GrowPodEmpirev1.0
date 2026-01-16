#!/usr/bin/env python3
"""
Harvest script for GrowPod Empire
Executes harvest transaction to mint $BUD tokens based on yield calculation
"""
from algosdk import account, mnemonic
from algosdk.transaction import ApplicationNoOpTxn, wait_for_confirmation
from algosdk.v2client import algod
import os
import sys

# Algorand TestNet configuration
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""
algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)


def harvest_plant(user_mnemonic: str, app_id: int) -> dict:
    """
    Execute harvest transaction on the GrowPod smart contract.
    
    The contract will:
    1. Verify plant is at stage 5 (ready to harvest)
    2. Calculate yield based on terpene/minor profiles
    3. Mint $BUD tokens to the sender via inner transaction
    4. Move plant to stage 6 (needs cleanup)
    
    Args:
        user_mnemonic: 25-word Algorand wallet mnemonic
        app_id: GrowPod smart contract application ID
        
    Returns:
        dict: Transaction confirmation details
    """
    private_key = mnemonic.to_private_key(user_mnemonic)
    sender = account.address_from_private_key(private_key)
    params = algod_client.suggested_params()

    # Create harvest transaction
    txn = ApplicationNoOpTxn(
        sender=sender,
        sp=params,
        index=app_id,
        app_args=["harvest"]
    )

    signed_txn = txn.sign(private_key)
    txid = algod_client.send_transaction(signed_txn)
    print(f"Harvesting plant... TXID: {txid}")
    
    confirmed_txn = wait_for_confirmation(algod_client, txid, 4)
    print("Harvest successful!")
    print(f"  $BUD minted to: {sender}")
    print(f"  Base yield: 0.25g (250,000,000 units)")
    
    return confirmed_txn


def check_and_mint_terp(user_mnemonic: str, app_id: int) -> dict:
    """
    Check if harvested plant has rare terpene profile and mint $TERP if so.
    
    The contract will:
    1. Hash the terpene + minor profile
    2. Check if profile is rare (first byte < 0x20 = ~12.5% chance)
    3. Mint $TERP based on rarity (5,000 - 50,000 tokens)
    
    Args:
        user_mnemonic: 25-word Algorand wallet mnemonic
        app_id: GrowPod smart contract application ID
        
    Returns:
        dict: Transaction confirmation details
    """
    private_key = mnemonic.to_private_key(user_mnemonic)
    sender = account.address_from_private_key(private_key)
    params = algod_client.suggested_params()

    txn = ApplicationNoOpTxn(
        sender=sender,
        sp=params,
        index=app_id,
        app_args=["check_terp"]
    )

    signed_txn = txn.sign(private_key)
    txid = algod_client.send_transaction(signed_txn)
    print(f"Checking terpene rarity... TXID: {txid}")
    
    confirmed_txn = wait_for_confirmation(algod_client, txid, 4)
    print("Terpene check complete!")
    print("  If profile was rare, $TERP has been minted to your wallet.")
    
    return confirmed_txn


def main():
    mnemonic_phrase = os.getenv("ALGO_MNEMONIC")
    if not mnemonic_phrase:
        print("ALGO_MNEMONIC environment variable not set.")
        sys.exit(1)
    
    app_id = os.getenv("GROWPOD_APP_ID")
    if not app_id:
        print("GROWPOD_APP_ID environment variable not set.")
        print("Set it to your deployed GrowPod contract ID.")
        sys.exit(1)
    
    print("=" * 50)
    print("GrowPod Empire - Harvest")
    print("=" * 50)
    
    # Execute harvest
    harvest_plant(mnemonic_phrase, int(app_id))
    
    # Check for rare terpene reward
    print("\nChecking for rare terpene reward...")
    check_and_mint_terp(mnemonic_phrase, int(app_id))
    
    print("\nHarvest and terpene check complete!")
    print("Don't forget to cleanup your pod before planting again.")


if __name__ == "__main__":
    main()
