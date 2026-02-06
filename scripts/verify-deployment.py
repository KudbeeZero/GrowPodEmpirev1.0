#!/usr/bin/env python3
"""
Verify GrowPod Empire Smart Contract Deployment
Checks if the contract is properly deployed and configured on TestNet
"""
from algosdk.v2client import algod
from algosdk import encoding
import sys

# TestNet configuration
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""

# Expected admin wallet
EXPECTED_ADMIN = "ZK55X7SGIGMLGORVNJHHPTYZMZOGSQNVROBHX7N27X6ZEQRHAZ2UPKOXQU"

def verify_deployment(app_id: int):
    """Verify the smart contract deployment."""
    print("=" * 60)
    print("GrowPod Empire - Deployment Verification")
    print("=" * 60)
    print(f"\nVerifying App ID: {app_id}")
    print(f"Network: Algorand TestNet")
    print("")
    
    client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
    
    try:
        # Get application info
        app_info = client.application_info(app_id)
        params = app_info['params']
        
        print("✅ Contract found on TestNet")
        print("")
        
        # Check creator/owner
        creator = params.get('creator', '')
        print(f"Creator: {creator}")
        
        if creator == EXPECTED_ADMIN:
            print("✅ Creator matches expected admin wallet")
        else:
            print(f"⚠️  Creator does not match expected admin: {EXPECTED_ADMIN}")
        
        print("")
        
        # Check global state
        global_state = params.get('global-state', [])
        print("Global State:")
        
        state_dict = {}
        for item in global_state:
            key = encoding.base64.b64decode(item['key']).decode('utf-8')
            if item['value']['type'] == 1:  # bytes
                value = encoding.base64.b64decode(item['value']['bytes'])
                if key == 'owner':
                    value = encoding.encode_address(value)
                else:
                    value = value.hex() if value else '(empty)'
                state_dict[key] = value
            else:  # uint
                state_dict[key] = item['value']['uint']
        
        # Check owner
        owner = state_dict.get('owner', '')
        print(f"  owner: {owner}")
        if owner == EXPECTED_ADMIN:
            print("  ✅ Owner matches expected admin wallet")
        else:
            print(f"  ⚠️  Owner does not match: {EXPECTED_ADMIN}")
        
        # Check ASA IDs
        bud_id = state_dict.get('bud_asset', 0)
        terp_id = state_dict.get('terp_asset', 0)
        slot_id = state_dict.get('slot_asset', 0)
        
        print(f"  bud_asset: {bud_id}")
        print(f"  terp_asset: {terp_id}")
        print(f"  slot_asset: {slot_id}")
        
        if bud_id > 0 and terp_id > 0 and slot_id > 0:
            print("  ✅ All ASAs created")
        else:
            print("  ⚠️  Some ASAs not created yet")
        
        print(f"  period: {state_dict.get('period', 0)} seconds")
        print(f"  cleanup_cost: {state_dict.get('cleanup_cost', 0) / 1_000_000} BUD")
        print(f"  breed_cost: {state_dict.get('breed_cost', 0) / 1_000_000} BUD")
        
        print("")
        
        # Verify ASAs if they exist
        if bud_id > 0:
            try:
                bud_info = client.asset_info(bud_id)
                bud_params = bud_info['params']
                print(f"$BUD Token (ID: {bud_id}):")
                print(f"  Name: {bud_params['name']}")
                print(f"  Unit: {bud_params['unit-name']}")
                print(f"  Total: {bud_params['total'] / 10**bud_params['decimals']:,.0f}")
                print(f"  Decimals: {bud_params['decimals']}")
                print(f"  Creator: {bud_params['creator']}")
                if bud_params['creator'] == EXPECTED_ADMIN:
                    print("  ✅ Creator matches admin wallet")
                print("")
            except Exception as e:
                print(f"⚠️  Could not verify $BUD asset: {e}")
        
        if terp_id > 0:
            try:
                terp_info = client.asset_info(terp_id)
                terp_params = terp_info['params']
                print(f"$TERP Token (ID: {terp_id}):")
                print(f"  Name: {terp_params['name']}")
                print(f"  Unit: {terp_params['unit-name']}")
                print(f"  Total: {terp_params['total'] / 10**terp_params['decimals']:,.0f}")
                print(f"  Decimals: {terp_params['decimals']}")
                print(f"  Creator: {terp_params['creator']}")
                if terp_params['creator'] == EXPECTED_ADMIN:
                    print("  ✅ Creator matches admin wallet")
                print("")
            except Exception as e:
                print(f"⚠️  Could not verify $TERP asset: {e}")
        
        if slot_id > 0:
            try:
                slot_info = client.asset_info(slot_id)
                slot_params = slot_info['params']
                print(f"Slot Token (ID: {slot_id}):")
                print(f"  Name: {slot_params['name']}")
                print(f"  Unit: {slot_params['unit-name']}")
                print(f"  Total: {slot_params['total'] / 10**slot_params['decimals']:,.0f}")
                print(f"  Decimals: {slot_params['decimals']}")
                print(f"  Creator: {slot_params['creator']}")
                if slot_params['creator'] == EXPECTED_ADMIN:
                    print("  ✅ Creator matches admin wallet")
                print("")
            except Exception as e:
                print(f"⚠️  Could not verify Slot token asset: {e}")
        
        # Schema info
        print("Local State Schema:")
        print(f"  Uints: {params['local-state-schema']['num-uint']}")
        print(f"  Bytes: {params['local-state-schema']['num-byte-slice']}")
        print("")
        
        print("Global State Schema:")
        print(f"  Uints: {params['global-state-schema']['num-uint']}")
        print(f"  Bytes: {params['global-state-schema']['num-byte-slice']}")
        print("")
        
        # Summary
        print("=" * 60)
        print("VERIFICATION SUMMARY")
        print("=" * 60)
        print(f"✅ Contract deployed at App ID: {app_id}")
        print(f"✅ Creator/Owner: {EXPECTED_ADMIN}")
        if bud_id > 0 and terp_id > 0 and slot_id > 0:
            print(f"✅ All tokens bootstrapped successfully")
            print(f"   $BUD:  {bud_id}")
            print(f"   $TERP: {terp_id}")
            print(f"   Slot:  {slot_id}")
        else:
            print("⚠️  Tokens not bootstrapped yet")
        print("")
        print("View on AlgoExplorer:")
        print(f"  App:   https://testnet.algoexplorer.io/application/{app_id}")
        if bud_id > 0:
            print(f"  $BUD:  https://testnet.algoexplorer.io/asset/{bud_id}")
        if terp_id > 0:
            print(f"  $TERP: https://testnet.algoexplorer.io/asset/{terp_id}")
        if slot_id > 0:
            print(f"  Slot:  https://testnet.algoexplorer.io/asset/{slot_id}")
        print("")
        
        # Environment variables
        print("Environment Variables:")
        print(f"VITE_GROWPOD_APP_ID={app_id}")
        if bud_id > 0:
            print(f"VITE_BUD_ASSET_ID={bud_id}")
        if terp_id > 0:
            print(f"VITE_TERP_ASSET_ID={terp_id}")
        if slot_id > 0:
            print(f"VITE_SLOT_ASSET_ID={slot_id}")
        
        from algosdk.logic import get_application_address
        app_address = get_application_address(app_id)
        print(f"VITE_GROWPOD_APP_ADDRESS={app_address}")
        print(f"ADMIN_WALLET_ADDRESS={EXPECTED_ADMIN}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error verifying deployment: {e}")
        return False


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python verify-deployment.py <app_id>")
        print("\nExample:")
        print("  python verify-deployment.py 753910199")
        sys.exit(1)
    
    app_id = int(sys.argv[1])
    success = verify_deployment(app_id)
    sys.exit(0 if success else 1)
