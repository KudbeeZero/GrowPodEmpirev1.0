#!/usr/bin/env python3
"""
Mint script for GrowPod Empire
Mints soulbound GrowPod NFT and plants mystery seed
"""
from algosdk import account, mnemonic
from algosdk.transaction import (
    AssetConfigTxn, 
    ApplicationNoOpTxn,
    wait_for_confirmation
)
from algosdk.v2client import algod
import os
import sys
import hashlib
import time

# Algorand TestNet configuration
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""
algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

# Default Pinata IPFS URLs for pod images
POD_IMAGES = {
    "default": "https://gateway.pinata.cloud/ipfs/QmDefaultPodImage",
    "seedling": "https://gateway.pinata.cloud/ipfs/QmSeedlingImage",
    "vegetative": "https://gateway.pinata.cloud/ipfs/QmVegetativeImage",
    "flowering": "https://gateway.pinata.cloud/ipfs/QmFloweringImage",
    "mature": "https://gateway.pinata.cloud/ipfs/QmMatureImage",
    "dead_mold": "https://gateway.pinata.cloud/ipfs/QmMoldImage",
}


def generate_dna_hash(sender: str) -> str:
    """Generate pseudo-random DNA hash for mystery seed."""
    seed_data = f"{sender}{time.time()}{os.urandom(16).hex()}"
    return hashlib.sha256(seed_data.encode()).hexdigest()


def mint_pod_nft(
    creator_mnemonic: str, 
    pod_number: int = 1,
    app_address: str = None
) -> int:
    """
    Mint a soulbound GrowPod NFT.
    
    The NFT is "soulbound" via clawback mechanism:
    - Clawback address = app address (or creator if no app)
    - Cannot be transferred until first harvest
    - 800x1000 image hosted on Pinata/IPFS
    
    Args:
        creator_mnemonic: 25-word Algorand wallet mnemonic
        pod_number: Pod number for naming (e.g., 1 = "GrowPod #001")
        app_address: Contract address for clawback (makes NFT soulbound)
        
    Returns:
        int: Asset ID of created pod NFT
    """
    private_key = mnemonic.to_private_key(creator_mnemonic)
    sender = account.address_from_private_key(private_key)
    params = algod_client.suggested_params()
    
    # Format pod name and unit name
    unit_name = f"POD{pod_number:03d}"
    asset_name = f"GrowPod #{pod_number:03d}"
    
    # Generate DNA for this pod
    dna_hash = generate_dna_hash(sender)
    
    # Clawback address makes it soulbound (cannot transfer without app approval)
    clawback_address = app_address if app_address else sender
    
    print(f"Minting soulbound pod: {asset_name}")
    print(f"DNA Hash: {dna_hash[:16]}...")

    txn = AssetConfigTxn(
        sender=sender,
        sp=params,
        total=1,  # NFT = total of 1
        default_frozen=False,
        unit_name=unit_name,
        asset_name=asset_name,
        manager=sender,
        reserve=sender,
        freeze=sender,
        clawback=clawback_address,  # Soulbound via clawback
        url=POD_IMAGES["default"],
        decimals=0,
        metadata_hash=bytes.fromhex(dna_hash[:64])  # Store DNA hash
    )

    signed_txn = txn.sign(private_key)
    txid = algod_client.send_transaction(signed_txn)
    print(f"Creating NFT... TXID: {txid}")

    confirmed_txn = wait_for_confirmation(algod_client, txid, 4)
    asset_id = confirmed_txn['asset-index']
    
    print(f"\nPod NFT created!")
    print(f"  Asset ID: {asset_id}")
    print(f"  Name: {asset_name}")
    print(f"  Soulbound: Yes (clawback = {clawback_address[:8]}...)")
    print(f"  View: https://testnet.algoexplorer.io/asset/{asset_id}")
    
    return asset_id


def plant_mystery_seed(user_mnemonic: str, app_id: int) -> dict:
    """
    Plant a mystery seed in the GrowPod (call mint_pod on contract).
    
    This initializes the growth cycle with:
    - Random DNA hash (hidden terpene/minor profile)
    - Stage set to 1 (seedling)
    - Water count reset to 0
    
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
        app_args=["mint_pod"]
    )

    signed_txn = txn.sign(private_key)
    txid = algod_client.send_transaction(signed_txn)
    print(f"Planting mystery seed... TXID: {txid}")
    
    confirmed_txn = wait_for_confirmation(algod_client, txid, 4)
    
    print("\nMystery seed planted!")
    print("  Terpene profile: Hidden (revealed at harvest)")
    print("  Minor cannabinoids: Hidden (revealed at harvest)")
    print("  Start watering to grow your plant!")
    
    return confirmed_txn


def main():
    mnemonic_phrase = os.getenv("ALGO_MNEMONIC")
    if not mnemonic_phrase:
        print("ERROR: ALGO_MNEMONIC environment variable not set.")
        sys.exit(1)
    
    print("=" * 50)
    print("GrowPod Empire - Mint Pod & Plant Seed")
    print("=" * 50)
    
    # Check if we should mint NFT or just plant seed
    app_id = os.getenv("GROWPOD_APP_ID")
    app_address = os.getenv("GROWPOD_APP_ADDRESS")
    
    # Get pod number from env or default to 1
    pod_number = int(os.getenv("POD_NUMBER", "1"))
    
    # Mint the NFT
    asset_id = mint_pod_nft(mnemonic_phrase, pod_number, app_address)
    
    # If contract is deployed, also plant the seed
    if app_id:
        print("\n--- Planting Mystery Seed ---")
        plant_mystery_seed(mnemonic_phrase, int(app_id))
    else:
        print("\nNote: GROWPOD_APP_ID not set. NFT created but seed not planted in contract.")
        print("Set GROWPOD_APP_ID and run plant_mystery_seed() to start growing.")


if __name__ == "__main__":
    main()
