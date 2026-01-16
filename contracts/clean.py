#!/usr/bin/env python3
"""
Cleanup script for GrowPod Empire
Burns $BUD tokens + pays 1 ALGO to reset pod for new growth cycle
"""
from algosdk import account, mnemonic
from algosdk.transaction import (
    ApplicationNoOpTxn, 
    AssetTransferTxn,
    PaymentTxn,
    wait_for_confirmation,
    assign_group_id
)
from algosdk.v2client import algod
import os
import sys

# Algorand TestNet configuration
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""
algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

# Cleanup costs
CLEANUP_BUD_BURN = 500_000_000  # 500 $BUD (500 * 10^6)
CLEANUP_ALGO_FEE = 1_000_000   # 1 ALGO in microAlgos


def cleanup_pod(user_mnemonic: str, app_id: int, bud_asset_id: int, app_address: str) -> dict:
    """
    Execute cleanup transaction to reset pod for new growth.
    
    Requirements:
    - Burn 500 $BUD tokens (transfer to contract)
    - Pay 1 ALGO fee (transfer to contract)
    - Call cleanup application method
    
    Args:
        user_mnemonic: 25-word Algorand wallet mnemonic
        app_id: GrowPod smart contract application ID
        bud_asset_id: $BUD ASA ID
        app_address: Contract application address
        
    Returns:
        dict: Transaction confirmation details
    """
    private_key = mnemonic.to_private_key(user_mnemonic)
    sender = account.address_from_private_key(private_key)
    params = algod_client.suggested_params()

    print(f"Sender: {sender}")
    print(f"Burning 500 $BUD + paying 1 ALGO cleanup fee...")

    # Transaction 1: Transfer $BUD to contract (burn)
    burn_txn = AssetTransferTxn(
        sender=sender,
        sp=params,
        receiver=app_address,
        amt=CLEANUP_BUD_BURN,
        index=bud_asset_id
    )
    
    # Transaction 2: Pay 1 ALGO fee
    fee_txn = PaymentTxn(
        sender=sender,
        sp=params,
        receiver=app_address,
        amt=CLEANUP_ALGO_FEE
    )
    
    # Transaction 3: Call cleanup on contract
    cleanup_txn = ApplicationNoOpTxn(
        sender=sender,
        sp=params,
        index=app_id,
        app_args=["cleanup"]
    )
    
    # Group the transactions (must be atomic)
    txn_group = [burn_txn, fee_txn, cleanup_txn]
    assign_group_id(txn_group)
    
    # Sign all transactions
    signed_burn = burn_txn.sign(private_key)
    signed_fee = fee_txn.sign(private_key)
    signed_cleanup = cleanup_txn.sign(private_key)
    
    # Send grouped transactions
    txid = algod_client.send_transactions([signed_burn, signed_fee, signed_cleanup])
    print(f"Cleaning up pod... TXID: {txid}")
    
    confirmed_txn = wait_for_confirmation(algod_client, txid, 4)
    
    print("\nCleanup successful!")
    print(f"  Burned: 500 $BUD")
    print(f"  Paid: 1 ALGO")
    print(f"  Pod is now ready for new planting")
    
    return confirmed_txn


def main():
    mnemonic_phrase = os.getenv("ALGO_MNEMONIC")
    if not mnemonic_phrase:
        print("ERROR: ALGO_MNEMONIC environment variable not set.")
        sys.exit(1)
    
    app_id = os.getenv("GROWPOD_APP_ID")
    bud_asset_id = os.getenv("BUD_ASSET_ID")
    app_address = os.getenv("GROWPOD_APP_ADDRESS")
    
    if not all([app_id, bud_asset_id, app_address]):
        print("ERROR: Required environment variables not set:")
        print("  GROWPOD_APP_ID - Contract application ID")
        print("  BUD_ASSET_ID - $BUD ASA ID")
        print("  GROWPOD_APP_ADDRESS - Contract application address")
        sys.exit(1)
    
    print("=" * 50)
    print("GrowPod Empire - Pod Cleanup")
    print("=" * 50)
    print("This will burn 500 $BUD + 1 ALGO to reset your pod.\n")
    
    cleanup_pod(
        mnemonic_phrase, 
        int(app_id), 
        int(bud_asset_id),
        app_address
    )


if __name__ == "__main__":
    main()
