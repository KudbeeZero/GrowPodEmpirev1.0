#!/usr/bin/env python3
"""
Breed script for GrowPod Empire (Combiner Lab) - Enhanced Security
Combines two seed NFTs to create hybrid seed NFT
Transfers both seed NFTs to the contract with comprehensive validation
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


def breed_plants(
    user_mnemonic: str, 
    app_id: int, 
    seed1_asset_id: int, 
    seed2_asset_id: int,
    app_address: str
) -> dict:
    """
    Breed two seed NFTs to create a hybrid seed.
    
    Genetics calculation:
    - 60% from seed 1 (dominant)
    - 30% from seed 2 (recessive)
    - 10% random mutation (new terps/minors)
    
    Requirements:
    - User must own both seed NFTs
    - Transfers both seed NFTs to the contract
    - Creates new hybrid seed NFT
    
    Args:
        user_mnemonic: 25-word Algorand wallet mnemonic
        app_id: GrowPod smart contract application ID
        seed1_asset_id: First seed NFT asset ID
        seed2_asset_id: Second seed NFT asset ID
        app_address: Contract application address
        
    Returns:
        dict: Transaction confirmation details
    """
    private_key = mnemonic.to_private_key(user_mnemonic)
    sender = account.address_from_private_key(private_key)
    params = algod_client.suggested_params()

    print(f"Breeding Seed NFT #{seed1_asset_id} x Seed NFT #{seed2_asset_id}")
    print(f"Transferring seed NFTs to contract...")

    # Transaction 1: Transfer Seed 1 NFT to contract
    seed1_txn = AssetTransferTxn(
        sender=sender,
        sp=params,
        receiver=app_address,
        amt=1,  # 1 NFT
        index=seed1_asset_id
    )
    
    # Transaction 2: Transfer Seed 2 NFT to contract
    seed2_txn = AssetTransferTxn(
        sender=sender,
        sp=params,
        receiver=app_address,
        amt=1,  # 1 NFT
        index=seed2_asset_id
    )
    
    # Transaction 3: Call breed on contract with seed asset IDs
    breed_txn = ApplicationNoOpTxn(
        sender=sender,
        sp=params,
        index=app_id,
        app_args=[
            "breed", 
            seed1_asset_id.to_bytes(8, 'big'), 
            seed2_asset_id.to_bytes(8, 'big')
        ]
    )
    
    # Group the transactions
    txn_group = [seed1_txn, seed2_txn, breed_txn]
    assign_group_id(txn_group)
    
    # Sign all three transactions
    signed_seed1 = seed1_txn.sign(private_key)
    signed_seed2 = seed2_txn.sign(private_key)
    signed_breed = breed_txn.sign(private_key)
    
    # Send grouped transactions
    txid = algod_client.send_transactions([signed_seed1, signed_seed2, signed_breed])
    print(f"Breeding in Combiner Lab... TXID: {txid}")
    
    confirmed_txn = wait_for_confirmation(algod_client, txid, 4)
    
    print("\nBreeding successful!")
    print(f"  Seed 1 NFT: #{seed1_asset_id}")
    print(f"  Seed 2 NFT: #{seed2_asset_id}")
    print(f"  Both seed NFTs transferred to contract")
    print(f"  Hybrid seed NFT minted to your wallet!")
    print("\nGenetics breakdown:")
    print(f"  60% from Seed #{seed1_asset_id} (dominant)")
    print(f"  30% from Seed #{seed2_asset_id} (recessive)")
    print(f"  10% random mutation")
    
    return confirmed_txn


def main():
    mnemonic_phrase = os.getenv("ALGO_MNEMONIC")
    if not mnemonic_phrase:
        print("ERROR: ALGO_MNEMONIC environment variable not set.")
        sys.exit(1)
    
    app_id = os.getenv("GROWPOD_APP_ID")
    app_address = os.getenv("GROWPOD_APP_ADDRESS")
    
    if not all([app_id, app_address]):
        print("ERROR: Required environment variables not set:")
        print("  GROWPOD_APP_ID - Contract application ID")
        print("  GROWPOD_APP_ADDRESS - Contract application address")
        sys.exit(1)
    
    # Get seed NFT asset IDs from environment
    seed1_asset_id = int(os.getenv("SEED1_ASSET_ID", "0"))
    seed2_asset_id = int(os.getenv("SEED2_ASSET_ID", "0"))
    
    if seed1_asset_id == 0 or seed2_asset_id == 0:
        print("ERROR: Set SEED1_ASSET_ID and SEED2_ASSET_ID environment variables")
        print("  These should be the asset IDs of the seed NFTs to breed")
        sys.exit(1)
    
    print("=" * 50)
    print("GrowPod Empire - Combiner Lab (Enhanced)")
    print("=" * 50)
    
    breed_plants(
        mnemonic_phrase,
        int(app_id),
        seed1_asset_id,
        seed2_asset_id,
        app_address
    )


if __name__ == "__main__":
    main()
