import { useState, useEffect, useCallback } from 'react';
import { useAlgorand, useGameState } from '@/hooks/use-algorand';
import { TESTNET_CONFIG, formatTimeRemaining } from '@/data/testnetConfig';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import {
  Sprout,
  Flower2,
  Leaf,
  TreePine,
  AlertTriangle,
  Droplets,
  Scissors,
  Plus,
  Timer,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './PodDisplay.css';

interface PodSlotData {
  id: number;
  stage: number;       // 0=empty, 1-4=growing, 5=harvest_ready, 6=cleanup
  waterCount: number;
  strainName?: string;
  strainType?: string;
  isDiseased: boolean;
  plantedAt?: number;
  lastWatered?: number;
}

function getStageIcon(stage: number) {
  switch (stage) {
    case 1: return <Sprout className="pod-plant-icon pod-stage-seedling" />;
    case 2: return <Leaf className="pod-plant-icon pod-stage-vegetative" />;
    case 3: return <Flower2 className="pod-plant-icon pod-stage-flowering" />;
    case 4: return <TreePine className="pod-plant-icon pod-stage-mature" />;
    case 5: return <Flower2 className="pod-plant-icon pod-stage-harvest" />;
    default: return <Sprout className="pod-plant-icon" style={{ color: '#374151' }} />;
  }
}

function getStageName(stage: number): string {
  const stageConfig = TESTNET_CONFIG.stages[stage as keyof typeof TESTNET_CONFIG.stages];
  return stageConfig?.name ?? 'Unknown';
}

export default function PodDisplay() {
  const { account } = useAlgorand();
  const { pods, budBalance } = useGameState(account);
  const { toast } = useToast();

  // Build pod slot data from game state, fill empty slots up to maxPods
  const podSlots: PodSlotData[] = [];
  for (let i = 0; i < TESTNET_CONFIG.maxPods; i++) {
    const pod = pods[i];
    if (pod) {
      podSlots.push({
        id: pod.id,
        stage: pod.stage,
        waterCount: pod.waterCount,
        strainName: pod.dna ? `Pod ${pod.id}` : undefined,
        strainType: undefined,
        isDiseased: pod.pests,
        plantedAt: undefined,
        lastWatered: pod.lastWatered,
      });
    } else {
      podSlots.push({
        id: i + 1,
        stage: 0,
        waterCount: 0,
        isDiseased: false,
      });
    }
  }

  return (
    <div className="pod-display container mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-emerald-500/20 p-3 rounded-lg">
          <Sprout className="h-8 w-8 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">Grow Pods</h1>
          <p className="text-muted-foreground">
            {TESTNET_CONFIG.maxPods} slots available — {TESTNET_CONFIG.growthCycleMinutes} min growth cycles
          </p>
        </div>
      </div>

      {/* Pod Grid */}
      <div className="pod-grid">
        {podSlots.map((slot, idx) => (
          <PodSlotCard key={slot.id} slot={slot} index={idx} budBalance={budBalance} />
        ))}
      </div>
    </div>
  );
}

interface PodSlotCardProps {
  slot: PodSlotData;
  index: number;
  budBalance: string;
}

function PodSlotCard({ slot, index, budBalance }: PodSlotCardProps) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const isEmpty = slot.stage === 0;
  const isGrowing = slot.stage >= 1 && slot.stage <= 4;
  const isHarvestable = slot.stage === 5;
  const needsCleanup = slot.stage === 6;

  // Countdown timer for growing pods
  useEffect(() => {
    if (!isGrowing || !slot.lastWatered) return;

    const update = () => {
      const elapsed = Math.floor((Date.now() - slot.lastWatered!) / 1000);
      const remaining = Math.max(0, TESTNET_CONFIG.growthCycleSeconds - elapsed);
      setTimeRemaining(remaining);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [isGrowing, slot.lastWatered]);

  const slotClass = [
    'pod-slot',
    isEmpty && 'empty',
    isGrowing && 'growing',
    isHarvestable && 'harvestable',
    slot.isDiseased && 'diseased',
  ].filter(Boolean).join(' ');

  const statusClass = isEmpty
    ? 'pod-status-empty'
    : isHarvestable
    ? 'pod-status-harvestable'
    : slot.isDiseased
    ? 'pod-status-diseased'
    : 'pod-status-growing';

  const growthPercent = isEmpty ? 0 : Math.min((slot.stage / 5) * 100, 100);

  return (
    <motion.div
      className={slotClass}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <div className="pod-header">
        <span className="pod-slot-label">Pod {index + 1}</span>
        <span className={`pod-status-badge ${statusClass}`}>
          {slot.isDiseased ? 'Diseased' : getStageName(slot.stage)}
        </span>
      </div>

      {isEmpty ? (
        <div className="pod-empty-content">
          <Plus className="pod-empty-icon" size={48} strokeWidth={1} />
          <p className="pod-empty-text">Empty slot — plant a seed</p>
          <Link href="/seeds">
            <button className="pod-action-btn pod-action-plant">
              <Sprout size={14} /> Select Seed
            </button>
          </Link>
        </div>
      ) : (
        <>
          {/* Plant Visual */}
          <div className="pod-visual">
            <AnimatePresence mode="wait">
              <motion.div
                key={slot.stage}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                {getStageIcon(slot.stage)}
              </motion.div>
            </AnimatePresence>

            {slot.isDiseased && (
              <div className="pod-disease-overlay">
                <AlertTriangle className="pod-disease-icon" size={40} />
              </div>
            )}
          </div>

          {/* Timer for growing pods */}
          {isGrowing && (
            <div className="pod-timer">
              <div className="pod-timer-label">
                <Timer className="inline h-3 w-3 mr-1" />
                Next Stage
              </div>
              <div className={`pod-timer-value ${timeRemaining < 60 ? 'urgent' : ''}`}>
                {formatTimeRemaining(timeRemaining)}
              </div>
            </div>
          )}

          {/* Growth Progress */}
          <div className="pod-progress">
            <div className="pod-progress-bar">
              <div
                className={`pod-progress-fill ${isHarvestable ? 'harvest-ready' : ''}`}
                style={{ width: `${growthPercent}%` }}
              />
            </div>
            <div className="pod-progress-labels">
              <span>Stage {slot.stage}/5</span>
              <span>{Math.round(growthPercent)}%</span>
            </div>
          </div>

          {/* Water Count */}
          <div className="pod-water-row">
            <Droplets className="h-4 w-4 text-blue-400 shrink-0" />
            <div className="pod-water-dots">
              {Array.from({ length: TESTNET_CONFIG.totalWatersNeeded }).map((_, i) => (
                <div
                  key={i}
                  className={`pod-water-dot ${i < slot.waterCount ? 'filled' : ''}`}
                />
              ))}
            </div>
            <span className="pod-water-label">{slot.waterCount}/{TESTNET_CONFIG.totalWatersNeeded}</span>
          </div>

          {/* Actions */}
          <div className="pod-actions">
            {isHarvestable && (
              <button className="pod-action-btn pod-action-harvest">
                <Scissors size={14} /> Harvest
              </button>
            )}
            {slot.isDiseased && (
              <button
                className="pod-action-btn pod-action-clean"
                disabled={Number(budBalance) < TESTNET_CONFIG.economics.cleanupCost * 1_000_000}
              >
                <AlertTriangle size={14} /> Clean ({TESTNET_CONFIG.economics.cleanupCost} $BUD)
              </button>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
