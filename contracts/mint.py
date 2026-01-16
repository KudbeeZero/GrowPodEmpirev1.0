from algosdk import account, mnemonic
from algosdk.future.transaction import AssetConfigTxn, wait_for_confirmation
from algosdk.v2client import algod

# Initialize algod client
algod_address = "https://testnet-api.algonode.cloud"
algod_token = ""
algod_client = algod.AlgodClient(algod_token, algod_address)

# Helper to print created asset ID
def print_created_asset(algod_client, account, confirmed_txn):
    account_info = algod_client.account_info(account)
    idx = confirmed_txn['asset-index']
    print(f"Asset ID: {idx}")

def mint_pod(creator_mnemonic, unit_name="POD001", asset_name="GrowPod #001"):
    private_key = mnemonic.to_private_key(creator_mnemonic)
    sender = account.address_from_private_key(private_key)

    params = algod_client.suggested_params()

    # Create Soulbound NFT (Clawback = Creator)
    txn = AssetConfigTxn(
        sender=sender,
        sp=params,
        total=1,
        default_frozen=False,
        unit_name=unit_name,
        asset_name=asset_name,
        manager=sender,
        reserve=sender,
        freeze=sender,
        clawback=sender, # Allows reviving/burning
        url="https://gateway.pinata.cloud/ipfs/QmYourHash",
        decimals=0
    )

    signed_txn = txn.sign(private_key)
    txid = algod_client.send_transaction(signed_txn)
    print(f"Submitted transaction: {txid}")

    confirmed_txn = wait_for_confirmation(algod_client, txid, 4)
    print("Transaction confirmed")
    print_created_asset(algod_client, sender, confirmed_txn)

if __name__ == "__main__":
    # Replace with your mnemonic
    mnemonic_phrase = "YOUR TWENTY FIVE WORD MNEMONIC HERE"
    mint_pod(mnemonic_phrase)
