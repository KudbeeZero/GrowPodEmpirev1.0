# Cannabis History - Component Showcase

## Component Overview

This document provides a detailed breakdown of each component in the Cannabis History feature.

---

## 🏠 Main Page: `CannabisHistory.tsx`

**Purpose**: Central hub for all historical content and interactive features

**Structure**:
```
┌─────────────────────────────────────────────┐
│  🏮 History of Cannabis                     │
│  Explore the rich history, culture...      │
├─────────────────────────────────────────────┤
│  ✨ Interactive Features                    │
│  [Quiz] [Timeline] [Myths] [Map]           │
├─────────────────────────────────────────────┤
│  [Selected Interactive Feature Display]     │
├─────────────────────────────────────────────┤
│  📑 Main Content Tabs                       │
│  [Ancient] [Medical] [Cultural] [Legal]    │
│  [Industrial]                               │
├─────────────────────────────────────────────┤
│  [Tab Content Display Area]                │
└─────────────────────────────────────────────┘
```

**Features**:
- Header with gradient title and icon
- 4 interactive feature buttons in grid layout
- AnimatePresence for smooth feature transitions
- 5 content tabs with icon indicators
- Responsive grid layouts (1-5 columns based on screen size)

**State Management**:
- `activeSection`: Current content tab (Ancient, Medical, etc.)
- `activeFeature`: Currently selected interactive feature (Quiz, Timeline, etc.)

---

## 🧠 Interactive Feature 1: `TriviaQuiz.tsx`

**Purpose**: Test user knowledge with 12 multiple-choice questions

**Visual Flow**:
```
Question Display
├─ Badge: Difficulty + Category
├─ Question Text
├─ 4 Answer Options (buttons)
│  ├─ Selected: Primary border
│  ├─ Correct: Green border + checkmark
│  └─ Incorrect: Red border + X mark
├─ [Submit Answer] button
└─ Progress Bar (bottom)

After Submit:
├─ Result Card (green/red)
│  ├─ "Correct!" or "Incorrect"
│  └─ Detailed Explanation
└─ [Next Question] button

Quiz Complete:
├─ Trophy emoji + Score display
├─ Percentage + Personalized message
└─ [Try Again] button
```

**Quiz Data Structure**:
```typescript
interface QuizQuestion {
  question: string;
  options: string[];        // 4 choices
  correctAnswer: number;    // Index of correct option
  explanation: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
}
```

**Key Features**:
- Real-time visual feedback
- Score tracking (only counts first attempt)
- Progress bar animation
- Color-coded difficulty badges
- Prevents duplicate scoring
- Smooth transitions between questions

**Categories**:
1. Ancient History
2. Legal History
3. Science
4. Medical Use
5. Industrial History
6. Cultural Impact

---

## ⏳ Interactive Feature 2: `HistoricalTimeline.tsx`

**Purpose**: Navigate through 5,000+ years of cannabis history

**Visual Layout**:
```
Era Filter Buttons
[All] [Ancient] [Medieval] [Colonial] [Modern] [Prohibition] [Reform]

Main Event Card
┌─────────────────────────────────────┐
│ 🏮 2737 BCE        [Ancient]        │
│                                      │
│ Emperor Shen Nung's Discovery       │
│ 📍 China                            │
│                                      │
│ According to legend, Emperor Shen   │
│ Nung discovers the medicinal...     │
│                                      │
│ Significance: First documented use  │
└─────────────────────────────────────┘

Navigation Controls
[< Previous]  [5 / 19]  [Next >]

Timeline Dots
[●─●─●─●─○─○─○─○─○─○─○─○─○─○─○─○─○─○─○]
```

**Event Data Structure**:
```typescript
interface TimelineEvent {
  year: string;           // "2737 BCE", "2018", etc.
  era: string;           // Ancient, Modern, Reform, etc.
  region: string;        // China, USA, Global, etc.
  title: string;
  description: string;
  significance: string;
  icon: string;          // Emoji
}
```

**Interactive Elements**:
- Era filter buttons (7 options)
- Previous/Next navigation
- Position counter
- Direct event selection via dots
- AnimatePresence for smooth transitions

**19 Historical Events**:
- Range: 2737 BCE to 2024
- Eras: Ancient (5), Medieval (1), Colonial (2), Modern (3), Prohibition (3), Reform (5)
- Regions: China, India, Egypt, Greece, Rome, Middle East, Americas, Europe, Global

---

## ✅ Interactive Feature 3: `MythBuster.tsx`

**Purpose**: Fact-check common cannabis myths and misconceptions

**Visual Flow**:
```
Category Badge + Score
[Social Myths]    ✓ 5  ✗ 2

Statement Card
┌─────────────────────────────────────┐
│ "Cannabis is a 'gateway drug' that  │
│ inevitably leads to harder drug     │
│ use"                                │
└─────────────────────────────────────┘

Answer Options
┌──────────────┐  ┌──────────────┐
│   ✗ MYTH     │  │   ✓ FACT     │
│  (Red theme) │  │ (Green theme)│
└──────────────┘  └──────────────┘

After Selection:
Result Card
├─ ✓/✗ Icon + "Correct!" or "Incorrect"
└─ Badge: "This is a MYTH" or "This is a FACT"

Explanation Card
├─ 💡 Explanation
├─ Detailed text
└─ Sources: [Academic citations]

[Next Statement] button
Progress: [████████░░] 8/12
```

**Statement Data Structure**:
```typescript
interface MythFact {
  statement: string;
  isMyth: boolean;         // true = myth, false = fact
  explanation: string;
  category: string;
  sources?: string[];      // Academic/government sources
}
```

**Categories**:
1. Social Myths
2. Health Myths
3. Science Myths
4. Medical Facts
5. Plant Facts
6. Historical Facts
7. Industrial Myths

**Key Features**:
- Binary choice (Myth vs. Fact)
- Academic sources cited
- Real-time scoring (correct/incorrect)
- Progress tracking
- Detailed explanations
- Color-coded feedback (green/red)

---

## 🌍 Interactive Feature 4: `CannabisWorldMap.tsx`

**Purpose**: Explore global cannabis laws by region

**Visual Layout**:
```
Legend
[🟢 Legal Rec] [🔵 Legal Med] [🟡 Decrimin] 
[🔴 Illegal] [🟣 Mixed]

Region Selection Grid
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ 📍 North    │ │ 📍 South    │ │ 📍 Europe   │
│  America    │ │  America    │ │             │
│ [🟣 Mixed]  │ │ [🟣 Mixed]  │ │ [🟣 Mixed]  │
└─────────────┘ └─────────────┘ └─────────────┘

Selected Region Detail
┌─────────────────────────────────────┐
│ North America                        │
│ Progressive reform with several...   │
├─────────────────────────────────────┤
│ [Scrollable Country List]           │
│                                      │
│ 🇨🇦 Canada                          │
│ [🟢 Legal (Recreational)]           │
│ Since 2018                          │
│ Fully legalized recreational...     │
│ Significance: Second country...     │
│                                      │
│ 🇺🇸 United States                   │
│ [🟣 Mixed Status]                   │
│ Since 2012+                         │
│ Legal status varies by state...     │
│                                      │
└─────────────────────────────────────┘

Global Statistics
[50+ Countries] [3 Fully Legal] [30+ Decrimin] [Ongoing Reform]
```

**Region Data Structure**:
```typescript
interface Region {
  name: string;
  status: "legal-recreational" | "legal-medical" | 
          "decriminalized" | "illegal" | "mixed";
  countries: CountryInfo[];
  summary: string;
}

interface CountryInfo {
  name: string;
  flag: string;           // Emoji flag
  status: Status;
  details: string;
  year?: string;
  significance?: string;
}
```

**6 Global Regions**:
1. **North America** (3 countries)
   - Canada 🇨🇦, United States 🇺🇸, Mexico 🇲🇽

2. **South America** (3 countries)
   - Uruguay 🇺🇾, Colombia 🇨🇴, Argentina 🇦🇷

3. **Europe** (5 countries)
   - Netherlands 🇳🇱, Germany 🇩🇪, Portugal 🇵🇹, Spain 🇪🇸, Switzerland 🇨🇭

4. **Asia** (3 countries)
   - Thailand 🇹🇭, Israel 🇮🇱, Lebanon 🇱🇧

5. **Africa** (3 countries)
   - South Africa 🇿🇦, Lesotho 🇱🇸, Zimbabwe 🇿🇼

6. **Oceania** (2 countries)
   - Australia 🇦🇺, New Zealand 🇳🇿

**Key Features**:
- Color-coded legal status
- Region summaries
- Scrollable country lists
- Year of legalization/reform
- Historical significance notes
- Global statistics dashboard

---

## 📖 Content Sections (Tab-Based)

### 1. Ancient History Section

**Visual Structure**:
```
Header Card
├─ 🏮 Origins of Cannabis
├─ Description paragraph
└─ 3-Column Grid of Civilization Cards

Civilization Card Template:
┌─────────────────────┐
│ 🏮 Ancient China    │
│ [~2737 BCE]        │
│                     │
│ Emperor Shen Nung   │
│ is said to have...  │
│                     │
│ Key Highlights:     │
│ • Traditional med   │
│ • Hemp cultivation  │
│ • Textile prod      │
└─────────────────────┘
```

**Content Cards**: 3 civilizations
- Ancient China
- Ancient India
- Ancient Egypt

### 2. Medical Use Section

**Visual Structure**:
```
Historical Timeline (4 periods)
├─ Ancient Times → Medieval → 19th Century → Modern Era
└─ Each with icon + description

Modern Applications Grid (2x2)
┌─────────────┐ ┌─────────────┐
│ 🩹 Chronic  │ │ 🧠 Epilepsy │
│    Pain     │ │             │
│ CBD/THC...  │ │ FDA-approv..│
│ [Evidence]  │ │ [Evidence]  │
└─────────────┘ └─────────────┘

Warning Banner
⚠️ Note: Medical cannabis research is ongoing...
```

### 3. Cultural Influence Section

**Visual Structure**:
```
Overview Paragraph

3-Column Grid
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ 🎵 Music    │ │ 📖 Art &    │ │ 🌍 Social   │
│             │ │  Literature │ │  Movements  │
│ From jazz   │ │ Cannabis    │ │ Cannabis    │
│ and reggae  │ │ has inspir..│ │ has been... │
│             │ │             │ │             │
│ Examples:   │ │ Examples:   │ │ Examples:   │
│ • Jazz 20s  │ │ • Beat Gen  │ │ • Counter.. │
│ • Reggae    │ │ • Psyche... │ │ • Legaliz.. │
│ • Hip-hop   │ │ • Contemp.. │ │ • Criminal. │
│ • Electric..│ │ • Cannabis..│ │ • Medical.. │
└─────────────┘ └─────────────┘ └─────────────┘
```

### 4. Legal Journey Section

**Visual Structure**:
```
Overview Paragraph

Vertical Timeline (6 milestones)
├─ Timeline line (gradient: red → yellow → green)
│
├─ ✗ 1937: Marijuana Tax Act
│  │ Effectively criminalized...
│  │ [Prohibition badge]
│
├─ ✗ 1961: UN Single Convention
│  │ International treaty...
│  │ [Prohibition badge]
│
├─ ✓ 1996: California Prop 215
│  │ First U.S. state to...
│  │ [Reform badge]
│
├─ ✓ 2012: Colorado & Washington
│  │ First states to legalize...
│  │ [Reform badge]
│
├─ ✓ 2018: Canada Legalization
│  │ Second country after...
│  │ [Reform badge]
│
└─ ✓ 2020+: Global Reform Wave
   │ Multiple countries...
   │ [Reform badge]

Current Status Card
📍 As of 2024, cannabis remains illegal...
```

### 5. Industrial Uses Section

**Visual Structure**:
```
Overview Paragraph

3-Column Grid (6 categories)
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ 👔 Textiles │ │ 📄 Paper &  │ │ 🏗️ Construc│
│  & Fabric   │ │  Materials  │ │    tion     │
│             │ │             │ │             │
│ Hemp fiber  │ │ Hemp paper  │ │ Hempcrete   │
│ has been... │ │ is more...  │ │ and other...│
│             │ │             │ │             │
│ Uses:       │ │ Uses:       │ │ Uses:       │
│ ✓ Durable   │ │ ✓ Fine      │ │ ✓ Hempcrete│
│ ✓ Rope      │ │ ✓ Currency  │ │ ✓ Building │
│ ✓ Canvas    │ │ ✓ Filters   │ │ ✓ Fiberboar│
│ ✓ Fashion   │ │ ✓ Cardboard │ │ ✓ Bioplast.│
│             │ │             │ │             │
│ Benefits:   │ │ Benefits:   │ │ Benefits:   │
│ Stronger... │ │ Faster...   │ │ Carbon-neg..│
└─────────────┘ └─────────────┘ └─────────────┘

[Similar cards for Biofuel, Food, Cosmetics]

Environmental Impact Card
✨ Hemp is one of the most sustainable crops...
```

---

## 🎨 Design System

### Color Palette
- **Primary**: Emerald/Green (`text-primary`, `bg-primary`)
- **Section Colors**:
  - Amber: Ancient History
  - Emerald: Medical Use
  - Purple: Cultural Influence
  - Blue: Legal Journey
  - Cyan: Industrial Uses
- **Status Colors**:
  - Green: Legal/Correct
  - Red: Illegal/Incorrect
  - Yellow: Decriminalized/Warning
  - Blue: Medical/Info

### Typography
- **Headers**: Font Display, Bold
- **Body**: Font Sans, Regular
- **Labels**: Uppercase, Tracking Wide, Small
- **Badges**: Uppercase, Semibold, Extra Small

### Spacing
- **Sections**: `space-y-6` (24px vertical)
- **Cards**: `gap-4` or `gap-6` (16-24px)
- **Content**: `space-y-3` or `space-y-4` (12-16px)

### Animations
- **Page Entry**: Fade in + slide up
- **Tab Switch**: AnimatePresence with fade
- **Feature Toggle**: Fade + scale
- **Cards**: Staggered fade-in (delay: idx * 0.1s)

---

## 📱 Responsive Breakpoints

```
Mobile (< 640px)
├─ Single column layouts
├─ Stacked tabs
├─ Full-width cards
└─ Reduced padding

Tablet (640px - 1024px)
├─ 2-column grids
├─ Horizontal tabs
├─ Medium cards
└─ Standard padding

Desktop (> 1024px)
├─ 3-5 column grids
├─ Full navigation menu
├─ Large cards
└─ Maximum width container
```

---

## 🔧 Component Dependencies

```
All Components Use:
├─ @/components/ui/card
├─ @/components/ui/button
├─ @/components/ui/badge
├─ framer-motion (AnimatePresence, motion)
├─ lucide-react (icons)
└─ @/lib/utils (cn helper)

Additional:
├─ TriviaQuiz: Progress bar, score tracking
├─ HistoricalTimeline: ScrollArea, era filtering
├─ MythBuster: Binary choice, sources
└─ CannabisWorldMap: Region mapping, status legend
```

---

This comprehensive breakdown provides developers with a clear understanding of each component's structure, behavior, and visual design for maintenance or enhancement.
