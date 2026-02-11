import { Contract } from '@algorandfoundation/tealscript';

// ===== Constants =====
// Note: Avoid underscore separators in numeric literals (TEALScript optimizer limitation)
const BASE_YIELD: uint64 = 250000000; // 0.25g = 250,000,000 units (6 decimals)
const WATER_COOLDOWN: uint64 = 600; // 10 minutes in seconds (TestNet)
const WATER_COOLDOWN_MIN: uint64 = 600; // 10 minutes minimum (TestNet)
const NUTRIENT_COOLDOWN: uint64 = 600; // 10 minutes in seconds (TestNet)
const GROWTH_CYCLE: uint64 = 864000; // 10 days in seconds
const CLEANUP_BURN: uint64 = 500000000; // 500 $BUD to burn for cleanup
const MIN_TERP_REWARD: uint64 = 5000000000; // 5,000 $TERP minimum
const MAX_TERP_REWARD: uint64 = 50000000000; // 50,000 $TERP maximum
const SLOT_TOKEN_COST: uint64 = 2500000000; // 2,500 $BUD to claim a slot token
const HARVESTS_FOR_SLOT: uint64 = 5; // 5 harvests required to claim slot token
const MAX_POD_SLOTS: uint64 = 5; // Maximum 5 pod slots per player

// eslint-disable-next-line no-unused-vars
export class GrowPodEmpire extends Contract {
  programVersion = 8;

  // ===== Global State (7 keys: 6 uint, 2 bytes) =====
  owner = GlobalStateKey<Address>({ key: 'owner' });
  period = GlobalStateKey<uint64>({ key: 'period' });
  cleanupCost = GlobalStateKey<uint64>({ key: 'cleanup_cost' });
  budAsset = GlobalStateKey<AssetID>({ key: 'bud_asset' });
  terpAsset = GlobalStateKey<AssetID>({ key: 'terp_asset' });
  slotAsset = GlobalStateKey<AssetID>({ key: 'slot_asset' });
  terpRegistry = GlobalStateKey<bytes>({ key: 'terp_registry' });

  // ===== Local State - Pod 1 (7 keys) =====
  stage = LocalStateKey<uint64>({ key: 'stage' }); // 0=empty, 1-4=growing, 5=ready, 6=needs_cleanup
  waterCount = LocalStateKey<uint64>({ key: 'water_count' });
  lastWatered = LocalStateKey<uint64>({ key: 'last_watered' });
  nutrientCount = LocalStateKey<uint64>({ key: 'nutrient_count' });
  lastNutrients = LocalStateKey<uint64>({ key: 'last_nutrients' });
  dna = LocalStateKey<bytes>({ key: 'dna' });
  terpeneProfile = LocalStateKey<bytes>({ key: 'terpene_profile' });

  // ===== Local State - Pod 2 (7 keys) =====
  stage2 = LocalStateKey<uint64>({ key: 'stage_2' });
  waterCount2 = LocalStateKey<uint64>({ key: 'water_count_2' });
  lastWatered2 = LocalStateKey<uint64>({ key: 'last_watered_2' });
  nutrientCount2 = LocalStateKey<uint64>({ key: 'nutrient_count_2' });
  lastNutrients2 = LocalStateKey<uint64>({ key: 'last_nutrients_2' });
  dna2 = LocalStateKey<bytes>({ key: 'dna_2' });
  terpeneProfile2 = LocalStateKey<bytes>({ key: 'terpene_profile_2' });

  // ===== Local State - Slot Progression (2 keys) =====
  harvestCount = LocalStateKey<uint64>({ key: 'harvest_count' });
  podSlots = LocalStateKey<uint64>({ key: 'pod_slots' });

  // ===================================================================
  // LIFECYCLE METHODS
  // ===================================================================

  /** Initialize the contract - set owner and default global state */
  createApplication(): void {
    this.owner.value = this.txn.sender;
    this.period.value = GROWTH_CYCLE;
    this.cleanupCost.value = CLEANUP_BURN;
    this.budAsset.value = AssetID.zeroIndex;
    this.terpAsset.value = AssetID.zeroIndex;
    this.slotAsset.value = AssetID.zeroIndex;
    this.terpRegistry.value = '';
  }

  /** User opt-in - Initialize local state for both pods (16 keys max) */
  optInToApplication(): void {
    // Pod 1 (7 keys)
    this.stage(this.txn.sender).value = 0;
    this.waterCount(this.txn.sender).value = 0;
    this.lastWatered(this.txn.sender).value = 0;
    this.nutrientCount(this.txn.sender).value = 0;
    this.lastNutrients(this.txn.sender).value = 0;
    this.dna(this.txn.sender).value = '';
    this.terpeneProfile(this.txn.sender).value = '';

    // Pod 2 (7 keys)
    this.stage2(this.txn.sender).value = 0;
    this.waterCount2(this.txn.sender).value = 0;
    this.lastWatered2(this.txn.sender).value = 0;
    this.nutrientCount2(this.txn.sender).value = 0;
    this.lastNutrients2(this.txn.sender).value = 0;
    this.dna2(this.txn.sender).value = '';
    this.terpeneProfile2(this.txn.sender).value = '';

    // Slot progression (2 keys) - start with 2 slots
    this.harvestCount(this.txn.sender).value = 0;
    this.podSlots(this.txn.sender).value = 2;
  }

  /** Allow close-out */
  closeOutOfApplication(): void {}

  /** Allow contract updates (owner only) */
  updateApplication(): void {
    assert(this.txn.sender === this.owner.value);
  }

  /** Allow contract deletion (owner only) */
  deleteApplication(): void {
    assert(this.txn.sender === this.owner.value);
  }

  // ===================================================================
  // ADMIN METHODS
  // ===================================================================

  /** Bootstrap - Create $BUD, $TERP, and Slot Token ASAs via inner transactions */
  bootstrap(): void {
    assert(this.txn.sender === this.owner.value);
    assert(this.budAsset.value === AssetID.zeroIndex);
    assert(this.terpAsset.value === AssetID.zeroIndex);

    // Create $BUD ASA (10B total, 6 decimals)
    sendAssetCreation({
      configAssetTotal: Uint<64>('10000000000000000'),
      configAssetDecimals: 6,
      configAssetUnitName: 'BUD',
      configAssetName: 'GrowPod BUD',
      configAssetURL: 'https://growpod.empire/bud',
      configAssetManager: this.app.address,
      configAssetReserve: this.app.address,
      configAssetFreeze: this.app.address,
      configAssetClawback: this.app.address,
    });
    this.budAsset.value = this.itxn.createdAssetID;

    // Create $TERP ASA (100M total, 6 decimals)
    sendAssetCreation({
      configAssetTotal: Uint<64>('100000000000000'),
      configAssetDecimals: 6,
      configAssetUnitName: 'TERP',
      configAssetName: 'GrowPod TERP',
      configAssetURL: 'https://growpod.empire/terp',
      configAssetManager: this.app.address,
      configAssetReserve: this.app.address,
      configAssetFreeze: this.app.address,
      configAssetClawback: this.app.address,
    });
    this.terpAsset.value = this.itxn.createdAssetID;

    // Create Slot Token ASA (1M total, 0 decimals for whole tokens)
    sendAssetCreation({
      configAssetTotal: 1000000,
      configAssetDecimals: 0,
      configAssetUnitName: 'SLOT',
      configAssetName: 'GrowPod Slot Token',
      configAssetURL: 'https://growpod.empire/slot',
      configAssetManager: this.app.address,
      configAssetReserve: this.app.address,
      configAssetFreeze: this.app.address,
      configAssetClawback: this.app.address,
    });
    this.slotAsset.value = this.itxn.createdAssetID;
  }

  /** Set ASA IDs manually (owner only, for re-deployment or recovery) */
  setAsaIds(budId: AssetID, terpId: AssetID, slotId: AssetID): void {
    assert(this.txn.sender === this.owner.value);
    this.budAsset.value = budId;
    this.terpAsset.value = terpId;
    this.slotAsset.value = slotId;
  }

  // ===================================================================
  // POD 1 METHODS
  // ===================================================================

  /** Mint Pod 1 - Start growing a new plant */
  mintPod(): void {
    assert(this.stage(this.txn.sender).value === 0);

    // Generate random DNA hash: SHA256(sender + timestamp + round)
    this.dna(this.txn.sender).value = rawBytes(
      sha256(concat(concat(this.txn.sender, itob(globals.latestTimestamp)), itob(globals.round)))
    );

    this.stage(this.txn.sender).value = 1;
    this.waterCount(this.txn.sender).value = 0;
    this.lastWatered(this.txn.sender).value = 0;
    this.nutrientCount(this.txn.sender).value = 0;
    this.lastNutrients(this.txn.sender).value = 0;

    // Generate random terpene profile: SHA256("terp" + sender + timestamp)
    this.terpeneProfile(this.txn.sender).value = rawBytes(
      sha256(concat(concat('terp', this.txn.sender), itob(globals.latestTimestamp)))
    );
  }

  /**
   * Water Pod 1 - Water the plant with configurable cooldown.
   * Minimum cooldown enforced at WATER_COOLDOWN_MIN (10 min) to prevent abuse.
   * @param cooldownSeconds - Custom cooldown in seconds (minimum 600)
   */
  water(cooldownSeconds: uint64): void {
    assert(this.stage(this.txn.sender).value >= 1);
    assert(this.stage(this.txn.sender).value <= 4);

    // Enforce minimum cooldown to prevent abuse
    assert(cooldownSeconds >= WATER_COOLDOWN_MIN);

    // Check cooldown has elapsed
    assert(
      this.lastWatered(this.txn.sender).value === 0 ||
        globals.latestTimestamp - this.lastWatered(this.txn.sender).value >= cooldownSeconds
    );

    // Update water state
    this.lastWatered(this.txn.sender).value = globals.latestTimestamp;
    this.waterCount(this.txn.sender).value = this.waterCount(this.txn.sender).value + 1;

    // Stage progression based on water count (10 waters to harvest)
    const wc = this.waterCount(this.txn.sender).value;
    if (wc >= 10) {
      this.stage(this.txn.sender).value = 5; // Ready to harvest
    } else if (wc === 3) {
      this.stage(this.txn.sender).value = 2;
    } else if (wc === 6) {
      this.stage(this.txn.sender).value = 3;
    } else if (wc === 8) {
      this.stage(this.txn.sender).value = 4;
    }
  }

  /** Nutrients Pod 1 - Add nutrients with cooldown for yield bonus */
  nutrients(): void {
    assert(this.stage(this.txn.sender).value >= 1);
    assert(this.stage(this.txn.sender).value <= 4);

    // Check cooldown has elapsed
    assert(
      this.lastNutrients(this.txn.sender).value === 0 ||
        globals.latestTimestamp - this.lastNutrients(this.txn.sender).value >= NUTRIENT_COOLDOWN
    );

    this.lastNutrients(this.txn.sender).value = globals.latestTimestamp;
    this.nutrientCount(this.txn.sender).value = this.nutrientCount(this.txn.sender).value + 1;
  }

  /** Harvest Pod 1 - Mint $BUD tokens based on care quality */
  harvest(): void {
    assert(this.stage(this.txn.sender).value === 5);
    assert(this.budAsset.value !== AssetID.zeroIndex);

    // Calculate yield with bonuses
    let yieldAmount: uint64 = BASE_YIELD;

    // +20% bonus for 10+ waters
    if (this.waterCount(this.txn.sender).value >= 10) {
      yieldAmount = yieldAmount + (BASE_YIELD * 20) / 100;
    }

    // +30% bonus for 10+ nutrients (up to 50% total)
    if (this.nutrientCount(this.txn.sender).value >= 10) {
      yieldAmount = yieldAmount + (BASE_YIELD * 30) / 100;
    }

    // Mint $BUD to user via inner transaction
    sendAssetTransfer({
      xferAsset: this.budAsset.value,
      assetAmount: yieldAmount,
      assetReceiver: this.txn.sender,
    });

    // Move to needs_cleanup stage
    this.stage(this.txn.sender).value = 6;

    // Increment total harvest count for slot progression
    this.harvestCount(this.txn.sender).value = this.harvestCount(this.txn.sender).value + 1;
  }

  /**
   * Cleanup Pod 1 - Reset pod after harvest by burning $BUD.
   * Expects a preceding AssetTransfer of >= 500 $BUD to the contract address.
   * @param budBurnTxn - The $BUD burn asset transfer transaction
   */
  cleanup(budBurnTxn: AssetTransferTxn): void {
    assert(this.stage(this.txn.sender).value === 6);
    assert(this.budAsset.value !== AssetID.zeroIndex);

    // Validate the $BUD burn in the preceding transaction
    verifyAssetTransferTxn(budBurnTxn, {
      xferAsset: this.budAsset.value,
      assetAmount: { greaterThanEqualTo: CLEANUP_BURN },
      assetReceiver: this.app.address,
    });

    // Reset all pod 1 state
    this.stage(this.txn.sender).value = 0;
    this.waterCount(this.txn.sender).value = 0;
    this.lastWatered(this.txn.sender).value = 0;
    this.nutrientCount(this.txn.sender).value = 0;
    this.lastNutrients(this.txn.sender).value = 0;
    this.dna(this.txn.sender).value = '';
    this.terpeneProfile(this.txn.sender).value = '';
  }

  // ===================================================================
  // POD 2 METHODS
  // ===================================================================

  /** Mint Pod 2 - Start growing a new plant in the second pod */
  mintPod2(): void {
    assert(this.stage2(this.txn.sender).value === 0);

    // Generate random DNA hash: SHA256(sender + timestamp + round + "pod2")
    this.dna2(this.txn.sender).value = rawBytes(
      sha256(
        concat(
          concat(concat(this.txn.sender, itob(globals.latestTimestamp)), itob(globals.round)),
          'pod2'
        )
      )
    );

    this.stage2(this.txn.sender).value = 1;
    this.waterCount2(this.txn.sender).value = 0;
    this.lastWatered2(this.txn.sender).value = 0;
    this.nutrientCount2(this.txn.sender).value = 0;
    this.lastNutrients2(this.txn.sender).value = 0;

    // Generate random terpene profile: SHA256("terp2" + sender + timestamp)
    this.terpeneProfile2(this.txn.sender).value = rawBytes(
      sha256(concat(concat('terp2', this.txn.sender), itob(globals.latestTimestamp)))
    );
  }

  /**
   * Water Pod 2 - Water the second plant with configurable cooldown.
   * @param cooldownSeconds - Custom cooldown in seconds (minimum 600)
   */
  water2(cooldownSeconds: uint64): void {
    assert(this.stage2(this.txn.sender).value >= 1);
    assert(this.stage2(this.txn.sender).value <= 4);

    // Enforce minimum cooldown to prevent abuse
    assert(cooldownSeconds >= WATER_COOLDOWN_MIN);

    // Check cooldown has elapsed
    assert(
      this.lastWatered2(this.txn.sender).value === 0 ||
        globals.latestTimestamp - this.lastWatered2(this.txn.sender).value >= cooldownSeconds
    );

    // Update water state
    this.lastWatered2(this.txn.sender).value = globals.latestTimestamp;
    this.waterCount2(this.txn.sender).value = this.waterCount2(this.txn.sender).value + 1;

    // Stage progression based on water count (10 waters to harvest)
    const wc = this.waterCount2(this.txn.sender).value;
    if (wc >= 10) {
      this.stage2(this.txn.sender).value = 5;
    } else if (wc === 3) {
      this.stage2(this.txn.sender).value = 2;
    } else if (wc === 6) {
      this.stage2(this.txn.sender).value = 3;
    } else if (wc === 8) {
      this.stage2(this.txn.sender).value = 4;
    }
  }

  /** Nutrients Pod 2 - Add nutrients to the second plant */
  nutrients2(): void {
    assert(this.stage2(this.txn.sender).value >= 1);
    assert(this.stage2(this.txn.sender).value <= 4);

    assert(
      this.lastNutrients2(this.txn.sender).value === 0 ||
        globals.latestTimestamp - this.lastNutrients2(this.txn.sender).value >= NUTRIENT_COOLDOWN
    );

    this.lastNutrients2(this.txn.sender).value = globals.latestTimestamp;
    this.nutrientCount2(this.txn.sender).value = this.nutrientCount2(this.txn.sender).value + 1;
  }

  /** Harvest Pod 2 - Mint $BUD tokens based on care quality */
  harvest2(): void {
    assert(this.stage2(this.txn.sender).value === 5);
    assert(this.budAsset.value !== AssetID.zeroIndex);

    let yieldAmount: uint64 = BASE_YIELD;

    if (this.waterCount2(this.txn.sender).value >= 10) {
      yieldAmount = yieldAmount + (BASE_YIELD * 20) / 100;
    }

    if (this.nutrientCount2(this.txn.sender).value >= 10) {
      yieldAmount = yieldAmount + (BASE_YIELD * 30) / 100;
    }

    sendAssetTransfer({
      xferAsset: this.budAsset.value,
      assetAmount: yieldAmount,
      assetReceiver: this.txn.sender,
    });

    this.stage2(this.txn.sender).value = 6;
    this.harvestCount(this.txn.sender).value = this.harvestCount(this.txn.sender).value + 1;
  }

  /**
   * Cleanup Pod 2 - Reset the second pod after harvest by burning $BUD.
   * @param budBurnTxn - The $BUD burn asset transfer transaction
   */
  cleanup2(budBurnTxn: AssetTransferTxn): void {
    assert(this.stage2(this.txn.sender).value === 6);
    assert(this.budAsset.value !== AssetID.zeroIndex);

    verifyAssetTransferTxn(budBurnTxn, {
      xferAsset: this.budAsset.value,
      assetAmount: { greaterThanEqualTo: CLEANUP_BURN },
      assetReceiver: this.app.address,
    });

    this.stage2(this.txn.sender).value = 0;
    this.waterCount2(this.txn.sender).value = 0;
    this.lastWatered2(this.txn.sender).value = 0;
    this.nutrientCount2(this.txn.sender).value = 0;
    this.lastNutrients2(this.txn.sender).value = 0;
    this.dna2(this.txn.sender).value = '';
    this.terpeneProfile2(this.txn.sender).value = '';
  }

  // ===================================================================
  // SHARED METHODS
  // ===================================================================

  /**
   * Check and mint $TERP for Pod 1.
   * Hashes the terpene profile; if first byte < 32 (~12.5% chance), mints rare $TERP reward.
   * Reward scales: 5,000 - 50,000 $TERP based on rarity score.
   */
  checkTerp(): void {
    assert(this.stage(this.txn.sender).value === 6);
    assert(this.terpAsset.value !== AssetID.zeroIndex);

    const profileHash = sha256(this.terpeneProfile(this.txn.sender).value);
    const firstByte = getbyte(profileHash, 0);

    // ~12.5% chance of rare terpene (first byte < 32 out of 256)
    if (firstByte < 32) {
      const reward: uint64 =
        MIN_TERP_REWARD + ((32 - firstByte) * (MAX_TERP_REWARD - MIN_TERP_REWARD)) / 32;

      sendAssetTransfer({
        xferAsset: this.terpAsset.value,
        assetAmount: reward,
        assetReceiver: this.txn.sender,
      });
    }
  }

  /**
   * Check and mint $TERP for Pod 2.
   * Same logic as checkTerp but uses Pod 2 terpene profile.
   */
  checkTerp2(): void {
    assert(this.stage2(this.txn.sender).value === 6);
    assert(this.terpAsset.value !== AssetID.zeroIndex);

    const profileHash = sha256(this.terpeneProfile2(this.txn.sender).value);
    const firstByte = getbyte(profileHash, 0);

    if (firstByte < 32) {
      const reward: uint64 =
        MIN_TERP_REWARD + ((32 - firstByte) * (MAX_TERP_REWARD - MIN_TERP_REWARD)) / 32;

      sendAssetTransfer({
        xferAsset: this.terpAsset.value,
        assetAmount: reward,
        assetReceiver: this.txn.sender,
      });
    }
  }

  /**
   * Breed - Combine two seed NFTs with full security validation.
   * Expects atomic group: [seed1 transfer, seed2 transfer, breed app call]
   *
   * @param seed1Txn - Asset transfer of seed 1 NFT to contract
   * @param seed2Txn - Asset transfer of seed 2 NFT to contract
   * @param seed1AssetId - Expected asset ID of seed 1
   * @param seed2AssetId - Expected asset ID of seed 2
   */
  breed(
    seed1Txn: AssetTransferTxn,
    seed2Txn: AssetTransferTxn,
    seed1AssetId: AssetID,
    seed2AssetId: AssetID
  ): void {
    assert(this.budAsset.value !== AssetID.zeroIndex);

    // Validate seed 1 transfer with full security checks
    verifyAssetTransferTxn(seed1Txn, {
      xferAsset: seed1AssetId,
      assetAmount: { greaterThanEqualTo: 1 },
      assetReceiver: this.app.address,
      rekeyTo: globals.zeroAddress,
      assetCloseTo: globals.zeroAddress,
      assetSender: globals.zeroAddress,
    });

    // Validate seed 2 transfer with full security checks
    verifyAssetTransferTxn(seed2Txn, {
      xferAsset: seed2AssetId,
      assetAmount: { greaterThanEqualTo: 1 },
      assetReceiver: this.app.address,
      rekeyTo: globals.zeroAddress,
      assetCloseTo: globals.zeroAddress,
      assetSender: globals.zeroAddress,
    });

    // Genetics calculated off-chain: 60% seed 1, 30% seed 2, 10% mutation
  }

  /**
   * Claim Slot Token - Burn 2,500 $BUD after 5 harvests to earn a Slot Token.
   * Deducts 5 harvests (preserves carryover for players who harvested more).
   *
   * @param budBurnTxn - The $BUD burn asset transfer (>= 2,500 $BUD)
   */
  claimSlotToken(budBurnTxn: AssetTransferTxn): void {
    assert(this.slotAsset.value !== AssetID.zeroIndex);
    assert(this.budAsset.value !== AssetID.zeroIndex);

    // Require at least 5 harvests
    assert(this.harvestCount(this.txn.sender).value >= HARVESTS_FOR_SLOT);

    // Validate $BUD burn
    verifyAssetTransferTxn(budBurnTxn, {
      xferAsset: this.budAsset.value,
      assetAmount: { greaterThanEqualTo: SLOT_TOKEN_COST },
      assetReceiver: this.app.address,
    });

    // Mint 1 Slot Token to user
    sendAssetTransfer({
      xferAsset: this.slotAsset.value,
      assetAmount: 1,
      assetReceiver: this.txn.sender,
    });

    // Deduct 5 harvests (preserves carryover)
    this.harvestCount(this.txn.sender).value =
      this.harvestCount(this.txn.sender).value - HARVESTS_FOR_SLOT;
  }

  /**
   * Unlock Slot - Burn 1 Slot Token to unlock an additional pod slot (max 5).
   *
   * @param slotBurnTxn - The Slot Token burn (exactly 1 SLOT token)
   */
  unlockSlot(slotBurnTxn: AssetTransferTxn): void {
    assert(this.slotAsset.value !== AssetID.zeroIndex);

    // Must have less than max slots
    assert(this.podSlots(this.txn.sender).value < MAX_POD_SLOTS);

    // Validate exactly 1 Slot Token burn
    verifyAssetTransferTxn(slotBurnTxn, {
      xferAsset: this.slotAsset.value,
      assetAmount: { greaterThanEqualTo: 1 },
      assetReceiver: this.app.address,
    });

    // Increment pod slots
    this.podSlots(this.txn.sender).value = this.podSlots(this.txn.sender).value + 1;
  }
}
