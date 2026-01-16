from pyteal import *

# Constants
GlobalOwner = Bytes("owner")
GlobalPeriod = Bytes("period") # 10 day cycle duration in seconds
GlobalCost = Bytes("cost") # Cleanup cost

LocalStage = Bytes("stage")
LocalWaterCount = Bytes("water_count")
LocalLastWatered = Bytes("last_watered")
LocalDna = Bytes("dna")
LocalStartRound = Bytes("start_round")

def approval_program():
    handle_creation = Seq(
        App.globalPut(GlobalOwner, Txn.sender()),
        App.globalPut(GlobalPeriod, Int(864000)), # 10 days
        App.globalPut(GlobalCost, Int(1000000)), # 1 Algo
        Approve()
    )

    handle_optin = Seq(
        App.localPut(Txn.sender(), LocalStage, Int(0)),
        App.localPut(Txn.sender(), LocalWaterCount, Int(0)),
        App.localPut(Txn.sender(), LocalLastWatered, Int(0)),
        App.localPut(Txn.sender(), LocalDna, Bytes("")),
        Approve()
    )

    handle_closeout = Approve()
    
    handle_update = Return(Txn.sender() == App.globalGet(GlobalOwner))
    
    handle_delete = Return(Txn.sender() == App.globalGet(GlobalOwner))

    # Water Action
    # Cooldown: 86400 seconds (24 hours)
    # Must be alive (stage < 6)
    water = Seq(
        Assert(App.localGet(Txn.sender(), LocalStage) < Int(6)), # Check not dead
        Assert(Global.latest_timestamp() - App.localGet(Txn.sender(), LocalLastWatered) >= Int(86400)),
        
        App.localPut(Txn.sender(), LocalLastWatered, Global.latest_timestamp()),
        App.localPut(Txn.sender(), LocalWaterCount, App.localGet(Txn.sender(), LocalWaterCount) + Int(1)),
        
        # Check if stage advances
        If(App.localGet(Txn.sender(), LocalWaterCount) >= Int(10),
           Seq(
               App.localPut(Txn.sender(), LocalStage, Int(5)), # Ready to harvest
               App.localPut(Txn.sender(), LocalWaterCount, Int(0))
           )
        ),
        Approve()
    )

    # Harvest Action
    # Must be stage 5
    harvest = Seq(
        Assert(App.localGet(Txn.sender(), LocalStage) == Int(5)),
        # Logic to mint BUD would be an inner transaction here or triggered via backend
        # For this example, we just log the harvest event or reset stage
        App.localPut(Txn.sender(), LocalStage, Int(6)), # Set to 'harvested/dead' state waiting for cleanup
        Approve()
    )

    # Cleanup Action
    # Burn BUD + Pay Algo
    cleanup = Seq(
        Assert(App.localGet(Txn.sender(), LocalStage) == Int(6)),
        # Verify payment (omitted for brevity, would check Txn.group)
        App.localPut(Txn.sender(), LocalStage, Int(0)),
        App.localPut(Txn.sender(), LocalWaterCount, Int(0)),
        App.localPut(Txn.sender(), LocalLastWatered, Int(0)),
        Approve()
    )

    return Cond(
        [Txn.application_id() == Int(0), handle_creation],
        [Txn.on_completion() == OnComplete.OptIn, handle_optin],
        [Txn.on_completion() == OnComplete.CloseOut, handle_closeout],
        [Txn.on_completion() == OnComplete.UpdateApplication, handle_update],
        [Txn.on_completion() == OnComplete.DeleteApplication, handle_delete],
        [Txn.application_args[0] == Bytes("water"), water],
        [Txn.application_args[0] == Bytes("harvest"), harvest],
        [Txn.application_args[0] == Bytes("cleanup"), cleanup]
    )

def clear_state_program():
    return Approve()

if __name__ == "__main__":
    with open("approval.teal", "w") as f:
        compiled = compileTeal(approval_program(), mode=Mode.Application, version=6)
        f.write(compiled)

    with open("clear.teal", "w") as f:
        compiled = compileTeal(clear_state_program(), mode=Mode.Application, version=6)
        f.write(compiled)
