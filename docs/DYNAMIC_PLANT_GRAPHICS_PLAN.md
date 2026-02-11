# Dynamic 2D Plant Graphics System - Implementation Plan

## Overview

This document outlines the plan to replace static plant images with a dynamic, procedurally-generated 2D plant rendering system. Plants will grow realistically from seedling to harvest, with visual feedback for genetics, care quality, and conditions like pests/overwatering.

---

## Current State

The existing `PodCard.tsx` uses:
- **7 static PNG images** for growth stages (empty, seedling, young, vegetative, flowering, harvest-ready, cleanup)
- **1 MP4 video** for seedling animation
- **Framer Motion** for basic transitions between stages

### Current Stage Mapping:
| Stage | Status | Current Visual |
|-------|--------|----------------|
| 0 | Empty | Empty pod PNG |
| 1 | Seedling | MP4 video loop |
| 2 | Young | Static PNG |
| 3 | Vegetative | Static PNG |
| 4 | Flowering | Static PNG |
| 5 | Harvest Ready | Static PNG + glow |
| 6 | Needs Cleanup | Dead plant PNG |

---

## Proposed Architecture

### Technical Approach: **Layered Canvas + SVG Hybrid**

After analyzing the requirements, the recommended approach is a **layered rendering system** combining:

1. **HTML5 Canvas** - For dynamic plant geometry, growth animations, and particle effects
2. **SVG Overlays** - For crisp UI elements, status indicators, and terpene visualizations
3. **CSS Animations** - For simple effects like glows, pulses, and hover states

### Why This Approach?

| Approach | Pros | Cons |
|----------|------|------|
| **Canvas + SVG (Recommended)** | Best performance, full control over rendering, scales well | More code complexity |
| Pure SVG | Resolution independent, easy to style | Performance issues with many animated elements |
| WebGL (Three.js/PixiJS) | Best for complex effects | Overkill for 2D plants, larger bundle size |
| CSS-only | Simple to implement | Limited animation capabilities |
| Lottie/Spine | Great animations | External tools needed, less dynamic |

---

## Plant Component Architecture

```
PlantRenderer/
├── PlantCanvas.tsx        # Main canvas component
├── layers/
│   ├── PotLayer.tsx       # Hydroponic pod/container
│   ├── SoilLayer.tsx      # Growing medium (rockwool, clay pebbles)
│   ├── StemLayer.tsx      # Main stem with branching
│   ├── LeafLayer.tsx      # Fan leaves with procedural generation
│   ├── BudLayer.tsx       # Flower/bud development
│   └── EffectsLayer.tsx   # Particles, water drops, pests
├── systems/
│   ├── GrowthSystem.ts    # Growth progression logic
│   ├── GeneticsSystem.ts  # Seed DNA → visual traits
│   └── HealthSystem.ts    # Pest, overwater, nutrient deficiency
├── hooks/
│   ├── usePlantState.ts   # Plant state management
│   ├── useGrowthAnimation.ts
│   └── useParticles.ts
└── utils/
    ├── plantGeometry.ts   # Stem curves, leaf shapes
    ├── colorPalettes.ts   # Strain-based color schemes
    └── noiseUtils.ts      # Perlin noise for organic variation
```

---

## Growth Stage Visualization

### Stage 0: Empty Pod
- Clean hydroponic container
- Subtle ambient glow
- "Ready to plant" particle effect

### Stage 1: Germination → Seedling (0-2 waters)
```
Visual Elements:
- Seed cracks open (animated)
- Tiny stem emerges from growing medium
- 2 cotyledon leaves unfold
- Subtle stem wobble animation
```

### Stage 2: Early Vegetative (2-4 waters)
```
Visual Elements:
- Stem height increases 2x
- First pair of serrated leaves appear
- Leaf count: 4-6
- Slight branching visible
- Color: Bright green
```

### Stage 3: Mid Vegetative (4-6 waters)
```
Visual Elements:
- Stem thickens, branches develop
- Multiple leaf nodes (8-12 leaves)
- Internodal spacing based on genetics (indica vs sativa)
- Color variation based on strain
```

### Stage 4: Flowering (6-8 waters)
```
Visual Elements:
- Pre-flowers appear at nodes
- Pistil hairs (white threads) emerge
- Leaves show frost/trichome sparkle
- Buds begin forming
- Color shift: Some leaves yellow at base
```

### Stage 5: Harvest Ready (10 waters)
```
Visual Elements:
- Dense bud formation
- Heavy trichome coverage (sparkle effect)
- Pistils darken (orange/brown)
- Maximum plant size
- Pulsing golden glow
- "Ready!" particle burst
```

### Stage 6: Needs Cleanup (Post-harvest)
```
Visual Elements:
- Wilted/brown leaves
- Broken stems
- Debris particles
- Grayed-out palette
```

---

## Genetics → Visual Mapping

Seed NFT genetics directly influence plant appearance:

### Strain Type
```typescript
interface PlantVisualTraits {
  strainType: 'indica' | 'sativa' | 'hybrid';

  // Indica: Short, bushy, wide leaves
  // Sativa: Tall, lanky, narrow leaves
  // Hybrid: Blend based on dominance %
}
```

### Visual Trait Mapping:
| Genetic Trait | Visual Effect |
|--------------|---------------|
| `strain_type: indica` | Short, bushy plant, wide fat leaves |
| `strain_type: sativa` | Tall, stretchy plant, thin finger leaves |
| `thc_potential` | Trichome density/sparkle intensity |
| `terpene_dominant` | Subtle color tint (myrcene=green, limonene=yellow) |
| `rarity` | Glow intensity, particle effects |

### Color Palettes by Terpene:
```typescript
const TERPENE_COLORS = {
  myrcene: { primary: '#2E7D32', accent: '#81C784' },      // Earthy green
  limonene: { primary: '#F9A825', accent: '#FFF176' },     // Citrus yellow
  caryophyllene: { primary: '#6D4C41', accent: '#A1887F' }, // Spicy brown
  pinene: { primary: '#1B5E20', accent: '#4CAF50' },       // Forest green
  linalool: { primary: '#7B1FA2', accent: '#CE93D8' },     // Lavender purple
  humulene: { primary: '#795548', accent: '#BCAAA4' },     // Woody tan
};
```

---

## Condition Visual Effects

### Healthy Plant (Default)
- Vibrant colors
- Slight leaf sway animation
- Occasional sparkle on trichomes

### Needs Water (canWater = true)
```
Visual Effects:
- Leaves droop slightly (rotation adjustment)
- Slight yellow/pale color shift
- Wilting animation (subtle)
- Water droplet icon pulse
```

### Overwatered
```
Visual Effects:
- Dark spots on leaves
- Drooping (different from thirst - heavy droop)
- Yellowing from bottom up
- Water pool at base with bubbles
```

### Nutrient Deficiency
```
Visual Effects:
- Yellow/brown leaf edges
- Pale color overall
- Slower growth animation
- Empty flask icon
```

### Pest Infestation
```
Visual Effects:
- Tiny animated bugs crawling on leaves
- Bite marks/holes in leaves
- Webbing on branches (spider mites)
- Alert particles
```

### Thriving (10/10 care)
```
Visual Effects:
- Extra vibrant colors
- More trichome sparkle
- Slight size bonus
- Happy particles (stars)
```

---

## Animation System

### Core Animations

1. **Idle Sway** - Gentle leaf movement (wind effect)
   ```typescript
   // Perlin noise-based sway
   const sway = perlin2(time * 0.5, leafIndex) * 5; // degrees
   ```

2. **Growth Pulse** - When watered/fed
   ```typescript
   // Scale pulse on care action
   0ms: scale(1.0)
   100ms: scale(1.05)
   300ms: scale(1.0)
   ```

3. **Stage Transition** - Growth between stages
   ```typescript
   // Smooth interpolation over 2 seconds
   const progress = lerp(prevStage, nextStage, easeOutCubic(t));
   ```

4. **Particle Systems**
   - Water droplets (on water action)
   - Trichome sparkles (harvest ready)
   - Nutrient absorption (green particles rising)
   - Pest bugs (crawling entities)
   - Harvest celebration (confetti/stars)

### Animation Loop (60fps target)
```typescript
function animate(timestamp: number) {
  const deltaTime = timestamp - lastFrame;

  // Update systems
  updateSway(deltaTime);
  updateParticles(deltaTime);
  updateGrowth(deltaTime);

  // Render layers
  renderPot(ctx);
  renderStem(ctx, stemPoints);
  renderLeaves(ctx, leaves);
  renderBuds(ctx, buds);
  renderEffects(ctx, particles);

  requestAnimationFrame(animate);
}
```

---

## Procedural Geometry

### Stem Generation (Bezier Curves)
```typescript
interface StemNode {
  position: { x: number; y: number };
  thickness: number;
  angle: number;
  children: StemNode[];
}

function generateStem(height: number, branchCount: number): StemNode {
  // L-system inspired branching
  const mainStem = createBezierPath(
    { x: 0, y: 0 },
    { x: 0, y: -height },
    wobble: perlin(seed)
  );

  // Add branches at intervals
  for (let i = 0; i < branchCount; i++) {
    const t = (i + 1) / (branchCount + 1);
    const branchPoint = mainStem.getPointAt(t);
    const branch = createBranch(branchPoint, angle, length);
    mainStem.addChild(branch);
  }

  return mainStem;
}
```

### Leaf Generation
```typescript
interface LeafParams {
  strainType: 'indica' | 'sativa' | 'hybrid';
  health: number; // 0-1
  age: number;
}

function generateLeaf(params: LeafParams): Path2D {
  const fingerCount = params.strainType === 'indica' ? 5 : 9;
  const fingerWidth = params.strainType === 'indica' ? 0.4 : 0.15;

  // Create fan leaf with fingers
  const leaf = new Path2D();

  for (let i = 0; i < fingerCount; i++) {
    const angle = lerp(-70, 70, i / (fingerCount - 1));
    const length = i === Math.floor(fingerCount / 2)
      ? 1.0  // Center finger longest
      : 0.7 - Math.abs(i - fingerCount / 2) * 0.1;

    drawFinger(leaf, angle, length, fingerWidth);
  }

  return leaf;
}
```

---

## Performance Considerations

### Optimization Strategies

1. **Offscreen Canvas Caching**
   - Pre-render static elements (pot, base leaves)
   - Only redraw dynamic elements each frame

2. **Level of Detail (LOD)**
   - Full detail when pod is focused/hovered
   - Simplified rendering for background pods
   - Reduce particle count on mobile

3. **Visibility Culling**
   - Skip rendering for off-screen pods
   - Use IntersectionObserver

4. **Animation Throttling**
   ```typescript
   // Reduce to 30fps when tab not focused
   const targetFPS = document.hidden ? 30 : 60;
   ```

5. **Memory Management**
   - Object pooling for particles
   - Cleanup on component unmount
   - Limit total active particles (max 100 per plant)

### Target Performance
- **Desktop**: 60fps with 5 pods visible
- **Mobile**: 30fps with 2 pods visible
- **Memory**: < 50MB for plant rendering system

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Create PlantCanvas component with basic rendering
- [ ] Implement stem generation (Bezier curves)
- [ ] Basic leaf shapes (indica/sativa)
- [ ] Stage 0-2 visualization

### Phase 2: Growth System (Week 2)
- [ ] Complete all 6 stages
- [ ] Stage transition animations
- [ ] Genetics → visual trait mapping
- [ ] Bud/flower rendering

### Phase 3: Condition Effects (Week 3)
- [ ] Healthy/unhealthy states
- [ ] Water droplet particles
- [ ] Pest visualization
- [ ] Nutrient effects

### Phase 4: Polish (Week 4)
- [ ] Trichome sparkle system
- [ ] Harvest celebration effects
- [ ] Performance optimization
- [ ] Mobile responsiveness

### Phase 5: Integration
- [ ] Replace current PodCard images
- [ ] Connect to seed NFT genetics
- [ ] Testing across devices
- [ ] Documentation

---

## File Structure to Create

```
client/src/
├── components/
│   ├── plant/
│   │   ├── PlantCanvas.tsx        # Main canvas wrapper
│   │   ├── PlantRenderer.ts       # Core rendering logic
│   │   ├── layers/
│   │   │   ├── PodLayer.ts
│   │   │   ├── StemLayer.ts
│   │   │   ├── LeafLayer.ts
│   │   │   └── BudLayer.ts
│   │   ├── systems/
│   │   │   ├── GrowthSystem.ts
│   │   │   ├── ParticleSystem.ts
│   │   │   └── AnimationLoop.ts
│   │   ├── utils/
│   │   │   ├── bezier.ts
│   │   │   ├── noise.ts
│   │   │   └── colors.ts
│   │   └── types.ts
│   └── PodCard.tsx                # Updated to use PlantCanvas
```

---

## Dependencies to Add

```json
{
  "dependencies": {
    // No new dependencies needed for Canvas approach
  },
  "devDependencies": {
    "@types/offscreencanvas": "^2019.7.3"  // TypeScript support
  }
}
```

---

## Success Criteria

1. **Visual Quality**
   - Plants look organic and alive
   - Clear visual distinction between stages
   - Genetics visibly affect appearance

2. **Performance**
   - No frame drops on desktop
   - Smooth on mobile devices
   - Quick initial render (< 100ms)

3. **Maintainability**
   - Modular, testable code
   - Easy to add new visual effects
   - Clear separation of concerns

4. **User Experience**
   - Satisfying visual feedback for actions
   - Clear plant health indicators
   - Celebration moments feel rewarding

---

## Next Steps

1. **Create PlantCanvas.tsx** - Basic component with canvas setup
2. **Implement stem generation** - Bezier-based procedural stems
3. **Add leaf rendering** - Strain-specific leaf shapes
4. **Build growth interpolation** - Smooth stage transitions
5. **Add particle systems** - Water, sparkles, effects
6. **Integrate with PodCard** - Replace static images
