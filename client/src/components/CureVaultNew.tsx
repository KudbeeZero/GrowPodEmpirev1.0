import { useState, useEffect, useCallback } from 'react';
import { useAlgorand, useGameState } from '@/hooks/use-algorand';
import { TESTNET_CONFIG, formatTimeRemaining, calculateYield, type CureVaultTier } from '@/data/testnetConfig';
import { useToast } from '@/hooks/use-toast';
import { Lock, Timer, TrendingUp, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './CureVault.css';

interface ActiveCure {
  id: string;
  amount: number;
  tier: CureVaultTier;
  lockedAt: number; // timestamp ms
  unlocksAt: number; // timestamp ms
}

export default function CureVaultPage() {
  const { account } = useAlgorand();
  const { budBalance } = useGameState(account);
  const { toast } = useToast();

  const [selectedTier, setSelectedTier] = useState<CureVaultTier>(TESTNET_CONFIG.cureVault.tiers[0]);
  const [lockAmount, setLockAmount] = useState('');
  const [activeCures, setActiveCures] = useState<ActiveCure[]>([]);

  const budBalanceNum = Math.floor(Number(budBalance) / 1_000_000);

  const handleLock = useCallback(() => {
    const amount = Number(lockAmount);
    if (!amount || amount <= 0) {
      toast({ title: 'Enter Amount', description: 'Enter the amount of BIOMASS to lock.', variant: 'destructive' });
      return;
    }
    if (amount > budBalanceNum) {
      toast({ title: 'Insufficient Balance', description: 'You don\'t have enough $BUD.', variant: 'destructive' });
      return;
    }

    const now = Date.now();
    const newCure: ActiveCure = {
      id: `cure-${now}`,
      amount,
      tier: selectedTier,
      lockedAt: now,
      unlocksAt: now + selectedTier.durationSeconds * 1000,
    };

    setActiveCures(prev => [...prev, newCure]);
    setLockAmount('');

    toast({
      title: 'BIOMASS Locked',
      description: `${amount.toLocaleString()} BIOMASS locked for ${selectedTier.durationMinutes} minutes (+${selectedTier.bonusPercent}% bonus)`,
    });
  }, [lockAmount, selectedTier, budBalanceNum, toast]);

  const handleUnlock = useCallback((cureId: string) => {
    const cure = activeCures.find(c => c.id === cureId);
    if (!cure) return;

    const payout = calculateYield(cure.amount, 1, cure.tier.bonusPercent);
    setActiveCures(prev => prev.filter(c => c.id !== cureId));

    toast({
      title: 'Cure Complete!',
      description: `Unlocked ${payout.toLocaleString()} $BUD (${cure.tier.bonusPercent}% bonus applied)`,
    });
  }, [activeCures, toast]);

  // Preview calculation
  const previewAmount = Number(lockAmount) || 0;
  const previewBonus = Math.floor(previewAmount * (selectedTier.bonusPercent / 100));
  const previewTotal = previewAmount + previewBonus;

  return (
    <div className="cure-vault container mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-emerald-500/20 p-3 rounded-lg">
          <Lock className="h-8 w-8 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">Cure Vault</h1>
          <p className="text-muted-foreground">
            Lock BIOMASS to cure it — longer cures earn bigger bonuses
          </p>
        </div>
      </div>

      {/* Tier Selection */}
      <div className="cure-tiers">
        {TESTNET_CONFIG.cureVault.tiers.map((tier) => (
          <motion.div
            key={tier.id}
            className={`cure-tier-card tier-${tier.id} ${selectedTier.id === tier.id ? 'selected' : ''}`}
            onClick={() => setSelectedTier(tier)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="cure-tier-header">
              <span className="cure-tier-name">{tier.label}</span>
              <span className="cure-tier-bonus">+{tier.bonusPercent}%</span>
            </div>
            <div className="cure-tier-duration">
              <Timer className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
              {tier.durationMinutes} minute{tier.durationMinutes !== 1 ? 's' : ''} lock period
            </div>
            <p className="cure-tier-description">
              {tier.id === 'quick'
                ? 'Fast cure for quick turnaround. Minimal bonus but no wait.'
                : tier.id === 'standard'
                ? 'Balanced cure time with solid bonus. Recommended for active players.'
                : 'Maximum bonus for patient growers. Premium curing quality.'}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Lock Section */}
      <div className="cure-lock-section">
        <div className="cure-lock-header">
          <span className="cure-lock-title">Lock BIOMASS</span>
          <span className="cure-lock-balance">
            Balance: {budBalanceNum.toLocaleString()} $BUD
          </span>
        </div>

        <div className="cure-input-row">
          <input
            type="number"
            className="cure-input"
            placeholder="Enter amount..."
            value={lockAmount}
            onChange={(e) => setLockAmount(e.target.value)}
            min={0}
            max={budBalanceNum}
          />
          <button
            className="cure-max-btn"
            onClick={() => setLockAmount(String(budBalanceNum))}
          >
            MAX
          </button>
        </div>

        {/* Payout Preview */}
        {previewAmount > 0 && (
          <motion.div
            className="cure-payout"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <div className="cure-payout-row">
              <span className="cure-payout-label">Base Amount</span>
              <span className="cure-payout-value">{previewAmount.toLocaleString()} $BUD</span>
            </div>
            <div className="cure-payout-row">
              <span className="cure-payout-label">Cure Bonus (+{selectedTier.bonusPercent}%)</span>
              <span className="cure-payout-value" style={{ color: '#00ff94' }}>
                +{previewBonus.toLocaleString()} $BUD
              </span>
            </div>
            <div className="cure-payout-row">
              <span className="cure-payout-label">Lock Duration</span>
              <span className="cure-payout-value">{selectedTier.durationMinutes} min</span>
            </div>
            <div className="cure-payout-total">
              <span className="cure-payout-label">Total Payout</span>
              <span className="cure-payout-value">{previewTotal.toLocaleString()} $BUD</span>
            </div>
          </motion.div>
        )}

        <button
          className="cure-lock-btn"
          disabled={!account || previewAmount <= 0 || previewAmount > budBalanceNum}
          onClick={handleLock}
        >
          <Lock className="inline h-4 w-4 mr-1 -mt-0.5" />
          {!account
            ? 'Connect Wallet'
            : previewAmount <= 0
            ? 'Enter Amount'
            : `Lock ${previewAmount.toLocaleString()} for ${selectedTier.durationMinutes} min`}
        </button>
      </div>

      {/* Active Cures */}
      {activeCures.length > 0 && (
        <div>
          <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            Active Cures
          </h2>
          <div className="cure-active-list">
            {activeCures.map((cure) => (
              <ActiveCureItem
                key={cure.id}
                cure={cure}
                onUnlock={handleUnlock}
              />
            ))}
          </div>
        </div>
      )}

      {activeCures.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No active cures. Lock some BIOMASS above to start earning bonuses.</p>
        </div>
      )}
    </div>
  );
}

interface ActiveCureItemProps {
  cure: ActiveCure;
  onUnlock: (id: string) => void;
}

function ActiveCureItem({ cure, onUnlock }: ActiveCureItemProps) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const update = () => {
      const remaining = Math.max(0, Math.floor((cure.unlocksAt - Date.now()) / 1000));
      setTimeRemaining(remaining);
      if (remaining <= 0) setIsComplete(true);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [cure.unlocksAt]);

  const payout = calculateYield(cure.amount, 1, cure.tier.bonusPercent);

  return (
    <motion.div
      className="cure-active-item"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div className="cure-active-info">
        <span className="cure-active-amount">
          {cure.amount.toLocaleString()} $BUD
        </span>
        <span className="cure-active-tier">
          {cure.tier.label} (+{cure.tier.bonusPercent}%) → {payout.toLocaleString()} $BUD
        </span>
      </div>

      {isComplete ? (
        <button
          className="cure-unlock-btn"
          onClick={() => onUnlock(cure.id)}
        >
          Unlock
        </button>
      ) : (
        <div className="cure-active-timer">
          <div className="cure-active-countdown">
            {formatTimeRemaining(timeRemaining)}
          </div>
          <div className="cure-active-status">Curing...</div>
        </div>
      )}
    </motion.div>
  );
}
