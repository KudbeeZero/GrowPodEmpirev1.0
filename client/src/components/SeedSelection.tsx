import { useState, useMemo } from 'react';
import { SEED_LIBRARY, RARITY_COLORS, STRAIN_TYPE_COLORS, type Strain, type StrainType } from '@/data/seedLibrary';
import { TESTNET_CONFIG } from '@/data/testnetConfig';
import { useAlgorand } from '@/hooks/use-algorand';
import { Sprout, Leaf, Dna } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './SeedSelection.css';

type FilterType = 'All' | StrainType;

interface SeedSelectionProps {
  onPlant?: (strain: Strain, podSlot: number) => void;
  availablePodSlot?: number | null;
}

export default function SeedSelection({ onPlant, availablePodSlot }: SeedSelectionProps) {
  const { account } = useAlgorand();
  const [filter, setFilter] = useState<FilterType>('All');
  const [selectedSeed, setSelectedSeed] = useState<Strain | null>(null);

  const filters: FilterType[] = ['All', 'Sativa', 'Indica', 'Hybrid'];

  const filteredSeeds = useMemo(() => {
    if (filter === 'All') return SEED_LIBRARY;
    return SEED_LIBRARY.filter(s => s.type === filter);
  }, [filter]);

  const handlePlant = () => {
    if (selectedSeed && onPlant && availablePodSlot != null) {
      onPlant(selectedSeed, availablePodSlot);
    }
  };

  const dominantTerpenes = (strain: Strain) => {
    const entries = Object.entries(strain.terpeneProfile) as [string, number][];
    return entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);
  };

  return (
    <div className="seed-selection container mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-emerald-500/20 p-3 rounded-lg">
          <Dna className="h-8 w-8 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">Seed Selection</h1>
          <p className="text-muted-foreground">
            Choose your genetics — all strains free on TestNet
          </p>
        </div>
      </div>

      {/* TestNet Badge */}
      <div className="mb-6 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2 w-fit">
        <Leaf className="h-4 w-4 text-emerald-400" />
        <span className="text-sm text-emerald-400 font-semibold">
          TestNet Mode — {TESTNET_CONFIG.growthCycleMinutes}min growth cycles • All seeds FREE
        </span>
      </div>

      {/* Filters */}
      <div className="seed-filters">
        {filters.map(f => (
          <button
            key={f}
            className={`seed-filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Seed Grid */}
      <div className="seed-grid">
        {filteredSeeds.map((strain, i) => (
          <motion.div
            key={strain.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`seed-card ${selectedSeed?.id === strain.id ? 'selected' : ''} ${strain.rarity === 'Legendary' ? 'rarity-legendary' : ''}`}
            style={{ '--seed-color': strain.color } as React.CSSProperties}
            onClick={() => setSelectedSeed(selectedSeed?.id === strain.id ? null : strain)}
          >
            <div className="seed-card-header">
              <h3 className="seed-name">{strain.name}</h3>
              <span className={`seed-rarity-badge seed-rarity-${strain.rarity.toLowerCase()}`}>
                {strain.rarity}
              </span>
            </div>

            <span
              className="seed-type-badge"
              style={{
                color: STRAIN_TYPE_COLORS[strain.type],
                background: `${STRAIN_TYPE_COLORS[strain.type]}15`,
                border: `1px solid ${STRAIN_TYPE_COLORS[strain.type]}30`,
              }}
            >
              {strain.type}
            </span>

            {/* Stats Bars */}
            <div className="seed-stats-bars">
              <div className="seed-stat-row">
                <span className="seed-stat-label">Speed</span>
                <div className="seed-stat-bar">
                  <div
                    className="seed-stat-fill"
                    style={{
                      width: `${strain.growthTraits.speed * 10}%`,
                      background: `linear-gradient(90deg, #22c55e, #00ff94)`,
                    }}
                  />
                </div>
                <span className="seed-stat-value">{strain.growthTraits.speed}</span>
              </div>
              <div className="seed-stat-row">
                <span className="seed-stat-label">Resistance</span>
                <div className="seed-stat-bar">
                  <div
                    className="seed-stat-fill"
                    style={{
                      width: `${strain.growthTraits.resistance * 10}%`,
                      background: `linear-gradient(90deg, #3b82f6, #60a5fa)`,
                    }}
                  />
                </div>
                <span className="seed-stat-value">{strain.growthTraits.resistance}</span>
              </div>
              <div className="seed-stat-row">
                <span className="seed-stat-label">Yield</span>
                <div className="seed-stat-bar">
                  <div
                    className="seed-stat-fill"
                    style={{
                      width: `${(strain.growthTraits.yieldMultiplier / 3) * 100}%`,
                      background: `linear-gradient(90deg, #f59e0b, #fbbf24)`,
                    }}
                  />
                </div>
                <span className="seed-stat-value">{strain.growthTraits.yieldMultiplier}x</span>
              </div>
            </div>

            {/* Terpene Tags */}
            <div className="seed-terpenes">
              {dominantTerpenes(strain).map(t => (
                <span key={t} className="seed-terpene-tag">{t}</span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedSeed && (
          <motion.div
            className="seed-detail-panel"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="seed-detail-content">
              <div className="seed-detail-info">
                <h3>{selectedSeed.name}</h3>
                <p>{selectedSeed.description}</p>
              </div>

              <div className="seed-detail-stats">
                <div className="seed-detail-stat">
                  <div className="seed-detail-stat-value">{selectedSeed.thc}%</div>
                  <div className="seed-detail-stat-label">THC</div>
                </div>
                <div className="seed-detail-stat">
                  <div className="seed-detail-stat-value">{selectedSeed.cbd}%</div>
                  <div className="seed-detail-stat-label">CBD</div>
                </div>
                <div className="seed-detail-stat">
                  <div className="seed-detail-stat-value">{selectedSeed.growthTraits.yieldMultiplier}x</div>
                  <div className="seed-detail-stat-label">Yield</div>
                </div>
              </div>

              <div className="seed-terpenes" style={{ justifyContent: 'center' }}>
                {Object.entries(selectedSeed.terpeneProfile)
                  .filter(([, v]) => v >= 0.5)
                  .sort(([, a], [, b]) => b - a)
                  .map(([name, value]) => (
                    <span key={name} className="seed-terpene-tag">
                      {name} {Math.round(value * 100)}%
                    </span>
                  ))}
              </div>

              <button
                className="seed-plant-btn"
                onClick={handlePlant}
                disabled={!account || availablePodSlot == null}
              >
                <Sprout className="inline h-4 w-4 mr-1 -mt-0.5" />
                {!account ? 'Connect Wallet' : availablePodSlot == null ? 'No Empty Pod' : 'Plant Seed'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
