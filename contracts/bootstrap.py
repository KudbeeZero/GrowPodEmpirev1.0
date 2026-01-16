from algosdk import account, mnemonic
from algosdk.future.transaction import AssetConfigTxn, wait_for_confirmation
from algosdk.v2client import algod
import os

# Initialize algod client
algod_address = "https://testnet-api.algonode.cloud"
algod_token = ""
algod_client = algod.AlgodClient(algod_token, algod_address)

def create_asa(creator_mnemonic, asset_name, unit_name, total, decimals, url):
    private_key = mnemonic.to_private_key(creator_mnemonic)
    sender = account.address_from_private_key(private_key)
    params = algod_client.suggested_params()

    txn = AssetConfigTxn(
        sender=sender,
        sp=params,
        total=total,
        default_frozen=False,
        unit_name=unit_name,
        asset_name=asset_name,
        manager=sender,
        reserve=sender,
        freeze=sender,
        clawback=sender,
        url=url,
        decimals=decimals
    )

    signed_txn = txn.sign(private_key)
    txid = algod_client.send_transaction(signed_txn)
    print(f"Creating {asset_name}... TXID: {txid}")
    confirmed_txn = wait_for_confirmation(algod_client, txid, 4)
    print(f"{asset_name} created. Asset ID: {confirmed_txn['asset-index']}")
    return confirmed_txn['asset-index']

if __name__ == "__main__":
    mnemonic_phrase = os.getenv("ALGO_MNEMONIC", "YOUR TWENTY FIVE WORD MNEMONIC HERE")
    
    # Bootstrap $BUD
    bud_id = create_asa(
        mnemonic_phrase, 
        "GrowPod BUD", 
        "BUD", 
        10000000000 * 10**6, 
        6, 
        "https://growpod.empire/assets/bud.json"
    )
    
    # Bootstrap $TERP
    terp_id = create_asa(
        mnemonic_phrase, 
        "GrowPod TERP", 
        "TERP", 
        100000000 * 10**6, 
        6, 
        "https://growpod.empire/assets/terp.json"
    )
    
    print(f"\nBootstrap Complete!")
    print(f"BUD_ID={bud_id}")
    print(f"TERP_ID={terp_id}")
