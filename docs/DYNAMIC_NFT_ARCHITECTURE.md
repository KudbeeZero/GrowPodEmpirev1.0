# Dynamic NFT / Biomass Architecture

## Overview

This document outlines the architecture for GrowPod Empire's dynamic NFT system, where harvested plants become tradeable **Biomass NFTs** that can be combined to create rare strains with evolving properties.

## Core Concepts

### Biomass NFT
A fungible or semi-fungible token representing harvested plant material with:
- **DNA Hash**: Derived from plant genetics (determines visual traits)
- **Terpene Profile**: Array of terpenes discovered during growth
- **Quality Score**: Based on care quality (water count, nutrients)
- **$BUD Value**: Intrinsic value in $BUD tokens
- **Generation**: Track breeding lineage (G1, G2, G3...)

### Dynamic Properties
NFTs evolve based on:
1. **Breeding** - Combining two Biomass NFTs creates offspring with mixed traits
2. **Curing/Aging** - Time-based stat improvements (optional)
3. **Rarity Discovery** - Rare terpene combinations unlock special properties

---

## Technical Implementation

### Recommended Standard: ARC-69 + ARC-19 Hybrid

**ARC-69** (On-Chain Metadata)
- Store all game attributes directly in transaction note field
- Enables frequent updates without external dependencies
- Perfect for mutable properties like breeding count, owner history

**ARC-19** (Mutable Media)
- Template-based IPFS URLs for plant visualization
- Update reserve address to point to new artwork as NFT evolves
- Supports dynamic image generation based on DNA

### NFT Metadata Schema (ARC-69)

```json
{
  "standard": "arc69",
  "description": "GrowPod Biomass NFT - Harvested plant material",
  "external_url": "https://growpod.empire/biomass/{asset_id}",
  "media_url": "ipfs://{cid}#i",
  "media_url_mimetype": "image/png",
  "properties": {
    "dna": "a3f4b21c9e8d7f6a5b4c3d2e1f0a9b8c7d6e5f4a",
    "terpene_profile": ["Limonene", "Myrcene", "Caryophyllene"],
    "quality_score": 85,
    "bud_value": "375000000",
    "generation": 1,
    "parent_a": null,
    "parent_b": null,
    "strain_name": "Mystery Kush",
    "rarity": "uncommon",
    "thc_range": "18-22%",
    "cbd_range": "0.5-1%",
    "growth_bonus": 5,
    "harvest_timestamp": 1738512000,
    "breeder_wallet": "6P55NJ7...",
    "breeding_count": 0,
    "effects": ["Relaxed", "Happy", "Creative"],
    "flavor_notes": ["Citrus", "Pine", "Earthy"]
  }
}
```

---

## Database Schema (D1)

### biomass_nfts Table
```sql
CREATE TABLE IF NOT EXISTS biomass_nfts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER UNIQUE NOT NULL,           -- Algorand ASA ID
  wallet_address TEXT NOT NULL,               -- Current owner
  dna TEXT NOT NULL,                          -- DNA hash
  terpene_profile TEXT DEFAULT '[]',          -- JSON array of terpenes
  quality_score INTEGER DEFAULT 50 NOT NULL,  -- 0-100
  bud_value TEXT DEFAULT '0' NOT NULL,        -- Intrinsic $BUD value (6 decimals)
  generation INTEGER DEFAULT 1 NOT NULL,      -- Breeding generation
  parent_a_id INTEGER,                        -- Parent Biomass NFT 1
  parent_b_id INTEGER,                        -- Parent Biomass NFT 2
  strain_name TEXT,                           -- Auto-generated or custom
  rarity TEXT DEFAULT 'common' NOT NULL,      -- common, uncommon, rare, legendary, mythic
  thc_range TEXT DEFAULT '15-20%',
  cbd_range TEXT DEFAULT '0-1%',
  growth_bonus INTEGER DEFAULT 0,             -- Percentage bonus if used as seed
  effects TEXT DEFAULT '[]',                  -- JSON array
  flavor_notes TEXT DEFAULT '[]',             -- JSON array
  breeding_count INTEGER DEFAULT 0 NOT NULL,  -- Times used in breeding
  is_burned INTEGER DEFAULT 0 NOT NULL,       -- 1 if redeemed for $BUD
  harvest_timestamp TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (parent_a_id) REFERENCES biomass_nfts(id),
  FOREIGN KEY (parent_b_id) REFERENCES biomass_nfts(id)
);

CREATE INDEX IF NOT EXISTS idx_biomass_wallet ON biomass_nfts(wallet_address);
CREATE INDEX IF NOT EXISTS idx_biomass_rarity ON biomass_nfts(rarity);
CREATE INDEX IF NOT EXISTS idx_biomass_generation ON biomass_nfts(generation);
```

### strain_registry Table
```sql
CREATE TABLE IF NOT EXISTS strain_registry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,                  -- Strain name
  dna_signature TEXT UNIQUE NOT NULL,         -- Unique DNA pattern
  creator_wallet TEXT NOT NULL,               -- First breeder
  terpene_profile TEXT DEFAULT '[]',
  rarity TEXT DEFAULT 'rare' NOT NULL,
  total_minted INTEGER DEFAULT 1 NOT NULL,
  base_growth_bonus INTEGER DEFAULT 10,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_strain_creator ON strain_registry(creator_wallet);
```

---

## Smart Contract Extensions

### New Methods Required

```python
# ========== BIOMASS NFT METHODS ==========

# Global State (add to existing)
GlobalBiomassAssetBase = Bytes("biomass_base")  # Base ASA ID for biomass NFTs
GlobalBiomassCount = Bytes("biomass_count")     # Total biomass NFTs minted

# Mint Biomass NFT on Harvest
# Called after successful harvest, creates ARC-69 compliant ASA
mint_biomass = Seq(
    # Verify harvest just completed (stage = 6)
    Assert(App.localGet(Txn.sender(), LocalStage) == Int(6)),
    Assert(App.globalGet(GlobalBudAsset) != Int(0)),

    # Calculate quality score (water_count + nutrient_count bonuses)
    # ... quality calculation ...

    # Create Biomass ASA (Pure NFT: 1 unit, 0 decimals)
    InnerTxnBuilder.Begin(),
    InnerTxnBuilder.SetFields({
        TxnField.type_enum: TxnType.AssetConfig,
        TxnField.config_asset_total: Int(1),
        TxnField.config_asset_decimals: Int(0),
        TxnField.config_asset_unit_name: Bytes("BMSN"),
        TxnField.config_asset_name: Concat(Bytes("Biomass #"), ...),
        TxnField.config_asset_url: Bytes("template-ipfs://..."),
        TxnField.config_asset_manager: Global.current_application_address(),
        TxnField.config_asset_reserve: ...,  # For ARC-19 media pointer
        TxnField.note: ...,  # ARC-69 JSON metadata
    }),
    InnerTxnBuilder.Submit(),

    # Transfer NFT to user
    InnerTxnBuilder.Begin(),
    InnerTxnBuilder.SetFields({
        TxnField.type_enum: TxnType.AssetTransfer,
        TxnField.xfer_asset: InnerTxn.created_asset_id(),
        TxnField.asset_amount: Int(1),
        TxnField.asset_receiver: Txn.sender(),
    }),
    InnerTxnBuilder.Submit(),

    # Increment counter
    App.globalPut(GlobalBiomassCount, App.globalGet(GlobalBiomassCount) + Int(1)),
    Approve()
)

# Combine Two Biomass NFTs
# Requires burning both parent NFTs, creates child with merged traits
combine_biomass = Seq(
    # Verify user owns both biomass NFTs (passed as foreign assets)
    Assert(Txn.assets[0] != Txn.assets[1]),  # Different NFTs

    # Verify user transfers both NFTs to contract (burn)
    Assert(Gtxn[Txn.group_index() - Int(2)].type_enum() == TxnType.AssetTransfer),
    Assert(Gtxn[Txn.group_index() - Int(2)].xfer_asset() == Txn.assets[0]),
    Assert(Gtxn[Txn.group_index() - Int(2)].asset_receiver() == Global.current_application_address()),

    Assert(Gtxn[Txn.group_index() - Int(1)].type_enum() == TxnType.AssetTransfer),
    Assert(Gtxn[Txn.group_index() - Int(1)].xfer_asset() == Txn.assets[1]),
    Assert(Gtxn[Txn.group_index() - Int(1)].asset_receiver() == Global.current_application_address()),

    # Create new Biomass NFT with combined traits
    # DNA = hash(parent1_dna + parent2_dna + timestamp)
    # Terpenes = union of parent terpenes with mutation chance
    # ... mint logic similar to mint_biomass ...

    Approve()
)

# Redeem Biomass for $BUD
# Burns the NFT and returns its intrinsic $BUD value
redeem_biomass = Seq(
    # Verify user sends biomass NFT to contract
    Assert(Gtxn[Txn.group_index() - Int(1)].type_enum() == TxnType.AssetTransfer),
    Assert(Gtxn[Txn.group_index() - Int(1)].asset_amount() == Int(1)),
    Assert(Gtxn[Txn.group_index() - Int(1)].asset_receiver() == Global.current_application_address()),

    # Get $BUD value from args (verified by backend)
    # Transfer $BUD to user
    InnerTxnBuilder.Begin(),
    InnerTxnBuilder.SetFields({
        TxnField.type_enum: TxnType.AssetTransfer,
        TxnField.xfer_asset: App.globalGet(GlobalBudAsset),
        TxnField.asset_amount: Btoi(Txn.application_args[1]),  # bud_value
        TxnField.asset_receiver: Txn.sender(),
    }),
    InnerTxnBuilder.Submit(),

    Approve()
)
```

---

## Dynamic Image Generation

### Approach 1: Pre-rendered Layers (Recommended for MVP)

Generate plant images by compositing layers based on DNA:

```
DNA Hash: a3f4b21c9e8d7f6a5b4c3d2e1f0a9b8c7d6e5f4a
          │ │ │ │ │ └─ Layer 6: Glow effect (byte 5)
          │ │ │ │ └─── Layer 5: Trichome density (byte 4)
          │ │ │ └───── Layer 4: Bud structure (byte 3)
          │ │ └─────── Layer 3: Leaf shape (byte 2)
          │ └───────── Layer 2: Color palette (byte 1)
          └─────────── Layer 1: Base plant type (byte 0)
```

**Pre-generate**: ~1000 base combinations stored in R2
**On mint**: Select appropriate layers based on DNA hash
**Media URL**: Points to composite image

### Approach 2: On-Demand Generation (Advanced)

Use Cloudflare Workers + Canvas/Sharp:

```typescript
// worker endpoint: /api/biomass/{asset_id}/image
async function generateBiomassImage(dna: string, terpenes: string[]) {
  const layers = [];

  // Parse DNA to layer indices
  const baseType = parseInt(dna.slice(0, 2), 16) % 10;
  const colorPalette = parseInt(dna.slice(2, 4), 16) % 8;
  const leafShape = parseInt(dna.slice(4, 6), 16) % 6;
  // ... more layers

  // Composite layers
  const image = await compositeLayerImages(layers);

  // Add terpene-based glow effects
  const glowColor = getTerpeneGlowColor(terpenes);

  return addGlowEffect(image, glowColor);
}
```

### Approach 3: SVG Templates (Lightweight)

Store SVG templates with CSS variables:

```svg
<svg viewBox="0 0 400 400">
  <style>
    :root {
      --primary-color: {{primaryColor}};
      --secondary-color: {{secondaryColor}};
      --glow-color: {{glowColor}};
    }
  </style>
  <g class="plant-base" fill="var(--primary-color)">
    <!-- Plant paths based on DNA -->
  </g>
  <g class="trichomes" opacity="{{trichomeDensity}}">
    <!-- Sparkle effects -->
  </g>
</svg>
```

---

## Rarity System

### Quality Score Calculation

```typescript
function calculateQualityScore(
  waterCount: number,
  nutrientCount: number,
  terpeneCount: number
): number {
  let score = 50; // Base score

  // Perfect watering bonus (exactly 10)
  if (waterCount === 10) score += 20;
  else if (waterCount >= 8) score += 10;

  // Nutrient bonus (max 10)
  score += Math.min(nutrientCount, 10) * 2;

  // Rare terpene bonus
  score += Math.min(terpeneCount, 5) * 2;

  return Math.min(score, 100);
}
```

### Rarity Tiers

| Rarity    | Quality Score | Drop Rate | Growth Bonus |
|-----------|---------------|-----------|--------------|
| Common    | 0-50          | 50%       | 0%           |
| Uncommon  | 51-70         | 30%       | 5%           |
| Rare      | 71-85         | 15%       | 10%          |
| Legendary | 86-95         | 4%        | 20%          |
| Mythic    | 96-100        | 1%        | 35%          |

### Breeding Rarity Boost

When combining two Biomass NFTs:
- Both Common → 10% chance of Uncommon
- Both Uncommon → 15% chance of Rare
- Both Rare → 10% chance of Legendary
- Legendary + Legendary → 5% chance of Mythic
- Mixed rarities → Average with 5% upgrade chance

---

## API Endpoints

### Biomass NFT Endpoints

```typescript
// Get user's biomass collection
GET /api/biomass/:walletAddress
Response: BiomassNFT[]

// Get single biomass details
GET /api/biomass/asset/:assetId
Response: BiomassNFT

// Mint biomass on harvest (called by frontend after harvest tx)
POST /api/biomass/mint
Body: { walletAddress, harvestTxId, podId }
Response: { assetId, metadata }

// Combine two biomass NFTs
POST /api/biomass/combine
Body: { walletAddress, parentAAssetId, parentBAssetId, combineTxId }
Response: { childAssetId, metadata }

// Redeem biomass for $BUD
POST /api/biomass/redeem
Body: { walletAddress, assetId, redeemTxId }
Response: { budAmount }

// Get biomass image
GET /api/biomass/image/:assetId
Response: image/png

// List all discovered strains
GET /api/strains
Response: Strain[]

// Get strain details
GET /api/strains/:name
Response: Strain
```

---

## Frontend Components

### BiomassCard Component

```tsx
interface BiomassCardProps {
  biomass: BiomassNFT;
  onSelect?: (id: number) => void;
  selected?: boolean;
}

function BiomassCard({ biomass, onSelect, selected }: BiomassCardProps) {
  const glowColor = getRarityGlow(biomass.rarity);

  return (
    <div
      className={cn(
        "relative group cursor-pointer rounded-xl overflow-hidden",
        "border-2 transition-all duration-300",
        selected ? "border-purple-500 scale-105" : "border-white/10"
      )}
      style={{ boxShadow: `0 0 20px ${glowColor}40` }}
      onClick={() => onSelect?.(biomass.id)}
    >
      {/* Dynamic Plant Image */}
      <img
        src={`/api/biomass/image/${biomass.assetId}`}
        alt={biomass.strainName}
        className="w-full aspect-square object-cover"
      />

      {/* Rarity Badge */}
      <div className={cn(
        "absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold",
        rarityColors[biomass.rarity]
      )}>
        {biomass.rarity.toUpperCase()}
      </div>

      {/* Info Overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4">
        <h3 className="font-bold text-white">{biomass.strainName}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-green-400 text-sm">
            {formatBud(biomass.budValue)} $BUD
          </span>
          <span className="text-muted-foreground text-xs">
            Gen {biomass.generation}
          </span>
        </div>

        {/* Terpene Pills */}
        <div className="flex flex-wrap gap-1 mt-2">
          {biomass.terpeneProfile.slice(0, 3).map(terp => (
            <span
              key={terp}
              className="px-1.5 py-0.5 bg-white/10 rounded text-xs"
            >
              {terp}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### BiomassLab (Combiner) Page

```tsx
function BiomassLab() {
  const [parentA, setParentA] = useState<BiomassNFT | null>(null);
  const [parentB, setParentB] = useState<BiomassNFT | null>(null);
  const [preview, setPreview] = useState<BiomassPreview | null>(null);

  // Calculate predicted offspring traits
  useEffect(() => {
    if (parentA && parentB) {
      const predicted = predictOffspring(parentA, parentB);
      setPreview(predicted);
    }
  }, [parentA, parentB]);

  return (
    <div className="container mx-auto py-12">
      <h1>Biomass Combiner Lab</h1>

      {/* Selection Slots */}
      <div className="flex items-center justify-center gap-8">
        <BiomassSlot
          biomass={parentA}
          onClear={() => setParentA(null)}
          label="Parent A"
        />

        <CombineButton
          enabled={!!parentA && !!parentB}
          onCombine={handleCombine}
        />

        <BiomassSlot
          biomass={parentB}
          onClear={() => setParentB(null)}
          label="Parent B"
        />
      </div>

      {/* Offspring Preview */}
      {preview && (
        <OffspringPreview
          preview={preview}
          parentA={parentA!}
          parentB={parentB!}
        />
      )}

      {/* Inventory Grid */}
      <BiomassInventory
        onSelect={(b) => !parentA ? setParentA(b) : setParentB(b)}
        selected={[parentA?.id, parentB?.id]}
      />
    </div>
  );
}
```

---

## User Flow

### Harvest → Biomass NFT

```
1. User completes 10 waterings → Plant ready to harvest
2. User clicks "Harvest" → Sends harvest transaction
3. After harvest success:
   - Smart contract mints $BUD to user
   - Smart contract mints Biomass NFT (ARC-69)
   - Backend calculates quality score from growth data
   - Backend generates/selects image based on DNA
   - NFT transferred to user's wallet
4. User sees new Biomass in inventory
```

### Combine Biomass NFTs

```
1. User goes to Biomass Lab
2. Selects two Biomass NFTs from inventory
3. Preview shows predicted offspring traits:
   - Mixed DNA visualization
   - Combined terpene profile
   - Rarity upgrade chance
4. User confirms combination:
   - Burns 1,000 $BUD (breeding cost)
   - Transfers both parent NFTs to contract
   - Smart contract burns parents
   - Smart contract mints child Biomass NFT
   - Child has generation = max(parent_gen) + 1
5. Child NFT appears in inventory
```

### Redeem Biomass for $BUD

```
1. User selects Biomass NFT in inventory
2. Views intrinsic $BUD value
3. Clicks "Redeem/Burn"
4. Confirms transaction:
   - Transfers NFT to contract
   - Contract burns NFT
   - Contract transfers $BUD value to user
5. NFT removed from inventory
```

---

## Implementation Phases

### Phase 1: Core NFT System (MVP)
- [ ] Add biomass_nfts table to D1
- [ ] Implement mint_biomass smart contract method
- [ ] Create basic BiomassCard component
- [ ] Generate static images based on DNA (pre-rendered layers)
- [ ] Add biomass inventory to dashboard
- [ ] Display quality score and rarity

### Phase 2: Breeding System
- [ ] Implement combine_biomass smart contract method
- [ ] Create BiomassLab UI page
- [ ] Build offspring prediction algorithm
- [ ] Add strain_registry for unique combinations
- [ ] Implement strain naming system

### Phase 3: Dynamic Visuals
- [ ] Set up R2 bucket for image storage
- [ ] Create layer compositing system
- [ ] Implement ARC-19 for mutable media
- [ ] Add animation support (CSS/Lottie)
- [ ] Build image generation worker endpoint

### Phase 4: Marketplace Integration
- [ ] Add trading functionality
- [ ] Integrate with NFD/Pera Explorer
- [ ] List on Algogems/ALGOxNFT
- [ ] Add collection stats and floor prices

---

## Security Considerations

1. **NFT Ownership Verification**: Always verify sender owns the NFT before burns
2. **Value Tampering**: Store $BUD value in on-chain metadata, not just backend
3. **DNA Collision**: Use SHA-256 with timestamp+round to prevent prediction
4. **Breeding Spam**: Require $BUD burn to prevent infinite breeding
5. **Image Integrity**: Store IPFS hash in reserve address (ARC-19)

---

## Open Questions

1. **Should Biomass NFTs be tradeable immediately?**
   - Option A: Yes, instant marketplace listing
   - Option B: 24-hour "curing" period before tradeable

2. **Maximum breeding generations?**
   - Unlimited could lead to inflation
   - Cap at Gen 10 with diminishing returns?

3. **Burn parent NFTs or keep them?**
   - Burning creates scarcity
   - Keeping allows multiple offspring but limits rarity

4. **Terpene inheritance model?**
   - Union: Child gets all parent terpenes
   - Random selection: 50% chance each
   - Dominant/recessive genetics system?
