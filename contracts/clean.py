from algosdk import account, mnemonic
from algosdk.future.transaction import ApplicationNoOpTxn, wait_for_confirmation
from algosdk.v2client import algod

algod_address = "https://testnet-api.algonode.cloud"
algod_token = ""
algod_client = algod.AlgodClient(algod_token, algod_address)

def cleanup_pod(user_mnemonic, app_id):
    private_key = mnemonic.to_private_key(user_mnemonic)
    sender = account.address_from_private_key(private_key)
    params = algod_client.suggested_params()

    txn = ApplicationNoOpTxn(
        sender=sender,
        sp=params,
        index=app_id,
        app_args=["cleanup"]
    )

    signed_txn = txn.sign(private_key)
    txid = algod_client.send_transaction(signed_txn)
    print(f"Cleaning up... TXID: {txid}")
    
    wait_for_confirmation(algod_client, txid, 4)
    print("Cleanup successful. Pod reset.")

if __name__ == "__main__":
    mnemonic_phrase = "YOUR TWENTY FIVE WORD MNEMONIC HERE"
    APP_ID = 123456 
    cleanup_pod(mnemonic_phrase, APP_ID)
