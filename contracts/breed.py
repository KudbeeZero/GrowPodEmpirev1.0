#!/usr/bin/env python3
"""
Breed script for GrowPod Empire (Combiner Lab)
Combines two harvested plants to create hybrid seed NFT
Burns 1000 $BUD for breeding
"""
from algosdk import account, mnemonic
from algosdk.transaction import (
    ApplicationNoOpTxn, 
    AssetTransferTxn,
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

# Breeding cost: 1000 $BUD (1000 * 10^6 = 1,000,000,000 units)
BREED_BUD_BURN = 1_000_000_000


def breed_plants(
    user_mnemonic: str, 
    app_id: int, 
    parent1_id: int, 
    parent2_id: int,
    bud_asset_id: int,
    app_address: str
) -> dict:
    """
    Breed two plants to create a hybrid seed.
    
    Genetics calculation:
    - 60% from parent1 (dominant)
    - 30% from parent2 (recessive)
    - 10% random mutation (new terps/minors)
    
    Requirements:
    - Both parents must be harvested plants
    - Burns 1000 $BUD
    - Creates new hybrid seed NFT
    
    Args:
        user_mnemonic: 25-word Algorand wallet mnemonic
        app_id: GrowPod smart contract application ID
        parent1_id: First parent plant/pod ID
        parent2_id: Second parent plant/pod ID
        bud_asset_id: $BUD ASA ID
        app_address: Contract application address
        
    Returns:
        dict: Transaction confirmation details
    """
    private_key = mnemonic.to_private_key(user_mnemonic)
    sender = account.address_from_private_key(private_key)
    params = algod_client.suggested_params()

    print(f"Breeding Parent #{parent1_id} x Parent #{parent2_id}")
    print(f"Cost: 1000 $BUD")

    # Transaction 1: Transfer $BUD to contract (burn for breeding)
    burn_txn = AssetTransferTxn(
        sender=sender,
        sp=params,
        receiver=app_address,
        amt=BREED_BUD_BURN,
        index=bud_asset_id
    )
    
    # Transaction 2: Call breed on contract with parent IDs
    breed_txn = ApplicationNoOpTxn(
        sender=sender,
        sp=params,
        index=app_id,
        app_args=[
            "breed", 
            parent1_id.to_bytes(8, 'big'), 
            parent2_id.to_bytes(8, 'big')
        ]
    )
    
    # Group the transactions
    txn_group = [burn_txn, breed_txn]
    assign_group_id(txn_group)
    
    # Sign both transactions
    signed_burn = burn_txn.sign(private_key)
    signed_breed = breed_txn.sign(private_key)
    
    # Send grouped transactions
    txid = algod_client.send_transactions([signed_burn, signed_breed])
    print(f"Breeding in Combiner Lab... TXID: {txid}")
    
    confirmed_txn = wait_for_confirmation(algod_client, txid, 4)
    
    print("\nBreeding successful!")
    print(f"  Parents: #{parent1_id} x #{parent2_id}")
    print(f"  Burned: 1000 $BUD")
    print(f"  Hybrid seed NFT minted to your wallet!")
    print("\nGenetics breakdown:")
    print(f"  60% from Parent #{parent1_id} (dominant)")
    print(f"  30% from Parent #{parent2_id} (recessive)")
    print(f"  10% random mutation")
    
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
    
    # Get parent IDs from command line or environment
    parent1 = int(os.getenv("PARENT1_ID", "0"))
    parent2 = int(os.getenv("PARENT2_ID", "0"))
    
    if parent1 == 0 or parent2 == 0:
        print("ERROR: Set PARENT1_ID and PARENT2_ID environment variables")
        print("  or pass them as command line arguments")
        sys.exit(1)
    
    print("=" * 50)
    print("GrowPod Empire - Combiner Lab")
    print("=" * 50)
    
    breed_plants(
        mnemonic_phrase,
        int(app_id),
        parent1,
        parent2,
        int(bud_asset_id),
        app_address
    )


if __name__ == "__main__":
    main()
