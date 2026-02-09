/**
 * TestNet Configuration for GrowPod Empire
 * All timers are in MINUTES for fast TestNet iteration.
 */

export const TESTNET_CONFIG = {
  // Network
  network: 'testnet' as const,
  chainId: 416002,
  algodServer: 'https://testnet-api.algonode.cloud',
  algodToken: '',
  reownProjectId: 'e237c5b78b0ae2a29f1a98bdb575e5ce',

  // Growth Timing (in seconds for internal use)
  growthCycleSeconds: 5 * 60,          // 5 minutes per growth stage
  growthCycleMinutes: 5,               // 5 minutes display
  waterCooldownSeconds: 60,            // 1 minute between waters on testnet
  nutrientCooldownSeconds: 60,         // 1 minute between nutrients

  // Cure Vault Tiers (in seconds)
  cureVault: {
    tiers: [
      { id: 'quick', label: 'Quick Cure', durationMinutes: 2, durationSeconds: 2 * 60, bonusPercent: 15 },
      { id: 'standard', label: 'Standard Cure', durationMinutes: 5, durationSeconds: 5 * 60, bonusPercent: 25 },
      { id: 'premium', label: 'Premium Cure', durationMinutes: 10, durationSeconds: 10 * 60, bonusPercent: 40 },
    ],
  },

  // Economics
  economics: {
    baseYield: 5000,          // Base $BUD per harvest
    cleanupCost: 2000,        // $BUD to clean diseased pod
    breedCost: 1000,          // $BUD to breed
    slotUnlockCost: 2500,     // $BUD to unlock slot
    centralBankFeePercent: 10, // 10% total fee
    centralBankBurnPercent: 5, // 5% burn
    centralBankTreasuryPercent: 5, // 5% treasury
  },

  // Pods
  maxPods: 5,

  // Disease
  diseaseChancePercent: 30,

  // Growth stages
  stages: {
    0: { name: 'Empty', icon: 'empty' },
    1: { name: 'Seedling', icon: 'seedling' },
    2: { name: 'Vegetative', icon: 'vegetative' },
    3: { name: 'Flowering', icon: 'flowering' },
    4: { name: 'Mature', icon: 'mature' },
    5: { name: 'Harvest Ready', icon: 'harvest' },
    6: { name: 'Needs Cleanup', icon: 'cleanup' },
  },

  // Waters needed to advance
  watersPerStage: 2,   // 10 total waters / 5 stages
  totalWatersNeeded: 10,
} as const;

export type CureVaultTier = typeof TESTNET_CONFIG.cureVault.tiers[number];

/**
 * Format seconds into MM:SS display
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Calculate $BUD yield with multiplier and cure bonus
 */
export function calculateYield(
  baseAmount: number,
  yieldMultiplier: number,
  cureBonusPercent: number = 0,
): number {
  const base = baseAmount * yieldMultiplier;
  const bonus = base * (cureBonusPercent / 100);
  return Math.floor(base + bonus);
}

/**
 * Calculate Central Bank fee breakdown
 */
export function calculateCentralBankFees(amount: number) {
  const totalFee = Math.floor(amount * (TESTNET_CONFIG.economics.centralBankFeePercent / 100));
  const burnAmount = Math.floor(amount * (TESTNET_CONFIG.economics.centralBankBurnPercent / 100));
  const treasuryAmount = Math.floor(amount * (TESTNET_CONFIG.economics.centralBankTreasuryPercent / 100));
  const netAmount = amount - totalFee;

  return {
    grossAmount: amount,
    totalFee,
    burnAmount,
    treasuryAmount,
    netAmount,
  };
}
