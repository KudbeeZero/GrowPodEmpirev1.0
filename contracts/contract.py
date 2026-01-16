from pyteal import *

# Global State Keys
GlobalOwner = Bytes("owner")
GlobalPeriod = Bytes("period")  # 10 day cycle duration in seconds (864000)
GlobalCleanupCost = Bytes("cleanup_cost")  # 500 $BUD (500 * 10^6 = 500000000)
GlobalBreedCost = Bytes("breed_cost")  # 1000 $BUD (1000 * 10^6 = 1000000000)
GlobalBudAsset = Bytes("bud_asset")  # $BUD ASA ID
GlobalTerpAsset = Bytes("terp_asset")  # $TERP ASA ID
GlobalTerpProfileRegistry = Bytes("terp_registry")  # Hash registry for unique profiles

# Local State Keys (per user)
LocalStage = Bytes("stage")  # 0=empty, 1-4=growing, 5=ready, 6=needs_cleanup
LocalWaterCount = Bytes("water_count")  # Number of successful waterings
LocalLastWatered = Bytes("last_watered")  # Timestamp of last water
LocalDna = Bytes("dna")  # Plant genetic hash
LocalStartRound = Bytes("start_round")  # Round when planted
LocalTerpeneProfile = Bytes("terpene_profile")  # Terpene hash for rarity check
LocalMinorProfile = Bytes("minor_profile")  # Minor cannabinoid profile

# Constants
BASE_YIELD = Int(250000000)  # 0.25g = 250,000,000 units (6 decimals)
WATER_COOLDOWN = Int(86400)  # 24 hours in seconds
GROWTH_CYCLE = Int(864000)  # 10 days in seconds
CLEANUP_BURN = Int(500000000)  # 500 $BUD to burn for cleanup
BREED_BURN = Int(1000000000)  # 1000 $BUD to burn for breeding
MIN_TERP_REWARD = Int(5000000000)  # 5,000 $TERP minimum
MAX_TERP_REWARD = Int(50000000000)  # 50,000 $TERP maximum


def approval_program():
    # Scratch space for intermediate calculations
    scratch_yield = ScratchVar(TealType.uint64)
    scratch_terp_reward = ScratchVar(TealType.uint64)
    scratch_profile_hash = ScratchVar(TealType.bytes)

    # Helper: Check if caller is the contract owner
    is_owner = Txn.sender() == App.globalGet(GlobalOwner)

    # Bootstrap / Init - Create the application
    handle_creation = Seq(
        App.globalPut(GlobalOwner, Txn.sender()),
        App.globalPut(GlobalPeriod, GROWTH_CYCLE),
        App.globalPut(GlobalCleanupCost, CLEANUP_BURN),
        App.globalPut(GlobalBreedCost, BREED_BURN),
        App.globalPut(GlobalBudAsset, Int(0)),
        App.globalPut(GlobalTerpAsset, Int(0)),
        App.globalPut(GlobalTerpProfileRegistry, Bytes("")),
        Approve()
    )

    # User opt-in - Initialize local state
    handle_optin = Seq(
        App.localPut(Txn.sender(), LocalStage, Int(0)),
        App.localPut(Txn.sender(), LocalWaterCount, Int(0)),
        App.localPut(Txn.sender(), LocalLastWatered, Int(0)),
        App.localPut(Txn.sender(), LocalDna, Bytes("")),
        App.localPut(Txn.sender(), LocalStartRound, Int(0)),
        App.localPut(Txn.sender(), LocalTerpeneProfile, Bytes("")),
        App.localPut(Txn.sender(), LocalMinorProfile, Bytes("")),
        Approve()
    )

    # Bootstrap ASAs - Create $BUD and $TERP tokens via inner transactions
    # Only callable by owner, and only if ASAs not yet created
    bootstrap_asas = Seq(
        Assert(is_owner),
        Assert(App.globalGet(GlobalBudAsset) == Int(0)),
        Assert(App.globalGet(GlobalTerpAsset) == Int(0)),
        
        # Create $BUD ASA - 10 billion total supply with 6 decimals
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.AssetConfig,
            TxnField.config_asset_total: Int(10000000000000000),  # 10B * 10^6
            TxnField.config_asset_decimals: Int(6),
            TxnField.config_asset_unit_name: Bytes("BUD"),
            TxnField.config_asset_name: Bytes("GrowPod BUD"),
            TxnField.config_asset_url: Bytes("https://growpod.empire/bud"),
            TxnField.config_asset_manager: Global.current_application_address(),
            TxnField.config_asset_reserve: Global.current_application_address(),
            TxnField.config_asset_freeze: Global.current_application_address(),
            TxnField.config_asset_clawback: Global.current_application_address(),
        }),
        InnerTxnBuilder.Submit(),
        App.globalPut(GlobalBudAsset, InnerTxn.created_asset_id()),
        
        # Create $TERP ASA - 100 million fixed supply with 6 decimals
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.AssetConfig,
            TxnField.config_asset_total: Int(100000000000000),  # 100M * 10^6
            TxnField.config_asset_decimals: Int(6),
            TxnField.config_asset_unit_name: Bytes("TERP"),
            TxnField.config_asset_name: Bytes("GrowPod TERP"),
            TxnField.config_asset_url: Bytes("https://growpod.empire/terp"),
            TxnField.config_asset_manager: Global.current_application_address(),
            TxnField.config_asset_reserve: Global.current_application_address(),
            TxnField.config_asset_freeze: Global.current_application_address(),
            TxnField.config_asset_clawback: Global.current_application_address(),
        }),
        InnerTxnBuilder.Submit(),
        App.globalPut(GlobalTerpAsset, InnerTxn.created_asset_id()),
        
        Approve()
    )

    # Mint Pod - Start growing a new plant (soulbound GrowPod logic placeholder)
    mint_pod = Seq(
        Assert(App.localGet(Txn.sender(), LocalStage) == Int(0)),
        # Generate pseudo-random DNA from transaction data
        App.localPut(Txn.sender(), LocalDna, Sha256(Concat(
            Txn.sender(),
            Itob(Global.latest_timestamp()),
            Itob(Global.round())
        ))),
        App.localPut(Txn.sender(), LocalStage, Int(1)),
        App.localPut(Txn.sender(), LocalStartRound, Global.round()),
        App.localPut(Txn.sender(), LocalWaterCount, Int(0)),
        App.localPut(Txn.sender(), LocalLastWatered, Int(0)),
        # Generate random terpene and minor profiles
        App.localPut(Txn.sender(), LocalTerpeneProfile, Sha256(Concat(
            Bytes("terp"),
            Txn.sender(),
            Itob(Global.latest_timestamp())
        ))),
        App.localPut(Txn.sender(), LocalMinorProfile, Sha256(Concat(
            Bytes("minor"),
            Txn.sender(),
            Itob(Global.round())
        ))),
        Approve()
    )

    # Water Action - Water the plant with 24h cooldown
    water = Seq(
        # Must have an active plant (stages 1-4)
        Assert(App.localGet(Txn.sender(), LocalStage) >= Int(1)),
        Assert(App.localGet(Txn.sender(), LocalStage) <= Int(4)),
        # Enforce 24-hour cooldown
        Assert(
            Or(
                App.localGet(Txn.sender(), LocalLastWatered) == Int(0),
                Global.latest_timestamp() - App.localGet(Txn.sender(), LocalLastWatered) >= WATER_COOLDOWN
            )
        ),
        
        App.localPut(Txn.sender(), LocalLastWatered, Global.latest_timestamp()),
        App.localPut(Txn.sender(), LocalWaterCount, App.localGet(Txn.sender(), LocalWaterCount) + Int(1)),
        
        # Progress through growth stages (10 waters = ready to harvest)
        If(
            App.localGet(Txn.sender(), LocalWaterCount) >= Int(10),
            Seq(
                App.localPut(Txn.sender(), LocalStage, Int(5)),  # Ready to harvest
            ),
            # Increment stage every 2-3 waters
            If(
                App.localGet(Txn.sender(), LocalWaterCount) == Int(3),
                App.localPut(Txn.sender(), LocalStage, Int(2)),
                If(
                    App.localGet(Txn.sender(), LocalWaterCount) == Int(6),
                    App.localPut(Txn.sender(), LocalStage, Int(3)),
                    If(
                        App.localGet(Txn.sender(), LocalWaterCount) == Int(8),
                        App.localPut(Txn.sender(), LocalStage, Int(4))
                    )
                )
            )
        ),
        Approve()
    )

    # Calculate yield based on terpene/minor profiles
    # Base: 0.25g = 250,000,000 units, adjustable by profile quality
    calculate_yield = Seq(
        scratch_yield.store(BASE_YIELD),
        # Bonus based on water consistency (up to 20% bonus)
        If(
            App.localGet(Txn.sender(), LocalWaterCount) >= Int(10),
            scratch_yield.store(scratch_yield.load() + (BASE_YIELD * Int(20) / Int(100)))
        ),
        scratch_yield.load()
    )

    # Harvest Action - Mint $BUD to sender based on yield
    harvest = Seq(
        Assert(App.localGet(Txn.sender(), LocalStage) == Int(5)),
        Assert(App.globalGet(GlobalBudAsset) != Int(0)),
        
        # Calculate yield
        scratch_yield.store(calculate_yield),
        
        # Mint $BUD via inner transaction
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.AssetTransfer,
            TxnField.xfer_asset: App.globalGet(GlobalBudAsset),
            TxnField.asset_amount: scratch_yield.load(),
            TxnField.asset_receiver: Txn.sender(),
        }),
        InnerTxnBuilder.Submit(),
        
        # Move to cleanup stage
        App.localPut(Txn.sender(), LocalStage, Int(6)),
        Approve()
    )

    # Check and Mint TERP - Reward rare/unique terpene profiles
    # Hash the profile, check if unique, mint if rare
    check_and_mint_terp = Seq(
        Assert(App.localGet(Txn.sender(), LocalStage) == Int(6)),
        Assert(App.globalGet(GlobalTerpAsset) != Int(0)),
        
        # Create unique profile hash from terpene + minor profiles
        scratch_profile_hash.store(Sha256(Concat(
            App.localGet(Txn.sender(), LocalTerpeneProfile),
            App.localGet(Txn.sender(), LocalMinorProfile)
        ))),
        
        # Check if profile is rare (first byte < 0x20 = ~12.5% chance)
        # Lower byte values = rarer = higher reward
        If(
            GetByte(scratch_profile_hash.load(), Int(0)) < Int(32),
            Seq(
                # Calculate reward based on rarity (lower = more rare = higher reward)
                scratch_terp_reward.store(
                    MIN_TERP_REWARD + 
                    ((Int(32) - GetByte(scratch_profile_hash.load(), Int(0))) * 
                     (MAX_TERP_REWARD - MIN_TERP_REWARD) / Int(32))
                ),
                
                # Mint $TERP to sender
                InnerTxnBuilder.Begin(),
                InnerTxnBuilder.SetFields({
                    TxnField.type_enum: TxnType.AssetTransfer,
                    TxnField.xfer_asset: App.globalGet(GlobalTerpAsset),
                    TxnField.asset_amount: scratch_terp_reward.load(),
                    TxnField.asset_receiver: Txn.sender(),
                }),
                InnerTxnBuilder.Submit(),
            )
        ),
        Approve()
    )

    # Cleanup Action - Burn $BUD to reset pod for new growth
    cleanup = Seq(
        Assert(App.localGet(Txn.sender(), LocalStage) == Int(6)),
        Assert(App.globalGet(GlobalBudAsset) != Int(0)),
        
        # Verify $BUD burn in grouped transaction (previous txn)
        Assert(Gtxn[Txn.group_index() - Int(1)].type_enum() == TxnType.AssetTransfer),
        Assert(Gtxn[Txn.group_index() - Int(1)].xfer_asset() == App.globalGet(GlobalBudAsset)),
        Assert(Gtxn[Txn.group_index() - Int(1)].asset_amount() >= CLEANUP_BURN),
        Assert(Gtxn[Txn.group_index() - Int(1)].asset_receiver() == Global.current_application_address()),
        
        # Reset local state for new growth
        App.localPut(Txn.sender(), LocalStage, Int(0)),
        App.localPut(Txn.sender(), LocalWaterCount, Int(0)),
        App.localPut(Txn.sender(), LocalLastWatered, Int(0)),
        App.localPut(Txn.sender(), LocalDna, Bytes("")),
        App.localPut(Txn.sender(), LocalTerpeneProfile, Bytes("")),
        App.localPut(Txn.sender(), LocalMinorProfile, Bytes("")),
        Approve()
    )

    # Breed Action - Combine two plants (placeholder for combiner lab)
    breed = Seq(
        Assert(App.globalGet(GlobalBudAsset) != Int(0)),
        
        # Verify $BUD burn for breeding in grouped transaction
        Assert(Gtxn[Txn.group_index() - Int(1)].type_enum() == TxnType.AssetTransfer),
        Assert(Gtxn[Txn.group_index() - Int(1)].xfer_asset() == App.globalGet(GlobalBudAsset)),
        Assert(Gtxn[Txn.group_index() - Int(1)].asset_amount() >= BREED_BURN),
        Assert(Gtxn[Txn.group_index() - Int(1)].asset_receiver() == Global.current_application_address()),
        
        # Breeding logic placeholder - create new seed with combined DNA
        Approve()
    )

    # Set ASA IDs manually (for cases where inner transactions aren't available)
    set_asa_ids = Seq(
        Assert(is_owner),
        App.globalPut(GlobalBudAsset, Btoi(Txn.application_args[1])),
        App.globalPut(GlobalTerpAsset, Btoi(Txn.application_args[2])),
        Approve()
    )

    # Main router
    return Cond(
        [Txn.application_id() == Int(0), handle_creation],
        [Txn.on_completion() == OnComplete.OptIn, handle_optin],
        [Txn.on_completion() == OnComplete.CloseOut, Approve()],
        [Txn.on_completion() == OnComplete.UpdateApplication, Assert(is_owner)],
        [Txn.on_completion() == OnComplete.DeleteApplication, Assert(is_owner)],
        [Txn.application_args[0] == Bytes("bootstrap"), bootstrap_asas],
        [Txn.application_args[0] == Bytes("set_asa_ids"), set_asa_ids],
        [Txn.application_args[0] == Bytes("mint_pod"), mint_pod],
        [Txn.application_args[0] == Bytes("water"), water],
        [Txn.application_args[0] == Bytes("harvest"), harvest],
        [Txn.application_args[0] == Bytes("check_terp"), check_and_mint_terp],
        [Txn.application_args[0] == Bytes("cleanup"), cleanup],
        [Txn.application_args[0] == Bytes("breed"), breed],
    )


def clear_state_program():
    return Approve()


if __name__ == "__main__":
    with open("contracts/approval.teal", "w") as f:
        compiled = compileTeal(approval_program(), mode=Mode.Application, version=8)
        f.write(compiled)
        print("Compiled approval.teal")

    with open("contracts/clear.teal", "w") as f:
        compiled = compileTeal(clear_state_program(), mode=Mode.Application, version=8)
        f.write(compiled)
        print("Compiled clear.teal")
    
    print("\nContract compilation complete!")
    print("Global state: owner, period, cleanup_cost, breed_cost, bud_asset, terp_asset, terp_registry")
    print("Local state: stage, water_count, last_watered, dna, start_round, terpene_profile, minor_profile")
