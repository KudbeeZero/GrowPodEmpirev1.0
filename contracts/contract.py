from pyteal import *

# Global State Keys
GlobalOwner = Bytes("owner")
GlobalPeriod = Bytes("period")  # 10 day cycle duration in seconds (864000)
GlobalCleanupCost = Bytes("cleanup_cost")  # 500 $BUD (500 * 10^6 = 500000000)
GlobalBreedCost = Bytes("breed_cost")  # 1000 $BUD (1000 * 10^6 = 1000000000)
GlobalBudAsset = Bytes("bud_asset")  # $BUD ASA ID
GlobalTerpAsset = Bytes("terp_asset")  # $TERP ASA ID
GlobalTerpProfileRegistry = Bytes("terp_registry")  # Hash registry for unique profiles

# Local State Keys - Pod 1 (per user) - 8 keys
LocalStage = Bytes("stage")  # 0=empty, 1-4=growing, 5=ready, 6=needs_cleanup
LocalWaterCount = Bytes("water_count")  # Number of successful waterings
LocalLastWatered = Bytes("last_watered")  # Timestamp of last water
LocalNutrientCount = Bytes("nutrient_count")  # Number of nutrient applications
LocalLastNutrients = Bytes("last_nutrients")  # Timestamp of last nutrient
LocalDna = Bytes("dna")  # Plant genetic hash
LocalStartRound = Bytes("start_round")  # Round when planted
LocalTerpeneProfile = Bytes("terpene_profile")  # Terpene hash for rarity check

# Local State Keys - Pod 2 (per user) - 8 keys
LocalStage2 = Bytes("stage_2")
LocalWaterCount2 = Bytes("water_count_2")
LocalLastWatered2 = Bytes("last_watered_2")
LocalNutrientCount2 = Bytes("nutrient_count_2")
LocalLastNutrients2 = Bytes("last_nutrients_2")
LocalDna2 = Bytes("dna_2")
LocalStartRound2 = Bytes("start_round_2")
LocalTerpeneProfile2 = Bytes("terpene_profile_2")

# Constants
BASE_YIELD = Int(250000000)  # 0.25g = 250,000,000 units (6 decimals)
WATER_COOLDOWN = Int(7200)  # 2 hours in seconds (TestNet default)
WATER_COOLDOWN_MIN = Int(7200)  # 2 hours minimum
NUTRIENT_COOLDOWN = Int(21600)  # 6 hours in seconds
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

    # User opt-in - Initialize local state for both pods
    handle_optin = Seq(
        # Pod 1
        App.localPut(Txn.sender(), LocalStage, Int(0)),
        App.localPut(Txn.sender(), LocalWaterCount, Int(0)),
        App.localPut(Txn.sender(), LocalLastWatered, Int(0)),
        App.localPut(Txn.sender(), LocalNutrientCount, Int(0)),
        App.localPut(Txn.sender(), LocalLastNutrients, Int(0)),
        App.localPut(Txn.sender(), LocalDna, Bytes("")),
        App.localPut(Txn.sender(), LocalStartRound, Int(0)),
        App.localPut(Txn.sender(), LocalTerpeneProfile, Bytes("")),
        # Pod 2
        App.localPut(Txn.sender(), LocalStage2, Int(0)),
        App.localPut(Txn.sender(), LocalWaterCount2, Int(0)),
        App.localPut(Txn.sender(), LocalLastWatered2, Int(0)),
        App.localPut(Txn.sender(), LocalNutrientCount2, Int(0)),
        App.localPut(Txn.sender(), LocalLastNutrients2, Int(0)),
        App.localPut(Txn.sender(), LocalDna2, Bytes("")),
        App.localPut(Txn.sender(), LocalStartRound2, Int(0)),
        App.localPut(Txn.sender(), LocalTerpeneProfile2, Bytes("")),
        Approve()
    )

    # Bootstrap ASAs - Create $BUD and $TERP tokens via inner transactions
    bootstrap_asas = Seq(
        Assert(is_owner),
        Assert(App.globalGet(GlobalBudAsset) == Int(0)),
        Assert(App.globalGet(GlobalTerpAsset) == Int(0)),
        
        # Create $BUD ASA
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.AssetConfig,
            TxnField.config_asset_total: Int(10000000000000000),
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
        
        # Create $TERP ASA
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.AssetConfig,
            TxnField.config_asset_total: Int(100000000000000),
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

    # ========== POD 1 METHODS ==========
    
    # Mint Pod 1 - Start growing a new plant
    mint_pod = Seq(
        Assert(App.localGet(Txn.sender(), LocalStage) == Int(0)),
        App.localPut(Txn.sender(), LocalDna, Sha256(Concat(
            Txn.sender(),
            Itob(Global.latest_timestamp()),
            Itob(Global.round())
        ))),
        App.localPut(Txn.sender(), LocalStage, Int(1)),
        App.localPut(Txn.sender(), LocalStartRound, Global.round()),
        App.localPut(Txn.sender(), LocalWaterCount, Int(0)),
        App.localPut(Txn.sender(), LocalLastWatered, Int(0)),
        App.localPut(Txn.sender(), LocalNutrientCount, Int(0)),
        App.localPut(Txn.sender(), LocalLastNutrients, Int(0)),
        App.localPut(Txn.sender(), LocalTerpeneProfile, Sha256(Concat(
            Bytes("terp"),
            Txn.sender(),
            Itob(Global.latest_timestamp())
        ))),
        Approve()
    )

    # Water Pod 1 - Water the plant with configurable cooldown
    # If args[1] is provided, use it as cooldown_seconds; otherwise default to WATER_COOLDOWN (24h)
    # Minimum cooldown enforced at WATER_COOLDOWN_MIN (2h) to prevent abuse
    scratch_cooldown = ScratchVar(TealType.uint64)
    
    water = Seq(
        Assert(App.localGet(Txn.sender(), LocalStage) >= Int(1)),
        Assert(App.localGet(Txn.sender(), LocalStage) <= Int(4)),
        
        # Use custom cooldown from args[1] if provided, else default 24h
        If(
            Txn.application_args.length() > Int(1),
            scratch_cooldown.store(Btoi(Txn.application_args[1])),
            scratch_cooldown.store(WATER_COOLDOWN)
        ),
        
        # Enforce minimum cooldown to prevent abuse (at least 2 hours)
        Assert(scratch_cooldown.load() >= WATER_COOLDOWN_MIN),
        
        Assert(
            Or(
                App.localGet(Txn.sender(), LocalLastWatered) == Int(0),
                Global.latest_timestamp() - App.localGet(Txn.sender(), LocalLastWatered) >= scratch_cooldown.load()
            )
        ),
        
        App.localPut(Txn.sender(), LocalLastWatered, Global.latest_timestamp()),
        App.localPut(Txn.sender(), LocalWaterCount, App.localGet(Txn.sender(), LocalWaterCount) + Int(1)),
        
        # Stage progression based on water count (10 waters to harvest)
        If(
            App.localGet(Txn.sender(), LocalWaterCount) >= Int(10),
            App.localPut(Txn.sender(), LocalStage, Int(5)),
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

    # Nutrients Pod 1 - Add nutrients with 6h cooldown
    nutrients = Seq(
        Assert(App.localGet(Txn.sender(), LocalStage) >= Int(1)),
        Assert(App.localGet(Txn.sender(), LocalStage) <= Int(4)),
        Assert(
            Or(
                App.localGet(Txn.sender(), LocalLastNutrients) == Int(0),
                Global.latest_timestamp() - App.localGet(Txn.sender(), LocalLastNutrients) >= NUTRIENT_COOLDOWN
            )
        ),
        
        App.localPut(Txn.sender(), LocalLastNutrients, Global.latest_timestamp()),
        App.localPut(Txn.sender(), LocalNutrientCount, App.localGet(Txn.sender(), LocalNutrientCount) + Int(1)),
        Approve()
    )

    # Harvest Pod 1
    harvest = Seq(
        Assert(App.localGet(Txn.sender(), LocalStage) == Int(5)),
        Assert(App.globalGet(GlobalBudAsset) != Int(0)),
        
        scratch_yield.store(BASE_YIELD),
        If(
            App.localGet(Txn.sender(), LocalWaterCount) >= Int(10),
            scratch_yield.store(scratch_yield.load() + (BASE_YIELD * Int(20) / Int(100)))
        ),
        # Bonus for nutrients (up to 30% extra with 10+ nutrients)
        If(
            App.localGet(Txn.sender(), LocalNutrientCount) >= Int(10),
            scratch_yield.store(scratch_yield.load() + (BASE_YIELD * Int(30) / Int(100)))
        ),
        
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.AssetTransfer,
            TxnField.xfer_asset: App.globalGet(GlobalBudAsset),
            TxnField.asset_amount: scratch_yield.load(),
            TxnField.asset_receiver: Txn.sender(),
        }),
        InnerTxnBuilder.Submit(),
        
        App.localPut(Txn.sender(), LocalStage, Int(6)),
        Approve()
    )

    # Cleanup Pod 1
    cleanup = Seq(
        Assert(App.localGet(Txn.sender(), LocalStage) == Int(6)),
        Assert(App.globalGet(GlobalBudAsset) != Int(0)),
        
        Assert(Gtxn[Txn.group_index() - Int(1)].type_enum() == TxnType.AssetTransfer),
        Assert(Gtxn[Txn.group_index() - Int(1)].xfer_asset() == App.globalGet(GlobalBudAsset)),
        Assert(Gtxn[Txn.group_index() - Int(1)].asset_amount() >= CLEANUP_BURN),
        Assert(Gtxn[Txn.group_index() - Int(1)].asset_receiver() == Global.current_application_address()),
        
        App.localPut(Txn.sender(), LocalStage, Int(0)),
        App.localPut(Txn.sender(), LocalWaterCount, Int(0)),
        App.localPut(Txn.sender(), LocalLastWatered, Int(0)),
        App.localPut(Txn.sender(), LocalNutrientCount, Int(0)),
        App.localPut(Txn.sender(), LocalLastNutrients, Int(0)),
        App.localPut(Txn.sender(), LocalDna, Bytes("")),
        App.localPut(Txn.sender(), LocalTerpeneProfile, Bytes("")),
        Approve()
    )

    # ========== POD 2 METHODS ==========
    
    # Mint Pod 2
    mint_pod_2 = Seq(
        Assert(App.localGet(Txn.sender(), LocalStage2) == Int(0)),
        App.localPut(Txn.sender(), LocalDna2, Sha256(Concat(
            Txn.sender(),
            Itob(Global.latest_timestamp()),
            Itob(Global.round()),
            Bytes("pod2")
        ))),
        App.localPut(Txn.sender(), LocalStage2, Int(1)),
        App.localPut(Txn.sender(), LocalStartRound2, Global.round()),
        App.localPut(Txn.sender(), LocalWaterCount2, Int(0)),
        App.localPut(Txn.sender(), LocalLastWatered2, Int(0)),
        App.localPut(Txn.sender(), LocalNutrientCount2, Int(0)),
        App.localPut(Txn.sender(), LocalLastNutrients2, Int(0)),
        App.localPut(Txn.sender(), LocalTerpeneProfile2, Sha256(Concat(
            Bytes("terp2"),
            Txn.sender(),
            Itob(Global.latest_timestamp())
        ))),
        Approve()
    )

    # Water Pod 2 - with configurable cooldown
    # Minimum cooldown enforced at WATER_COOLDOWN_MIN (2h) to prevent abuse
    scratch_cooldown_2 = ScratchVar(TealType.uint64)
    
    water_2 = Seq(
        Assert(App.localGet(Txn.sender(), LocalStage2) >= Int(1)),
        Assert(App.localGet(Txn.sender(), LocalStage2) <= Int(4)),
        
        # Use custom cooldown from args[1] if provided, else default 24h
        If(
            Txn.application_args.length() > Int(1),
            scratch_cooldown_2.store(Btoi(Txn.application_args[1])),
            scratch_cooldown_2.store(WATER_COOLDOWN)
        ),
        
        # Enforce minimum cooldown to prevent abuse (at least 2 hours)
        Assert(scratch_cooldown_2.load() >= WATER_COOLDOWN_MIN),
        
        Assert(
            Or(
                App.localGet(Txn.sender(), LocalLastWatered2) == Int(0),
                Global.latest_timestamp() - App.localGet(Txn.sender(), LocalLastWatered2) >= scratch_cooldown_2.load()
            )
        ),
        
        App.localPut(Txn.sender(), LocalLastWatered2, Global.latest_timestamp()),
        App.localPut(Txn.sender(), LocalWaterCount2, App.localGet(Txn.sender(), LocalWaterCount2) + Int(1)),
        
        # Stage progression based on water count (10 waters to harvest)
        If(
            App.localGet(Txn.sender(), LocalWaterCount2) >= Int(10),
            App.localPut(Txn.sender(), LocalStage2, Int(5)),
            If(
                App.localGet(Txn.sender(), LocalWaterCount2) == Int(3),
                App.localPut(Txn.sender(), LocalStage2, Int(2)),
                If(
                    App.localGet(Txn.sender(), LocalWaterCount2) == Int(6),
                    App.localPut(Txn.sender(), LocalStage2, Int(3)),
                    If(
                        App.localGet(Txn.sender(), LocalWaterCount2) == Int(8),
                        App.localPut(Txn.sender(), LocalStage2, Int(4))
                    )
                )
            )
        ),
        Approve()
    )

    # Nutrients Pod 2
    nutrients_2 = Seq(
        Assert(App.localGet(Txn.sender(), LocalStage2) >= Int(1)),
        Assert(App.localGet(Txn.sender(), LocalStage2) <= Int(4)),
        Assert(
            Or(
                App.localGet(Txn.sender(), LocalLastNutrients2) == Int(0),
                Global.latest_timestamp() - App.localGet(Txn.sender(), LocalLastNutrients2) >= NUTRIENT_COOLDOWN
            )
        ),
        
        App.localPut(Txn.sender(), LocalLastNutrients2, Global.latest_timestamp()),
        App.localPut(Txn.sender(), LocalNutrientCount2, App.localGet(Txn.sender(), LocalNutrientCount2) + Int(1)),
        Approve()
    )

    # Harvest Pod 2
    harvest_2 = Seq(
        Assert(App.localGet(Txn.sender(), LocalStage2) == Int(5)),
        Assert(App.globalGet(GlobalBudAsset) != Int(0)),
        
        scratch_yield.store(BASE_YIELD),
        If(
            App.localGet(Txn.sender(), LocalWaterCount2) >= Int(10),
            scratch_yield.store(scratch_yield.load() + (BASE_YIELD * Int(20) / Int(100)))
        ),
        # Bonus for nutrients (up to 30% extra with 10+ nutrients)
        If(
            App.localGet(Txn.sender(), LocalNutrientCount2) >= Int(10),
            scratch_yield.store(scratch_yield.load() + (BASE_YIELD * Int(30) / Int(100)))
        ),
        
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.AssetTransfer,
            TxnField.xfer_asset: App.globalGet(GlobalBudAsset),
            TxnField.asset_amount: scratch_yield.load(),
            TxnField.asset_receiver: Txn.sender(),
        }),
        InnerTxnBuilder.Submit(),
        
        App.localPut(Txn.sender(), LocalStage2, Int(6)),
        Approve()
    )

    # Cleanup Pod 2
    cleanup_2 = Seq(
        Assert(App.localGet(Txn.sender(), LocalStage2) == Int(6)),
        Assert(App.globalGet(GlobalBudAsset) != Int(0)),
        
        Assert(Gtxn[Txn.group_index() - Int(1)].type_enum() == TxnType.AssetTransfer),
        Assert(Gtxn[Txn.group_index() - Int(1)].xfer_asset() == App.globalGet(GlobalBudAsset)),
        Assert(Gtxn[Txn.group_index() - Int(1)].asset_amount() >= CLEANUP_BURN),
        Assert(Gtxn[Txn.group_index() - Int(1)].asset_receiver() == Global.current_application_address()),
        
        App.localPut(Txn.sender(), LocalStage2, Int(0)),
        App.localPut(Txn.sender(), LocalWaterCount2, Int(0)),
        App.localPut(Txn.sender(), LocalLastWatered2, Int(0)),
        App.localPut(Txn.sender(), LocalNutrientCount2, Int(0)),
        App.localPut(Txn.sender(), LocalLastNutrients2, Int(0)),
        App.localPut(Txn.sender(), LocalDna2, Bytes("")),
        App.localPut(Txn.sender(), LocalTerpeneProfile2, Bytes("")),
        Approve()
    )

    # ========== SHARED METHODS ==========

    # Check and Mint TERP for Pod 1
    check_terp = Seq(
        Assert(App.localGet(Txn.sender(), LocalStage) == Int(6)),
        Assert(App.globalGet(GlobalTerpAsset) != Int(0)),
        
        scratch_profile_hash.store(Sha256(
            App.localGet(Txn.sender(), LocalTerpeneProfile)
        )),
        
        If(
            GetByte(scratch_profile_hash.load(), Int(0)) < Int(32),
            Seq(
                scratch_terp_reward.store(
                    MIN_TERP_REWARD + 
                    ((Int(32) - GetByte(scratch_profile_hash.load(), Int(0))) * 
                     (MAX_TERP_REWARD - MIN_TERP_REWARD) / Int(32))
                ),
                
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

    # Check and Mint TERP for Pod 2
    check_terp_2 = Seq(
        Assert(App.localGet(Txn.sender(), LocalStage2) == Int(6)),
        Assert(App.globalGet(GlobalTerpAsset) != Int(0)),
        
        scratch_profile_hash.store(Sha256(
            App.localGet(Txn.sender(), LocalTerpeneProfile2)
        )),
        
        If(
            GetByte(scratch_profile_hash.load(), Int(0)) < Int(32),
            Seq(
                scratch_terp_reward.store(
                    MIN_TERP_REWARD + 
                    ((Int(32) - GetByte(scratch_profile_hash.load(), Int(0))) * 
                     (MAX_TERP_REWARD - MIN_TERP_REWARD) / Int(32))
                ),
                
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

    # Breed Action - Combine two plants
    breed = Seq(
        Assert(App.globalGet(GlobalBudAsset) != Int(0)),
        
        Assert(Gtxn[Txn.group_index() - Int(1)].type_enum() == TxnType.AssetTransfer),
        Assert(Gtxn[Txn.group_index() - Int(1)].xfer_asset() == App.globalGet(GlobalBudAsset)),
        Assert(Gtxn[Txn.group_index() - Int(1)].asset_amount() >= BREED_BURN),
        Assert(Gtxn[Txn.group_index() - Int(1)].asset_receiver() == Global.current_application_address()),
        
        Approve()
    )

    # Set ASA IDs manually
    set_asa_ids = Seq(
        Assert(is_owner),
        App.globalPut(GlobalBudAsset, Btoi(Txn.application_args[1])),
        App.globalPut(GlobalTerpAsset, Btoi(Txn.application_args[2])),
        Approve()
    )

    # Handle update/delete
    handle_update = Seq(
        Assert(is_owner),
        Approve()
    )
    
    handle_delete = Seq(
        Assert(is_owner),
        Approve()
    )

    # Main router with all methods
    return Cond(
        [Txn.application_id() == Int(0), handle_creation],
        [Txn.on_completion() == OnComplete.OptIn, handle_optin],
        [Txn.on_completion() == OnComplete.CloseOut, Approve()],
        [Txn.on_completion() == OnComplete.UpdateApplication, handle_update],
        [Txn.on_completion() == OnComplete.DeleteApplication, handle_delete],
        # Admin methods
        [Txn.application_args[0] == Bytes("bootstrap"), bootstrap_asas],
        [Txn.application_args[0] == Bytes("set_asa_ids"), set_asa_ids],
        # Pod 1 methods
        [Txn.application_args[0] == Bytes("mint_pod"), mint_pod],
        [Txn.application_args[0] == Bytes("water"), water],
        [Txn.application_args[0] == Bytes("nutrients"), nutrients],
        [Txn.application_args[0] == Bytes("harvest"), harvest],
        [Txn.application_args[0] == Bytes("cleanup"), cleanup],
        # Pod 2 methods
        [Txn.application_args[0] == Bytes("mint_pod_2"), mint_pod_2],
        [Txn.application_args[0] == Bytes("water_2"), water_2],
        [Txn.application_args[0] == Bytes("nutrients_2"), nutrients_2],
        [Txn.application_args[0] == Bytes("harvest_2"), harvest_2],
        [Txn.application_args[0] == Bytes("cleanup_2"), cleanup_2],
        # Shared methods
        [Txn.application_args[0] == Bytes("check_terp"), check_terp],
        [Txn.application_args[0] == Bytes("check_terp_2"), check_terp_2],
        [Txn.application_args[0] == Bytes("breed"), breed],
    )


def clear_state_program():
    return Approve()


if __name__ == "__main__":
    import os
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    approval_path = os.path.join(script_dir, "approval.teal")
    with open(approval_path, "w") as f:
        compiled = compileTeal(approval_program(), mode=Mode.Application, version=8)
        f.write(compiled)
        print(f"Compiled: {approval_path}")

    clear_path = os.path.join(script_dir, "clear.teal")
    with open(clear_path, "w") as f:
        compiled = compileTeal(clear_state_program(), mode=Mode.Application, version=8)
        f.write(compiled)
        print(f"Compiled: {clear_path}")
    
    print("\nContract compilation complete!")
    print("Global state: owner, period, cleanup_cost, breed_cost, bud_asset, terp_asset, terp_registry")
    print("Local state Pod 1: stage, water_count, last_watered, nutrient_count, last_nutrients, dna, start_round, terpene_profile")
    print("Local state Pod 2: stage_2, water_count_2, last_watered_2, nutrient_count_2, last_nutrients_2, dna_2, start_round_2, terpene_profile_2")
    print("\nMethods:")
    print("  Pod 1: mint_pod, water, nutrients, harvest, cleanup")
    print("  Pod 2: mint_pod_2, water_2, nutrients_2, harvest_2, cleanup_2")
    print("  Shared: check_terp, check_terp_2, breed, bootstrap, set_asa_ids")
