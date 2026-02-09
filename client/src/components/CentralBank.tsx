import { useState, useCallback } from 'react';
import { useAlgorand, useGameState } from '@/hooks/use-algorand';
import { TESTNET_CONFIG, calculateCentralBankFees } from '@/data/testnetConfig';
import { useToast } from '@/hooks/use-toast';
import {
  Landmark,
  Flame,
  Building2,
  ArrowDownUp,
  TrendingUp,
  CircleDollarSign,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './CentralBank.css';

type BankState = 'idle' | 'confirm' | 'success' | 'error';

export default function CentralBank() {
  const { account } = useAlgorand();
  const { budBalance } = useGameState(account);
  const { toast } = useToast();

  const [sellAmount, setSellAmount] = useState('');
  const [bankState, setBankState] = useState<BankState>('idle');
  const [lastTransaction, setLastTransaction] = useState<{ gross: number; net: number } | null>(null);

  const budBalanceNum = Math.floor(Number(budBalance) / 1_000_000);
  const amount = Number(sellAmount) || 0;
  const fees = calculateCentralBankFees(amount);

  const handleSell = useCallback(() => {
    if (amount <= 0 || amount > budBalanceNum) return;
    setBankState('confirm');
  }, [amount, budBalanceNum]);

  const handleConfirm = useCallback(() => {
    setLastTransaction({ gross: fees.grossAmount, net: fees.netAmount });
    setBankState('success');
    setSellAmount('');

    toast({
      title: 'Sale Complete',
      description: `Sold ${fees.grossAmount.toLocaleString()} BIOMASS for ${fees.netAmount.toLocaleString()} $BUD`,
    });

    setTimeout(() => setBankState('idle'), 3000);
  }, [fees, toast]);

  const handleCancel = useCallback(() => {
    setBankState('idle');
  }, []);

  const quickAmounts = [
    { label: '25%', value: Math.floor(budBalanceNum * 0.25) },
    { label: '50%', value: Math.floor(budBalanceNum * 0.5) },
    { label: '75%', value: Math.floor(budBalanceNum * 0.75) },
    { label: 'MAX', value: budBalanceNum },
  ];

  return (
    <div className="central-bank container mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-emerald-500/20 p-3 rounded-lg">
          <Landmark className="h-8 w-8 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">Central Bank</h1>
          <p className="text-muted-foreground">
            Sell BIOMASS instantly — {TESTNET_CONFIG.economics.centralBankFeePercent}% fee ({TESTNET_CONFIG.economics.centralBankBurnPercent}% burn + {TESTNET_CONFIG.economics.centralBankTreasuryPercent}% treasury)
          </p>
        </div>
      </div>

      <div className="bank-main">
        {/* Sell Panel */}
        <div className="bank-sell-panel">
          <div className="bank-sell-header">
            <span className="bank-sell-title">Sell BIOMASS</span>
            <span className="bank-sell-rate">1:1 — 10% fee</span>
          </div>

          <div className="bank-input-group">
            <div className="bank-input-label">
              <span>Amount to sell</span>
              <span>Balance: {budBalanceNum.toLocaleString()}</span>
            </div>
            <input
              type="number"
              className="bank-input"
              placeholder="Enter BIOMASS amount..."
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
              min={0}
              max={budBalanceNum}
            />
          </div>

          <div className="bank-quick-amounts">
            {quickAmounts.map((qa) => (
              <button
                key={qa.label}
                className="bank-quick-btn"
                onClick={() => setSellAmount(String(qa.value))}
              >
                {qa.label}
              </button>
            ))}
          </div>

          {/* Fee Breakdown */}
          {amount > 0 && (
            <motion.div
              className="bank-fee-breakdown"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <div className="bank-fee-row">
                <span className="bank-fee-label">Gross Amount</span>
                <span className="bank-fee-value">{fees.grossAmount.toLocaleString()} BIOMASS</span>
              </div>
              <div className="bank-fee-row">
                <span className="bank-fee-label">
                  <Flame className="inline h-3 w-3 mr-1 -mt-0.5" />
                  Burn ({TESTNET_CONFIG.economics.centralBankBurnPercent}%)
                </span>
                <span className="bank-fee-value bank-fee-burn">-{fees.burnAmount.toLocaleString()}</span>
              </div>
              <div className="bank-fee-row">
                <span className="bank-fee-label">
                  <Building2 className="inline h-3 w-3 mr-1 -mt-0.5" />
                  Treasury ({TESTNET_CONFIG.economics.centralBankTreasuryPercent}%)
                </span>
                <span className="bank-fee-value bank-fee-treasury">-{fees.treasuryAmount.toLocaleString()}</span>
              </div>
              <div className="bank-fee-divider" />
              <div className="bank-fee-net">
                <span className="bank-fee-label">You Receive</span>
                <span className="bank-fee-value">{fees.netAmount.toLocaleString()} $BUD</span>
              </div>
            </motion.div>
          )}

          <button
            className="bank-sell-btn"
            disabled={!account || amount <= 0 || amount > budBalanceNum}
            onClick={handleSell}
          >
            <ArrowDownUp className="inline h-4 w-4 mr-1 -mt-0.5" />
            {!account
              ? 'Connect Wallet'
              : amount <= 0
              ? 'Enter Amount'
              : `Sell ${amount.toLocaleString()} BIOMASS`}
          </button>
        </div>

        {/* Info Panel */}
        <div className="bank-info-panel">
          <div className="bank-info-card">
            <div className="bank-info-card-header">
              <CircleDollarSign className="bank-info-card-icon" size={18} />
              <span className="bank-info-card-title">Your $BUD Balance</span>
            </div>
            <div className="bank-info-stat">{budBalanceNum.toLocaleString()}</div>
            <p className="bank-info-desc">Available for selling or curing</p>
          </div>

          <div className="bank-info-card">
            <div className="bank-info-card-header">
              <Flame className="bank-info-card-icon" size={18} />
              <span className="bank-info-card-title">Burn Mechanism</span>
            </div>
            <div className="bank-info-stat">{TESTNET_CONFIG.economics.centralBankBurnPercent}%</div>
            <p className="bank-info-desc">
              {TESTNET_CONFIG.economics.centralBankBurnPercent}% of every sale is permanently burned, reducing total supply
            </p>
          </div>

          <div className="bank-info-card">
            <div className="bank-info-card-header">
              <TrendingUp className="bank-info-card-icon" size={18} />
              <span className="bank-info-card-title">Treasury Fund</span>
            </div>
            <div className="bank-info-stat">{TESTNET_CONFIG.economics.centralBankTreasuryPercent}%</div>
            <p className="bank-info-desc">
              {TESTNET_CONFIG.economics.centralBankTreasuryPercent}% goes to the community treasury for ecosystem growth
            </p>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      <AnimatePresence>
        {bankState === 'confirm' && (
          <motion.div
            className="bank-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
          >
            <motion.div
              className="bank-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="bank-modal-title">Confirm Sale</h3>

              <div className="bank-fee-breakdown" style={{ margin: 0 }}>
                <div className="bank-fee-row">
                  <span className="bank-fee-label">Selling</span>
                  <span className="bank-fee-value">{fees.grossAmount.toLocaleString()} BIOMASS</span>
                </div>
                <div className="bank-fee-row">
                  <span className="bank-fee-label">Total Fee ({TESTNET_CONFIG.economics.centralBankFeePercent}%)</span>
                  <span className="bank-fee-value" style={{ color: '#ef4444' }}>
                    -{fees.totalFee.toLocaleString()}
                  </span>
                </div>
                <div className="bank-fee-divider" />
                <div className="bank-fee-net">
                  <span className="bank-fee-label">You Receive</span>
                  <span className="bank-fee-value">{fees.netAmount.toLocaleString()} $BUD</span>
                </div>
              </div>

              <div className="bank-modal-actions">
                <button className="bank-modal-cancel" onClick={handleCancel}>
                  Cancel
                </button>
                <button className="bank-modal-confirm" onClick={handleConfirm}>
                  Confirm Sale
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Toast/Overlay */}
      <AnimatePresence>
        {bankState === 'success' && lastTransaction && (
          <motion.div
            className="bank-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setBankState('idle')}
          >
            <motion.div
              className="bank-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="bank-success">
                <div className="bank-success-icon">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>
                <div className="bank-success-title">Sale Complete</div>
                <div className="bank-success-amount">
                  +{lastTransaction.net.toLocaleString()} $BUD
                </div>
                <p className="bank-success-desc">
                  Successfully sold {lastTransaction.gross.toLocaleString()} BIOMASS
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
