# GrowPod Empire - Design Guidelines

## Design Approach

**Reference-Based:** Cyberpunk gaming interfaces + blockchain dashboards. Drawing from Cyberpunk 2077's UI systems, Deus Ex's information density, and modern crypto platforms like Uniswap's clean data presentation, adapted for a cannabis cultivation theme.

**Core Principles:**
- Tech-noir atmosphere with high-contrast information architecture
- Neon accents as functional highlights, not decoration
- Industrial grid systems with angular containers
- Glowing progress indicators and status feedback

## Typography

**Font Stack:**
- Primary: Orbitron (Google Fonts) - headers, token amounts, pod IDs
- Secondary: Inter (Google Fonts) - body text, labels, descriptions
- Monospace: JetBrains Mono - wallet addresses, technical data

**Hierarchy:**
- H1: text-4xl font-bold tracking-tight (Dashboard titles)
- H2: text-2xl font-semibold (Section headers, Pod names)
- H3: text-lg font-medium (Card titles, Stats labels)
- Body: text-base font-normal (Descriptions, helper text)
- Small: text-sm (Metadata, timestamps)
- Micro: text-xs uppercase tracking-wider (Labels, categories)

## Layout System

**Spacing Primitives:** Tailwind units 4, 6, 8, 12 (p-4, gap-6, mb-8, py-12)

**Grid Structure:**
- Container: max-w-7xl mx-auto px-6
- Dashboard: 3-column grid on desktop (lg:grid-cols-3), 2-column tablet (md:grid-cols-2), single mobile
- Pod cards: 2-4 per row based on viewport
- Sidebar/Stats: Fixed 280px width on desktop, full-width mobile

## Component Library

### Navigation Header
Sticky top bar with backdrop blur, split layout:
- Left: Logo + "GrowPod Empire" wordmark
- Right: Token balances ($BUD/$TERP with icons) + Wallet connect button
- Height: h-16, shadow-lg with neon underline accent

### Hero Section
**Has Large Hero Image: YES**
Full-width banner (h-80 desktop, h-64 mobile) featuring a wide-angle render of futuristic hydroponic grow pods in a neon-lit underground facility. Cyberpunk atmosphere with emerald lighting, industrial pipes, and holographic displays.

Overlay content (centered):
- Main headline with glowing text effect
- Subheading describing the game economy
- Primary CTA button with blurred background backdrop-blur-md

### Token Dashboard Cards
Horizontal stat cards displaying wallet balances:
- Large token amount (text-3xl)
- Token symbol ($BUD/$TERP) with small icon
- USD equivalent below
- Subtle glow effect on borders
- Background: semi-transparent with border-emerald-500/30

### Pod Management Cards
Grid of grow pod cards (each pod is a card):

**Card Structure:**
- Header: Pod ID/Name + Status indicator (Growing/Ready/Dormant)
- Center: Pod illustration/image showing plant growth stage
- Progress bar: Animated with emerald fill, showing growth percentage
- Stats row: Yield estimate, Growth time remaining, Strain quality
- Action buttons row: "Water" (primary emerald), "Harvest" (success), "Breed" (secondary)
- Footer: Timestamp, generation count

**Visual Treatment:**
- Border with neon glow (border-2)
- Dark semi-transparent background
- Hover state: Elevated shadow + brighter border glow

### Action Buttons
**Primary (Emerald):** Glowing button with subtle pulse animation on ready states
**Secondary:** Outlined style with emerald accent
**Disabled:** Reduced opacity with grayscale treatment
**All buttons on images:** backdrop-blur-sm bg-black/40 for readability

### Progress Indicators
- Linear bars with emerald gradient fill
- Circular indicators for pod breeding cycles
- Pulsing glow when near completion
- Percentage overlays in Orbitron font

### Modals/Overlays
- Breeding interface: Side-by-side pod selection with combination preview
- Transaction confirmation: Token amounts, gas fees, estimated completion
- Dark backdrop-blur-xl with centered content
- Angular border treatments

### Footer
Compact footer with:
- Smart contract address (truncated, click to copy)
- Algorand network status indicator
- Links: Documentation, Discord, Twitter
- "Powered by Algorand" badge

## Images

**Hero Image:** 
Wide cyberpunk grow facility - underground warehouse with rows of illuminated hydroponic pods, neon emerald lighting, industrial aesthetic with pipes and tech panels, atmospheric fog/mist, dramatic perspective. Dimensions: 1920x640px minimum.

**Pod Card Images:**
Individual pod renders showing different growth stages:
- Stage 1: Seedling (small sprout)
- Stage 2: Vegetative (leafy growth)
- Stage 3: Flowering (visible buds)
- Stage 4: Harvest ready (fully mature)
Each pod should have futuristic containment design with glowing panels and tech details. Consistent isometric or 3/4 view angle.

**Background Patterns:**
Subtle circuit board or hexagonal grid patterns as page backgrounds, very low opacity (5-10%), adding tech texture without distraction.

## Animations

**Minimal, Functional Only:**
- Progress bars: Smooth fill transitions (duration-300)
- Pod ready state: Subtle pulsing glow (animate-pulse at 50% intensity)
- Button interactions: Scale transform on click (scale-95)
- Loading states: Spinner for blockchain transactions
NO scroll animations, parallax, or decorative effects.

## Accessibility

- High contrast text (white/emerald on dark backgrounds)
- Minimum touch targets: 44x44px
- Focus states with visible emerald outline rings
- Aria labels for all interactive elements
- Wallet connection status clearly indicated
- Transaction feedback with both visual and text confirmation