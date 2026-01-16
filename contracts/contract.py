from pyteal import *

# Constants
GlobalOwner = Bytes("owner")
GlobalPeriod = Bytes("period") # 10 day cycle duration in seconds
GlobalCost = Bytes("cost") # Cleanup cost
GlobalBudAsset = Bytes("bud_asset")
GlobalTerpAsset = Bytes("terp_asset")

LocalStage = Bytes("stage")
LocalWaterCount = Bytes("water_count")
LocalLastWatered = Bytes("last_watered")
LocalDna = Bytes("dna")
LocalStartRound = Bytes("start_round")

def approval_program():
    # Bootstrap / Init
    handle_creation = Seq(
        App.globalPut(GlobalOwner, Txn.sender()),
        App.globalPut(GlobalPeriod, Int(864000)), # 10 days
        App.globalPut(GlobalCost, Int(1000000)), # 1 Algo
        Approve()
    )

    # Opt-in for users
    handle_optin = Seq(
        App.localPut(Txn.sender(), LocalStage, Int(0)),
        App.localPut(Txn.sender(), LocalWaterCount, Int(0)),
        App.localPut(Txn.sender(), LocalLastWatered, Int(0)),
        App.localPut(Txn.sender(), LocalDna, Bytes("")),
        Approve()
    )

    # Bootstrap ASAs (called once by owner)
    # In a real app, this would use Inner Transactions to create ASAs
    bootstrap = Seq(
        Assert(Txn.sender() == App.globalGet(GlobalOwner)),
        # Placeholder IDs - in production these would be set from the result of Inner Transactions
        App.globalPut(GlobalBudAsset, Int(1000001)), 
        App.globalPut(GlobalTerpAsset, Int(1000002)),
        Approve()
    )

    # Water Action
    water = Seq(
        Assert(App.localGet(Txn.sender(), LocalStage) < Int(6)),
        Assert(Global.latest_timestamp() - App.localGet(Txn.sender(), LocalLastWatered) >= Int(86400)),
        
        App.localPut(Txn.sender(), LocalLastWatered, Global.latest_timestamp()),
        App.localPut(Txn.sender(), LocalWaterCount, App.localGet(Txn.sender(), LocalWaterCount) + Int(1)),
        
        If(App.localGet(Txn.sender(), LocalWaterCount) >= Int(10),
           Seq(
               App.localPut(Txn.sender(), LocalStage, Int(5)), # Ready to harvest
               App.localPut(Txn.sender(), LocalWaterCount, Int(0))
           )
        ),
        Approve()
    )

    # Harvest Action
    # Yield: 0.25g base = 250,000,000 units
    harvest = Seq(
        Assert(App.localGet(Txn.sender(), LocalStage) == Int(5)),
        # Inner transaction to mint BUD would go here
        # InnerTransaction(
        #     AssetTransfer(
        #         asset_receiver=Txn.sender(),
        #         asset_amount=Int(250000000),
        #         xfer_asset=App.globalGet(GlobalBudAsset)
        #     )
        # )
        App.localPut(Txn.sender(), LocalStage, Int(6)), # Waiting for cleanup
        Approve()
    )

    # Cleanup Action
    cleanup = Seq(
        Assert(App.localGet(Txn.sender(), LocalStage) == Int(6)),
        # Verify BUD burn (Asset transfer to app address or creator)
        App.localPut(Txn.sender(), LocalStage, Int(0)),
        App.localPut(Txn.sender(), LocalWaterCount, Int(0)),
        App.localPut(Txn.sender(), LocalLastWatered, Int(0)),
        Approve()
    )

    return Cond(
        [Txn.application_id() == Int(0), handle_creation],
        [Txn.on_completion() == OnComplete.OptIn, handle_optin],
        [Txn.application_args[0] == Bytes("bootstrap"), bootstrap],
        [Txn.application_args[0] == Bytes("water"), water],
        [Txn.application_args[0] == Bytes("harvest"), harvest],
        [Txn.application_args[0] == Bytes("cleanup"), cleanup],
        [Txn.on_completion() == OnComplete.UpdateApplication, Approve()],
        [Txn.on_completion() == OnComplete.DeleteApplication, Approve()]
    )

def clear_state_program():
    return Approve()

if __name__ == "__main__":
    with open("contracts/approval.teal", "w") as f:
        compiled = compileTeal(approval_program(), mode=Mode.Application, version=6)
        f.write(compiled)

    with open("contracts/clear.teal", "w") as f:
        compiled = compileTeal(clear_state_program(), mode=Mode.Application, version=6)
        f.write(compiled)
