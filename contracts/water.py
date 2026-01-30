#!/usr/bin/env python3
"""
Water script for GrowPod Empire
Waters plant with 10 minute cooldown (TestNet), advances growth stage
"""
from algosdk import account, mnemonic
from algosdk.transaction import ApplicationNoOpTxn, wait_for_confirmation
from algosdk.v2client import algod
import os
import sys
import time

# Algorand TestNet configuration
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""
algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

# Constants
WATER_COOLDOWN = 600  # 10 minutes in seconds (TestNet)


def get_local_state(address: str, app_id: int) -> dict:
    """Get user's local state from the contract."""
    account_info = algod_client.account_info(address)
    for app_local in account_info.get('apps-local-state', []):
        if app_local['id'] == app_id:
            state = {}
            for kv in app_local.get('key-value', []):
                key = bytes.fromhex(kv['key']).decode('utf-8', errors='ignore')
                if kv['value']['type'] == 2:  # uint
                    state[key] = kv['value']['uint']
                else:  # bytes
                    state[key] = kv['value']['bytes']
            return state
    return {}


def check_water_cooldown(address: str, app_id: int) -> tuple:
    """
    Check if watering is allowed and time remaining.
    
    Returns:
        tuple: (can_water: bool, seconds_remaining: int, current_stage: int)
    """
    state = get_local_state(address, app_id)
    
    last_watered = state.get('last_watered', 0)
    current_stage = state.get('stage', 0)
    water_count = state.get('water_count', 0)
    
    current_time = int(time.time())
    time_since_water = current_time - last_watered
    
    if last_watered == 0:
        return (True, 0, current_stage)
    
    if time_since_water >= WATER_COOLDOWN:
        return (True, 0, current_stage)
    
    remaining = WATER_COOLDOWN - time_since_water
    return (False, remaining, current_stage)


def water_plant(user_mnemonic: str, app_id: int) -> dict:
    """
    Water the plant in the GrowPod.

    The contract will:
    1. Check 10 minute cooldown has passed (TestNet)
    2. Increment water count
    3. Advance growth stage if thresholds met

    Args:
        user_mnemonic: 25-word Algorand wallet mnemonic
        app_id: GrowPod smart contract application ID

    Returns:
        dict: Transaction confirmation details
    """
    private_key = mnemonic.to_private_key(user_mnemonic)
    sender = account.address_from_private_key(private_key)
    params = algod_client.suggested_params()

    # Check cooldown before submitting
    can_water, remaining, stage = check_water_cooldown(sender, app_id)
    
    if not can_water:
        hours = remaining // 3600
        minutes = (remaining % 3600) // 60
        print(f"ERROR: Watering on cooldown. {hours}h {minutes}m remaining.")
        sys.exit(1)
    
    if stage == 0:
        print("ERROR: No plant in pod. Mint a pod first.")
        sys.exit(1)
    
    if stage >= 5:
        print("ERROR: Plant is ready for harvest or needs cleanup.")
        sys.exit(1)
    
    if stage == 6:
        print("ERROR: Plant is dead (overwatered/disease). Cleanup required.")
        sys.exit(1)

    txn = ApplicationNoOpTxn(
        sender=sender,
        sp=params,
        index=app_id,
        app_args=["water"]
    )

    signed_txn = txn.sign(private_key)
    txid = algod_client.send_transaction(signed_txn)
    print(f"Watering plant... TXID: {txid}")
    
    confirmed_txn = wait_for_confirmation(algod_client, txid, 4)
    
    # Get updated state
    new_state = get_local_state(sender, app_id)
    new_stage = new_state.get('stage', 0)
    new_water_count = new_state.get('water_count', 0)
    
    print("\nWatering successful!")
    print(f"  Water count: {new_water_count}/10")
    print(f"  Growth stage: {new_stage}/5")
    
    if new_stage == 5:
        print("\n  READY TO HARVEST!")
    else:
        print(f"  Next water in: 10 minutes")
    
    return confirmed_txn


def main():
    mnemonic_phrase = os.getenv("ALGO_MNEMONIC")
    if not mnemonic_phrase:
        print("ERROR: ALGO_MNEMONIC environment variable not set.")
        sys.exit(1)
    
    app_id = os.getenv("GROWPOD_APP_ID")
    if not app_id:
        print("ERROR: GROWPOD_APP_ID environment variable not set.")
        sys.exit(1)
    
    print("=" * 50)
    print("GrowPod Empire - Water Plant")
    print("=" * 50)
    
    water_plant(mnemonic_phrase, int(app_id))


if __name__ == "__main__":
    main()
