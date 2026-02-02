"""
GrowPod Empire V2.0 Smart Contract
NFT-Based Tokenomics: Seed NFTs → Grow → Biomass NFTs → Process/Cure

Key Changes from V1:
- Seed NFTs hold genetic traits (created via inner txn)
- Harvest creates Biomass NFT (not direct $BUD mint)
- Biomass weight = embedded $BUD value
- Process: Burn Biomass NFT → Mint $BUD tokens
- Cure Vault: Time-lock biomass for bonus weight
- Breeding: Combine 2 seeds → New seed NFT
"""

from pyteal import *

# ============================================
# GLOBAL STATE KEYS
# ============================================
GlobalOwner = Bytes("owner")
GlobalBudAsset = Bytes("bud_asset")        # $BUD ASA ID
GlobalTerpAsset = Bytes("terp_asset")      # $TERP ASA ID
GlobalSlotAsset = Bytes("slot_asset")      # Slot Token ASA ID
GlobalSeedCounter = Bytes("seed_counter")  # For unique seed IDs
GlobalBiomassCounter = Bytes("biomass_counter")  # For unique biomass IDs
GlobalTotalBiomassWeight = Bytes("total_biomass")  # Track total biomass in circulation
GlobalCureVaultBalance = Bytes("cure_vault_bal")  # Total biomass in cure vault

# ============================================
# LOCAL STATE KEYS - Pod 1 (7 keys)
# ============================================
LocalStage = Bytes("stage")                # 0=empty, 1-4=growing, 5=ready, 6=harvested
LocalWaterCount = Bytes("water_count")
LocalLastWatered = Bytes("last_watered")
LocalNutrientCount = Bytes("nutrient_count")
LocalLastNutrients = Bytes("last_nutrients")
LocalPlantedSeedId = Bytes("planted_seed")  # ASA ID of planted seed
LocalPlantedTime = Bytes("planted_time")    # When seed was planted

# ============================================
# LOCAL STATE KEYS - Pod 2 (7 keys)
# ============================================
LocalStage2 = Bytes("stage_2")
LocalWaterCount2 = Bytes("water_count_2")
LocalLastWatered2 = Bytes("last_watered_2")
LocalNutrientCount2 = Bytes("nutrient_count_2")
LocalLastNutrients2 = Bytes("last_nutrients_2")
LocalPlantedSeedId2 = Bytes("planted_seed_2")
LocalPlantedTime2 = Bytes("planted_time_2")

# ============================================
# LOCAL STATE KEYS - Progression (2 keys)
# ============================================
LocalHarvestCount = Bytes("harvest_count")
LocalPodSlots = Bytes("pod_slots")

# ============================================
# CONSTANTS
# ============================================
# Cooldowns (TestNet: 10 minutes)
WATER_COOLDOWN = Int(600)
WATER_COOLDOWN_MIN = Int(600)
NUTRIENT_COOLDOWN = Int(600)

# Costs
CLEANUP_BURN = Int(500000000)       # 500 $BUD
BREED_COST = Int(1000000000)        # 1000 $BUD to breed seeds
SEED_MINT_COST = Int(250000000)     # 250 $BUD to mint a seed from bank
SLOT_TOKEN_COST = Int(2500000000)   # 2500 $BUD for slot token
PROCESS_FEE = Int(50000000)         # 50 $BUD processing fee (5%)

# Biomass calculations (in milligrams, 1mg = 1 $BUD micro-unit)
BASE_WEIGHT = Int(2000000)          # 2.0g base weight
MIN_WEIGHT = Int(500000)            # 0.5g minimum
MAX_WEIGHT = Int(3500000)           # 3.5g maximum

# Cure vault
CURE_BONUS_MAX = Int(25)            # 25% max bonus
CURE_DAYS_FOR_MAX = Int(30)         # 30 days for max bonus
SECONDS_PER_DAY = Int(86400)

# Slot progression
HARVESTS_FOR_SLOT = Int(5)
MAX_POD_SLOTS = Int(5)


def approval_program():
    # Scratch variables
    scratch_weight = ScratchVar(TealType.uint64)
    scratch_bonus = ScratchVar(TealType.uint64)
    scratch_cooldown = ScratchVar(TealType.uint64)

    is_owner = Txn.sender() == App.globalGet(GlobalOwner)

    # ========================================
    # APPLICATION LIFECYCLE
    # ========================================

    handle_creation = Seq(
        App.globalPut(GlobalOwner, Txn.sender()),
        App.globalPut(GlobalBudAsset, Int(0)),
        App.globalPut(GlobalTerpAsset, Int(0)),
        App.globalPut(GlobalSlotAsset, Int(0)),
        App.globalPut(GlobalSeedCounter, Int(0)),
        App.globalPut(GlobalBiomassCounter, Int(0)),
        App.globalPut(GlobalTotalBiomassWeight, Int(0)),
        App.globalPut(GlobalCureVaultBalance, Int(0)),
        Approve()
    )

    handle_optin = Seq(
        # Pod 1
        App.localPut(Txn.sender(), LocalStage, Int(0)),
        App.localPut(Txn.sender(), LocalWaterCount, Int(0)),
        App.localPut(Txn.sender(), LocalLastWatered, Int(0)),
        App.localPut(Txn.sender(), LocalNutrientCount, Int(0)),
        App.localPut(Txn.sender(), LocalLastNutrients, Int(0)),
        App.localPut(Txn.sender(), LocalPlantedSeedId, Int(0)),
        App.localPut(Txn.sender(), LocalPlantedTime, Int(0)),
        # Pod 2
        App.localPut(Txn.sender(), LocalStage2, Int(0)),
        App.localPut(Txn.sender(), LocalWaterCount2, Int(0)),
        App.localPut(Txn.sender(), LocalLastWatered2, Int(0)),
        App.localPut(Txn.sender(), LocalNutrientCount2, Int(0)),
        App.localPut(Txn.sender(), LocalLastNutrients2, Int(0)),
        App.localPut(Txn.sender(), LocalPlantedSeedId2, Int(0)),
        App.localPut(Txn.sender(), LocalPlantedTime2, Int(0)),
        # Progression
        App.localPut(Txn.sender(), LocalHarvestCount, Int(0)),
        App.localPut(Txn.sender(), LocalPodSlots, Int(2)),
        Approve()
    )

    # ========================================
    # ADMIN: BOOTSTRAP ASAs
    # ========================================

    bootstrap_asas = Seq(
        Assert(is_owner),
        Assert(App.globalGet(GlobalBudAsset) == Int(0)),

        # Create $BUD ASA
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.AssetConfig,
            TxnField.config_asset_total: Int(10000000000000000),  # 10B with 6 decimals
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
            TxnField.config_asset_total: Int(100000000000000),  # 100M with 6 decimals
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

        # Create Slot Token ASA
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.AssetConfig,
            TxnField.config_asset_total: Int(1000000),
            TxnField.config_asset_decimals: Int(0),
            TxnField.config_asset_unit_name: Bytes("SLOT"),
            TxnField.config_asset_name: Bytes("GrowPod Slot Token"),
            TxnField.config_asset_url: Bytes("https://growpod.empire/slot"),
            TxnField.config_asset_manager: Global.current_application_address(),
            TxnField.config_asset_reserve: Global.current_application_address(),
            TxnField.config_asset_freeze: Global.current_application_address(),
            TxnField.config_asset_clawback: Global.current_application_address(),
        }),
        InnerTxnBuilder.Submit(),
        App.globalPut(GlobalSlotAsset, InnerTxn.created_asset_id()),

        Approve()
    )

    set_asa_ids = Seq(
        Assert(is_owner),
        App.globalPut(GlobalBudAsset, Btoi(Txn.application_args[1])),
        App.globalPut(GlobalTerpAsset, Btoi(Txn.application_args[2])),
        If(
            Txn.application_args.length() > Int(3),
            App.globalPut(GlobalSlotAsset, Btoi(Txn.application_args[3]))
        ),
        Approve()
    )

    # ========================================
    # SEED NFT: MINT FROM SEED BANK
    # ========================================
    # Args: [0]="mint_seed", [1]=strain_index, [2]=rarity_index
    # Requires: $BUD payment in group

    mint_seed = Seq(
        Assert(App.globalGet(GlobalBudAsset) != Int(0)),
        # Verify $BUD payment
        Assert(Gtxn[Txn.group_index() - Int(1)].type_enum() == TxnType.AssetTransfer),
        Assert(Gtxn[Txn.group_index() - Int(1)].xfer_asset() == App.globalGet(GlobalBudAsset)),
        Assert(Gtxn[Txn.group_index() - Int(1)].asset_amount() >= SEED_MINT_COST),
        Assert(Gtxn[Txn.group_index() - Int(1)].asset_receiver() == Global.current_application_address()),

        # Increment seed counter
        App.globalPut(GlobalSeedCounter, App.globalGet(GlobalSeedCounter) + Int(1)),

        # Create Seed NFT via inner transaction
        # Note: Metadata stored in URL (points to IPFS with ARC-69 JSON)
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.AssetConfig,
            TxnField.config_asset_total: Int(1),  # NFT = 1 total
            TxnField.config_asset_decimals: Int(0),
            TxnField.config_asset_unit_name: Bytes("SEED"),
            TxnField.config_asset_name: Concat(
                Bytes("GrowPod Seed #"),
                Itob(App.globalGet(GlobalSeedCounter))
            ),
            TxnField.config_asset_url: Bytes("template-ipfs://{ipfscid:1:raw:reserve:sha2-256}"),
            TxnField.config_asset_manager: Global.current_application_address(),
            TxnField.config_asset_reserve: Global.current_application_address(),  # For ARC-19 metadata
            TxnField.config_asset_freeze: Global.current_application_address(),
            TxnField.config_asset_clawback: Global.current_application_address(),
        }),
        InnerTxnBuilder.Submit(),

        # Transfer seed NFT to buyer
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.AssetTransfer,
            TxnField.xfer_asset: InnerTxn.created_asset_id(),
            TxnField.asset_amount: Int(1),
            TxnField.asset_receiver: Txn.sender(),
        }),
        InnerTxnBuilder.Submit(),

        Approve()
    )

    # ========================================
    # PLANT SEED IN POD
    # ========================================
    # Args: [0]="plant_seed" or "plant_seed_2", [1]=seed_asa_id
    # Requires: Seed NFT transfer to contract in group

    plant_seed = Seq(
        Assert(App.localGet(Txn.sender(), LocalStage) == Int(0)),  # Pod must be empty

        # Verify seed NFT transfer
        Assert(Gtxn[Txn.group_index() - Int(1)].type_enum() == TxnType.AssetTransfer),
        Assert(Gtxn[Txn.group_index() - Int(1)].asset_amount() == Int(1)),
        Assert(Gtxn[Txn.group_index() - Int(1)].asset_receiver() == Global.current_application_address()),

        # Store seed ID and start growing
        App.localPut(Txn.sender(), LocalPlantedSeedId, Gtxn[Txn.group_index() - Int(1)].xfer_asset()),
        App.localPut(Txn.sender(), LocalPlantedTime, Global.latest_timestamp()),
        App.localPut(Txn.sender(), LocalStage, Int(1)),
        App.localPut(Txn.sender(), LocalWaterCount, Int(0)),
        App.localPut(Txn.sender(), LocalLastWatered, Int(0)),
        App.localPut(Txn.sender(), LocalNutrientCount, Int(0)),
        App.localPut(Txn.sender(), LocalLastNutrients, Int(0)),

        Approve()
    )

    plant_seed_2 = Seq(
        Assert(App.localGet(Txn.sender(), LocalStage2) == Int(0)),

        Assert(Gtxn[Txn.group_index() - Int(1)].type_enum() == TxnType.AssetTransfer),
        Assert(Gtxn[Txn.group_index() - Int(1)].asset_amount() == Int(1)),
        Assert(Gtxn[Txn.group_index() - Int(1)].asset_receiver() == Global.current_application_address()),

        App.localPut(Txn.sender(), LocalPlantedSeedId2, Gtxn[Txn.group_index() - Int(1)].xfer_asset()),
        App.localPut(Txn.sender(), LocalPlantedTime2, Global.latest_timestamp()),
        App.localPut(Txn.sender(), LocalStage2, Int(1)),
        App.localPut(Txn.sender(), LocalWaterCount2, Int(0)),
        App.localPut(Txn.sender(), LocalLastWatered2, Int(0)),
        App.localPut(Txn.sender(), LocalNutrientCount2, Int(0)),
        App.localPut(Txn.sender(), LocalLastNutrients2, Int(0)),

        Approve()
    )

    # ========================================
    # WATER (same as V1 but cleaner)
    # ========================================

    water = Seq(
        Assert(App.localGet(Txn.sender(), LocalStage) >= Int(1)),
        Assert(App.localGet(Txn.sender(), LocalStage) <= Int(4)),

        If(
            Txn.application_args.length() > Int(1),
            scratch_cooldown.store(Btoi(Txn.application_args[1])),
            scratch_cooldown.store(WATER_COOLDOWN)
        ),
        Assert(scratch_cooldown.load() >= WATER_COOLDOWN_MIN),

        Assert(
            Or(
                App.localGet(Txn.sender(), LocalLastWatered) == Int(0),
                Global.latest_timestamp() - App.localGet(Txn.sender(), LocalLastWatered) >= scratch_cooldown.load()
            )
        ),

        App.localPut(Txn.sender(), LocalLastWatered, Global.latest_timestamp()),
        App.localPut(Txn.sender(), LocalWaterCount, App.localGet(Txn.sender(), LocalWaterCount) + Int(1)),

        # Stage progression
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

    water_2 = Seq(
        Assert(App.localGet(Txn.sender(), LocalStage2) >= Int(1)),
        Assert(App.localGet(Txn.sender(), LocalStage2) <= Int(4)),

        If(
            Txn.application_args.length() > Int(1),
            scratch_cooldown.store(Btoi(Txn.application_args[1])),
            scratch_cooldown.store(WATER_COOLDOWN)
        ),
        Assert(scratch_cooldown.load() >= WATER_COOLDOWN_MIN),

        Assert(
            Or(
                App.localGet(Txn.sender(), LocalLastWatered2) == Int(0),
                Global.latest_timestamp() - App.localGet(Txn.sender(), LocalLastWatered2) >= scratch_cooldown.load()
            )
        ),

        App.localPut(Txn.sender(), LocalLastWatered2, Global.latest_timestamp()),
        App.localPut(Txn.sender(), LocalWaterCount2, App.localGet(Txn.sender(), LocalWaterCount2) + Int(1)),

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

    # ========================================
    # NUTRIENTS
    # ========================================

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

    # ========================================
    # HARVEST - Creates BIOMASS NFT
    # ========================================
    # Weight calculated from care quality
    # NFT minted with weight as embedded value

    harvest = Seq(
        Assert(App.localGet(Txn.sender(), LocalStage) == Int(5)),

        # Calculate weight based on care
        scratch_weight.store(BASE_WEIGHT),

        # Water bonus: +2% per extra water above 10, max +20%
        If(
            App.localGet(Txn.sender(), LocalWaterCount) > Int(10),
            scratch_weight.store(
                scratch_weight.load() +
                (scratch_weight.load() *
                 (App.localGet(Txn.sender(), LocalWaterCount) - Int(10)) * Int(2) / Int(100))
            )
        ),

        # Nutrient bonus: +3% per nutrient, max +30%
        scratch_weight.store(
            scratch_weight.load() +
            (scratch_weight.load() *
             App.localGet(Txn.sender(), LocalNutrientCount) * Int(3) / Int(100))
        ),

        # Clamp weight
        If(scratch_weight.load() > MAX_WEIGHT, scratch_weight.store(MAX_WEIGHT)),
        If(scratch_weight.load() < MIN_WEIGHT, scratch_weight.store(MIN_WEIGHT)),

        # Increment biomass counter
        App.globalPut(GlobalBiomassCounter, App.globalGet(GlobalBiomassCounter) + Int(1)),
        App.globalPut(GlobalTotalBiomassWeight, App.globalGet(GlobalTotalBiomassWeight) + scratch_weight.load()),

        # Create Biomass NFT
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.AssetConfig,
            TxnField.config_asset_total: Int(1),
            TxnField.config_asset_decimals: Int(0),
            TxnField.config_asset_unit_name: Bytes("BIOMASS"),
            TxnField.config_asset_name: Concat(
                Bytes("GrowPod Biomass #"),
                Itob(App.globalGet(GlobalBiomassCounter))
            ),
            TxnField.config_asset_url: Bytes("template-ipfs://{ipfscid:1:raw:reserve:sha2-256}"),
            TxnField.config_asset_manager: Global.current_application_address(),
            TxnField.config_asset_reserve: Global.current_application_address(),
            TxnField.config_asset_freeze: Global.current_application_address(),
            TxnField.config_asset_clawback: Global.current_application_address(),
            # Store weight in note field for easy reading
            TxnField.note: Concat(
                Bytes("weight:"),
                Itob(scratch_weight.load()),
                Bytes(",seed:"),
                Itob(App.localGet(Txn.sender(), LocalPlantedSeedId))
            ),
        }),
        InnerTxnBuilder.Submit(),

        # Transfer Biomass NFT to player
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.AssetTransfer,
            TxnField.xfer_asset: InnerTxn.created_asset_id(),
            TxnField.asset_amount: Int(1),
            TxnField.asset_receiver: Txn.sender(),
        }),
        InnerTxnBuilder.Submit(),

        # Update state
        App.localPut(Txn.sender(), LocalStage, Int(6)),
        App.localPut(Txn.sender(), LocalHarvestCount, App.localGet(Txn.sender(), LocalHarvestCount) + Int(1)),

        Approve()
    )

    harvest_2 = Seq(
        Assert(App.localGet(Txn.sender(), LocalStage2) == Int(5)),

        scratch_weight.store(BASE_WEIGHT),

        If(
            App.localGet(Txn.sender(), LocalWaterCount2) > Int(10),
            scratch_weight.store(
                scratch_weight.load() +
                (scratch_weight.load() *
                 (App.localGet(Txn.sender(), LocalWaterCount2) - Int(10)) * Int(2) / Int(100))
            )
        ),

        scratch_weight.store(
            scratch_weight.load() +
            (scratch_weight.load() *
             App.localGet(Txn.sender(), LocalNutrientCount2) * Int(3) / Int(100))
        ),

        If(scratch_weight.load() > MAX_WEIGHT, scratch_weight.store(MAX_WEIGHT)),
        If(scratch_weight.load() < MIN_WEIGHT, scratch_weight.store(MIN_WEIGHT)),

        App.globalPut(GlobalBiomassCounter, App.globalGet(GlobalBiomassCounter) + Int(1)),
        App.globalPut(GlobalTotalBiomassWeight, App.globalGet(GlobalTotalBiomassWeight) + scratch_weight.load()),

        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.AssetConfig,
            TxnField.config_asset_total: Int(1),
            TxnField.config_asset_decimals: Int(0),
            TxnField.config_asset_unit_name: Bytes("BIOMASS"),
            TxnField.config_asset_name: Concat(
                Bytes("GrowPod Biomass #"),
                Itob(App.globalGet(GlobalBiomassCounter))
            ),
            TxnField.config_asset_url: Bytes("template-ipfs://{ipfscid:1:raw:reserve:sha2-256}"),
            TxnField.config_asset_manager: Global.current_application_address(),
            TxnField.config_asset_reserve: Global.current_application_address(),
            TxnField.config_asset_freeze: Global.current_application_address(),
            TxnField.config_asset_clawback: Global.current_application_address(),
            TxnField.note: Concat(
                Bytes("weight:"),
                Itob(scratch_weight.load()),
                Bytes(",seed:"),
                Itob(App.localGet(Txn.sender(), LocalPlantedSeedId2))
            ),
        }),
        InnerTxnBuilder.Submit(),

        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.AssetTransfer,
            TxnField.xfer_asset: InnerTxn.created_asset_id(),
            TxnField.asset_amount: Int(1),
            TxnField.asset_receiver: Txn.sender(),
        }),
        InnerTxnBuilder.Submit(),

        App.localPut(Txn.sender(), LocalStage2, Int(6)),
        App.localPut(Txn.sender(), LocalHarvestCount, App.localGet(Txn.sender(), LocalHarvestCount) + Int(1)),

        Approve()
    )

    # ========================================
    # PROCESS BIOMASS - Burn NFT, Mint $BUD
    # ========================================
    # Args: [0]="process", [1]=weight_amount (from NFT metadata)
    # Requires: Biomass NFT transfer to contract

    process_biomass = Seq(
        Assert(App.globalGet(GlobalBudAsset) != Int(0)),

        # Verify biomass NFT transfer
        Assert(Gtxn[Txn.group_index() - Int(1)].type_enum() == TxnType.AssetTransfer),
        Assert(Gtxn[Txn.group_index() - Int(1)].asset_amount() == Int(1)),
        Assert(Gtxn[Txn.group_index() - Int(1)].asset_receiver() == Global.current_application_address()),

        # Get weight from args (verified off-chain from NFT metadata)
        scratch_weight.store(Btoi(Txn.application_args[1])),

        # Mint $BUD equal to weight (1mg = 1 $BUD micro-unit)
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.AssetTransfer,
            TxnField.xfer_asset: App.globalGet(GlobalBudAsset),
            TxnField.asset_amount: scratch_weight.load(),
            TxnField.asset_receiver: Txn.sender(),
        }),
        InnerTxnBuilder.Submit(),

        # Update global tracking
        App.globalPut(GlobalTotalBiomassWeight,
            App.globalGet(GlobalTotalBiomassWeight) - scratch_weight.load()),

        Approve()
    )

    # ========================================
    # CLEANUP POD
    # ========================================

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
        App.localPut(Txn.sender(), LocalPlantedSeedId, Int(0)),
        App.localPut(Txn.sender(), LocalPlantedTime, Int(0)),

        Approve()
    )

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
        App.localPut(Txn.sender(), LocalPlantedSeedId2, Int(0)),
        App.localPut(Txn.sender(), LocalPlantedTime2, Int(0)),

        Approve()
    )

    # ========================================
    # BREEDING - Combine 2 Seeds → New Seed
    # ========================================
    # Requires: 2 Seed NFT transfers + $BUD payment

    breed_seeds = Seq(
        Assert(App.globalGet(GlobalBudAsset) != Int(0)),

        # Security: Ensure transaction is grouped with sufficient size
        Assert(Txn.group_index() >= Int(3)),
        Assert(Global.group_size() >= Int(4)),

        # Verify $BUD payment (index - 3)
        Assert(Gtxn[Txn.group_index() - Int(3)].sender() == Txn.sender()),
        Assert(Gtxn[Txn.group_index() - Int(3)].type_enum() == TxnType.AssetTransfer),
        Assert(Gtxn[Txn.group_index() - Int(3)].xfer_asset() == App.globalGet(GlobalBudAsset)),
        Assert(Gtxn[Txn.group_index() - Int(3)].asset_amount() >= BREED_COST),
        Assert(Gtxn[Txn.group_index() - Int(3)].asset_receiver() == Global.current_application_address()),

        # Verify seed 1 transfer (index - 2)
        Assert(Gtxn[Txn.group_index() - Int(2)].sender() == Txn.sender()),
        Assert(Gtxn[Txn.group_index() - Int(2)].type_enum() == TxnType.AssetTransfer),
        Assert(Gtxn[Txn.group_index() - Int(2)].asset_amount() == Int(1)),
        Assert(Gtxn[Txn.group_index() - Int(2)].asset_receiver() == Global.current_application_address()),

        # Verify seed 2 transfer (index - 1)
        Assert(Gtxn[Txn.group_index() - Int(1)].sender() == Txn.sender()),
        Assert(Gtxn[Txn.group_index() - Int(1)].type_enum() == TxnType.AssetTransfer),
        Assert(Gtxn[Txn.group_index() - Int(1)].asset_amount() == Int(1)),
        Assert(Gtxn[Txn.group_index() - Int(1)].asset_receiver() == Global.current_application_address()),

        # Increment seed counter
        App.globalPut(GlobalSeedCounter, App.globalGet(GlobalSeedCounter) + Int(1)),

        # Create new bred Seed NFT
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.AssetConfig,
            TxnField.config_asset_total: Int(1),
            TxnField.config_asset_decimals: Int(0),
            TxnField.config_asset_unit_name: Bytes("SEED"),
            TxnField.config_asset_name: Concat(
                Bytes("GrowPod Bred Seed #"),
                Itob(App.globalGet(GlobalSeedCounter))
            ),
            TxnField.config_asset_url: Bytes("template-ipfs://{ipfscid:1:raw:reserve:sha2-256}"),
            TxnField.config_asset_manager: Global.current_application_address(),
            TxnField.config_asset_reserve: Global.current_application_address(),
            TxnField.config_asset_freeze: Global.current_application_address(),
            TxnField.config_asset_clawback: Global.current_application_address(),
            TxnField.note: Concat(
                Bytes("parent1:"),
                Itob(Gtxn[Txn.group_index() - Int(2)].xfer_asset()),
                Bytes(",parent2:"),
                Itob(Gtxn[Txn.group_index() - Int(1)].xfer_asset())
            ),
        }),
        InnerTxnBuilder.Submit(),

        # Transfer new seed to breeder
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.AssetTransfer,
            TxnField.xfer_asset: InnerTxn.created_asset_id(),
            TxnField.asset_amount: Int(1),
            TxnField.asset_receiver: Txn.sender(),
        }),
        InnerTxnBuilder.Submit(),

        Approve()
    )

    # ========================================
    # SLOT PROGRESSION (unchanged from V1)
    # ========================================

    claim_slot_token = Seq(
        Assert(App.globalGet(GlobalSlotAsset) != Int(0)),
        Assert(App.globalGet(GlobalBudAsset) != Int(0)),
        Assert(App.localGet(Txn.sender(), LocalHarvestCount) >= HARVESTS_FOR_SLOT),

        # Security: Ensure transaction is grouped and not at index 0
        Assert(Txn.group_index() > Int(0)),
        Assert(Global.group_size() > Int(1)),

        # Security: Verify $BUD payment comes from sender to contract
        Assert(Gtxn[Txn.group_index() - Int(1)].sender() == Txn.sender()),
        Assert(Gtxn[Txn.group_index() - Int(1)].type_enum() == TxnType.AssetTransfer),
        Assert(Gtxn[Txn.group_index() - Int(1)].xfer_asset() == App.globalGet(GlobalBudAsset)),
        Assert(Gtxn[Txn.group_index() - Int(1)].asset_amount() >= SLOT_TOKEN_COST),
        Assert(Gtxn[Txn.group_index() - Int(1)].asset_receiver() == Global.current_application_address()),

        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.AssetTransfer,
            TxnField.xfer_asset: App.globalGet(GlobalSlotAsset),
            TxnField.asset_amount: Int(1),
            TxnField.asset_receiver: Txn.sender(),
        }),
        InnerTxnBuilder.Submit(),

        App.localPut(Txn.sender(), LocalHarvestCount,
            App.localGet(Txn.sender(), LocalHarvestCount) - HARVESTS_FOR_SLOT),
        Approve()
    )

    unlock_slot = Seq(
        Assert(App.globalGet(GlobalSlotAsset) != Int(0)),
        Assert(App.localGet(Txn.sender(), LocalPodSlots) < MAX_POD_SLOTS),

        # Security: Ensure transaction is grouped and not at index 0
        Assert(Txn.group_index() > Int(0)),
        Assert(Global.group_size() > Int(1)),

        # Security: Verify slot token payment comes from sender to contract
        Assert(Gtxn[Txn.group_index() - Int(1)].sender() == Txn.sender()),
        Assert(Gtxn[Txn.group_index() - Int(1)].type_enum() == TxnType.AssetTransfer),
        Assert(Gtxn[Txn.group_index() - Int(1)].xfer_asset() == App.globalGet(GlobalSlotAsset)),
        Assert(Gtxn[Txn.group_index() - Int(1)].asset_amount() == Int(1)),
        Assert(Gtxn[Txn.group_index() - Int(1)].asset_receiver() == Global.current_application_address()),

        App.localPut(Txn.sender(), LocalPodSlots, App.localGet(Txn.sender(), LocalPodSlots) + Int(1)),
        Approve()
    )

    # ========================================
    # UPDATE / DELETE
    # ========================================

    handle_update = Seq(Assert(is_owner), Approve())
    handle_delete = Seq(Assert(is_owner), Approve())

    # ========================================
    # ROUTER
    # ========================================

    return Cond(
        [Txn.application_id() == Int(0), handle_creation],
        [Txn.on_completion() == OnComplete.OptIn, handle_optin],
        [Txn.on_completion() == OnComplete.CloseOut, Approve()],
        [Txn.on_completion() == OnComplete.UpdateApplication, handle_update],
        [Txn.on_completion() == OnComplete.DeleteApplication, handle_delete],
        # Admin
        [Txn.application_args[0] == Bytes("bootstrap"), bootstrap_asas],
        [Txn.application_args[0] == Bytes("set_asa_ids"), set_asa_ids],
        # Seed NFT
        [Txn.application_args[0] == Bytes("mint_seed"), mint_seed],
        [Txn.application_args[0] == Bytes("plant_seed"), plant_seed],
        [Txn.application_args[0] == Bytes("plant_seed_2"), plant_seed_2],
        # Growing
        [Txn.application_args[0] == Bytes("water"), water],
        [Txn.application_args[0] == Bytes("water_2"), water_2],
        [Txn.application_args[0] == Bytes("nutrients"), nutrients],
        [Txn.application_args[0] == Bytes("nutrients_2"), nutrients_2],
        # Harvest → Biomass NFT
        [Txn.application_args[0] == Bytes("harvest"), harvest],
        [Txn.application_args[0] == Bytes("harvest_2"), harvest_2],
        # Process Biomass → $BUD
        [Txn.application_args[0] == Bytes("process"), process_biomass],
        # Cleanup
        [Txn.application_args[0] == Bytes("cleanup"), cleanup],
        [Txn.application_args[0] == Bytes("cleanup_2"), cleanup_2],
        # Breeding
        [Txn.application_args[0] == Bytes("breed"), breed_seeds],
        # Slot progression
        [Txn.application_args[0] == Bytes("claim_slot_token"), claim_slot_token],
        [Txn.application_args[0] == Bytes("unlock_slot"), unlock_slot],
    )


def clear_state_program():
    return Approve()


if __name__ == "__main__":
    import os
    script_dir = os.path.dirname(os.path.abspath(__file__))

    approval_path = os.path.join(script_dir, "approval_v2.teal")
    with open(approval_path, "w") as f:
        compiled = compileTeal(approval_program(), mode=Mode.Application, version=8)
        f.write(compiled)
        print(f"Compiled: {approval_path}")

    clear_path = os.path.join(script_dir, "clear_v2.teal")
    with open(clear_path, "w") as f:
        compiled = compileTeal(clear_state_program(), mode=Mode.Application, version=8)
        f.write(compiled)
        print(f"Compiled: {clear_path}")

    print("\n=== GrowPod Empire V2.0 Contract ===")
    print("\nNEW NFT-Based Tokenomics:")
    print("  1. Seed NFTs hold genetic traits")
    print("  2. Plant seed in pod → Grow with skill")
    print("  3. Harvest creates Biomass NFT (weight = $BUD value)")
    print("  4. Process: Burn Biomass → Mint $BUD")
    print("  5. Breed: Combine 2 Seeds → New unique Seed")
    print("\nMethods:")
    print("  Admin: bootstrap, set_asa_ids")
    print("  Seeds: mint_seed, plant_seed, plant_seed_2, breed")
    print("  Growing: water, water_2, nutrients, nutrients_2")
    print("  Harvest: harvest, harvest_2 (creates Biomass NFT)")
    print("  Process: process (burn Biomass → $BUD)")
    print("  Cleanup: cleanup, cleanup_2")
    print("  Slots: claim_slot_token, unlock_slot")
