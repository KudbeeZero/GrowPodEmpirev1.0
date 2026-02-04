# Cannabis History - Visual UI Mockup

This document describes the visual appearance of the Cannabis History feature to help visualize the implementation without screenshots.

---

## 🎨 Overall Page Aesthetic

**Theme**: Dark cyberpunk with neon accents  
**Background**: Deep dark with subtle gradients  
**Primary Colors**: Emerald green, amber, purple, blue, cyan  
**Typography**: Modern, clean, highly readable  

---

## 📱 Page Header

```
╔══════════════════════════════════════════════════════════════╗
║  [📖]  HISTORY OF CANNABIS                                   ║
║         ▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂                                 ║
║         Gradient text: Primary → Emerald                     ║
║         Explore the rich history, culture, and science       ║
║         behind cannabis                                      ║
╚══════════════════════════════════════════════════════════════╝
```

**Visual Details**:
- Large book icon (📖) in emerald background circle
- Title uses display font, gradient text effect
- Subtitle in muted foreground color
- Subtle fade-in animation on page load

---

## ✨ Interactive Features Section

```
╔══════════════════════════════════════════════════════════════╗
║  ✨ Interactive Features                                     ║
║  Test your knowledge and explore cannabis history in         ║
║  engaging ways                                               ║
║                                                              ║
║  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   ║
║  │    🧠    │  │    ⏳    │  │    ✅    │  │    🌍    │   ║
║  │  Trivia  │  │Interacti │  │  Man vs  │  │  World   │   ║
║  │   Quiz   │  │ve Timeli │  │  Myth    │  │   Map    │   ║
║  └──────────┘  └──────────┘  └──────────┘  └──────────┘   ║
║                                                              ║
║  [Buttons have hover glow effect, selected has solid fill]  ║
╚══════════════════════════════════════════════════════════════╝
```

**Visual Details**:
- Card with gradient background (background → primary/5%)
- Primary border with slight glow
- 4 equal-width buttons in grid
- Icons in distinctive colors (pink, amber, green, blue)
- Selected button has solid background

---

## 🎮 Interactive Feature Display Area

When a feature is selected, it appears in an animated card:

### Trivia Quiz Display
```
╔══════════════════════════════════════════════════════════════╗
║  🧠 Cannabis History Trivia            [3/12] [Score: 2]     ║
║  Test your knowledge of cannabis history, culture...         ║
║  ───────────────────────────────────────────────────────     ║
║                                                              ║
║  [medium] [Ancient History]                                  ║
║                                                              ║
║  In which ancient civilization was cannabis first            ║
║  documented for medicinal use?                               ║
║                                                              ║
║  ┌────────────────────────────────────────────────────────┐ ║
║  │  ○  Ancient Egypt                                      │ ║
║  └────────────────────────────────────────────────────────┘ ║
║  ┌────────────────────────────────────────────────────────┐ ║
║  │  ●  Ancient China                   [SELECTED]         │ ║
║  └────────────────────────────────────────────────────────┘ ║
║  ┌────────────────────────────────────────────────────────┐ ║
║  │  ○  Ancient India                                      │ ║
║  └────────────────────────────────────────────────────────┘ ║
║  ┌────────────────────────────────────────────────────────┐ ║
║  │  ○  Ancient Greece                                     │ ║
║  └────────────────────────────────────────────────────────┘ ║
║                                                              ║
║  [        Submit Answer        ]                             ║
║                                                              ║
║  Progress: [███████░░░░░] 25%                               ║
╚══════════════════════════════════════════════════════════════╝
```

### After Answering
```
╔══════════════════════════════════════════════════════════════╗
║  ✓ Correct!                                                  ║
║  ┌────────────────────────────────────────────────────────┐ ║
║  │  Emperor Shen Nung of China documented cannabis use    │ ║
║  │  around 2737 BCE, making it one of the earliest        │ ║
║  │  recorded medicinal uses.                              │ ║
║  └────────────────────────────────────────────────────────┘ ║
║  [Green border, checkmark icon]                              ║
║                                                              ║
║  [          Next Question          ]                         ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 📑 Main Content Tabs

```
╔══════════════════════════════════════════════════════════════╗
║  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   ║
║  │🏮Ancient│ │🧪Medical│ │🎵Cultur│ │⚖️ Legal│ │🏭Indust│   ║
║  │ History│ │   Use  │ │  al    │ │ Journey│ │  rial  │   ║
║  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘   ║
║  [Active tab has primary background, others transparent]     ║
╚══════════════════════════════════════════════════════════════╝
```

**Visual Details**:
- 5 tabs in responsive grid
- Icons with color coding
- Active tab: Primary/20% background, primary text
- Inactive tabs: Transparent, muted text
- Smooth transition when switching

---

## 📖 Ancient History Tab Content

```
╔══════════════════════════════════════════════════════════════╗
║  🏮 Origins of Cannabis                                      ║
║  Cannabis has been used by human civilizations for           ║
║  thousands of years...                                       ║
║  ───────────────────────────────────────────────────────     ║
║                                                              ║
║  ┌──────────────────┐ ┌──────────────────┐ ┌─────────────┐ ║
║  │ 🏮 Ancient China │ │ 🕉️ Ancient India│ │ 🏛️ Ancient  │ ║
║  │  [~2737 BCE]     │ │  [~2000 BCE]    │ │   Egypt     │ ║
║  │                  │ │                 │ │ [~1550 BCE] │ ║
║  │ Emperor Shen Nung│ │ Cannabis, known │ │ The Ebers   │ ║
║  │ is said to have  │ │ as 'bhang' and  │ │ Papyrus     │ ║
║  │ discovered the   │ │ 'ganja', held   │ │ documents   │ ║
║  │ healing...       │ │ sacred status...│ │ cannabis... │ ║
║  │                  │ │                 │ │             │ ║
║  │ Key Highlights:  │ │ Key Highlights: │ │ Key High.:  │ ║
║  │ → Traditional... │ │ → Religious...  │ │ → Medical...│ ║
║  │ → Hemp cultiv... │ │ → Ayurvedic...  │ │ → Treating..│ ║
║  │ → Textile prod...│ │ → Spiritual...  │ │ → Pain rel..│ ║
║  └──────────────────┘ └──────────────────┘ └─────────────┘ ║
║                                                              ║
║  [Cards have subtle border glow, staggered fade-in]          ║
╚══════════════════════════════════════════════════════════════╝
```

**Visual Details**:
- Large header with amber icon
- Three-column grid on desktop
- Each card has flag emoji, badge with date
- Bullet points with arrow icons
- Subtle hover effect (border brightens)

---

## 🧪 Medical Use Tab Content

```
╔══════════════════════════════════════════════════════════════╗
║  🧪 Medical Applications Through History                     ║
║  From ancient remedies to modern pharmaceuticals             ║
║  ───────────────────────────────────────────────────────     ║
║                                                              ║
║  Historical Timeline of Medical Use                          ║
║  ┌────────────────────────────────────────────────────────┐ ║
║  │ ⏳ Ancient Times                                        │ ║
║  │ Pain relief, inflammation, digestive issues            │ ║
║  └────────────────────────────────────────────────────────┘ ║
║  ┌────────────────────────────────────────────────────────┐ ║
║  │ ⏳ Medieval Period                                      │ ║
║  │ Analgesic, anticonvulsant, sleep aid                   │ ║
║  └────────────────────────────────────────────────────────┘ ║
║  [... more timeline entries ...]                             ║
║                                                              ║
║  Modern Medical Applications                                 ║
║  ┌──────────────────┐ ┌──────────────────┐                 ║
║  │ 🩹 Chronic Pain  │ │ 🧠 Epilepsy      │                 ║
║  │                  │ │                  │                 ║
║  │ CBD and THC help │ │ FDA-approved CBD │                 ║
║  │ manage neuro...  │ │ medication for...│                 ║
║  │                  │ │                  │                 ║
║  │ [Strong evidence]│ │ [FDA approved]   │                 ║
║  └──────────────────┘ └──────────────────┘                 ║
║                                                              ║
║  ⚠️ Note: Medical cannabis research is ongoing. Always      ║
║  consult healthcare professionals...                         ║
╚══════════════════════════════════════════════════════════════╝
```

**Visual Details**:
- Timeline cards with emerald accents
- 2x2 grid for modern applications
- Badge tags for evidence level
- Amber warning banner at bottom
- Fade-in animation with stagger

---

## 🎵 Cultural Influence Tab Content

```
╔══════════════════════════════════════════════════════════════╗
║  🎵 Cultural Impact & Influence                              ║
║  How cannabis shaped art, music, and global culture          ║
║  ───────────────────────────────────────────────────────     ║
║                                                              ║
║  ┌──────────────────┐ ┌──────────────────┐ ┌─────────────┐ ║
║  │ 🎵 Music         │ │ 📖 Art &         │ │ 🌍 Social   │ ║
║  │                  │ │   Literature     │ │   Movements │ ║
║  │ From jazz and    │ │ Cannabis has     │ │ Cannabis has│ ║
║  │ reggae to hip-hop│ │ inspired count...│ │ been central│ ║
║  │ and electronic...│ │                  │ │ to various..│ ║
║  │                  │ │ Notable Examples:│ │             │ ║
║  │ Notable Examples:│ │ → Beat Generat...│ │ Notable Ex.:│ ║
║  │ → Jazz musicians │ │ → Psychedelic ...│ │ → Counterc..│ ║
║  │ → Bob Marley and │ │ → Contemporary...│ │ → Legaliza..│ ║
║  │ → Hip-hop's rel..│ │ → Cannabis-the...│ │ → Criminal..│ ║
║  │ → Electronic mu..│ │                  │ │ → Medical a│ ║
║  └──────────────────┘ └──────────────────┘ └─────────────┘ ║
╚══════════════════════════════════════════════════════════════╝
```

**Visual Details**:
- Purple/pink color accents
- Three-column layout
- Icon headers with color coding
- Bullet lists with arrow icons
- Hover effect brightens borders

---

## ⚖️ Legal Journey Tab Content

```
╔══════════════════════════════════════════════════════════════╗
║  ⚖️ The Legal Journey                                        ║
║  From prohibition to legalization                            ║
║  ───────────────────────────────────────────────────────     ║
║                                                              ║
║      │                                                       ║
║  ● ──┤ [1937] Marijuana Tax Act (USA)                       ║
║  ✗   │ Effectively criminalized cannabis...                 ║
║      │ [Prohibition badge - Red]                            ║
║      │                                                       ║
║      │                                                       ║
║  ● ──┤ [1961] UN Single Convention                          ║
║  ✗   │ International treaty classified...                   ║
║      │ [Prohibition badge - Red]                            ║
║      │                                                       ║
║      │                                                       ║
║  ● ──┤ [1996] California Proposition 215                    ║
║  ✓   │ First U.S. state to legalize medical...             ║
║      │ [Reform badge - Green]                               ║
║      │                                                       ║
║  [Timeline continues with gradient line: red→yellow→green]   ║
║                                                              ║
║  📍 Current Global Status                                    ║
║  As of 2024, cannabis remains illegal in many countries...   ║
╚══════════════════════════════════════════════════════════════╝
```

**Visual Details**:
- Vertical timeline with gradient line
- Prohibition events: Red circle with ✗
- Reform events: Green circle with ✓
- Year badges and event cards
- Blue info card for current status

---

## 🏭 Industrial Uses Tab Content

```
╔══════════════════════════════════════════════════════════════╗
║  🏭 Industrial Applications                                  ║
║  Hemp's versatile applications in industry                   ║
║  ───────────────────────────────────────────────────────     ║
║                                                              ║
║  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          ║
║  │👔 Textil│ │📄 Paper │ │🏗️ Constr│ │⚡ Biofuel│          ║
║  │  es     │ │         │ │  uction │ │         │          ║
║  │         │ │         │ │         │ │         │          ║
║  │Hemp fib.│ │Hemp pap.│ │Hempcre..│ │Hemp can.│          ║
║  │has been │ │is more  │ │and other│ │be conv..│          ║
║  │used for │ │sustain..│ │hemp-bas.│ │into bio.│          ║
║  │         │ │         │ │         │ │         │          ║
║  │Applicat:│ │Applicat:│ │Applicat:│ │Applicat:│          ║
║  │✓ Durabl.│ │✓ Fine p.│ │✓ Hempcr.│ │✓ Hemp b.│          ║
║  │✓ Rope   │ │✓ Curren.│ │✓ Buildi.│ │✓ Hemp e.│          ║
║  │✓ Canvas │ │✓ Filter.│ │✓ Fiberb.│ │✓ Biomas.│          ║
║  │✓ Fashion│ │✓ Cardb..│ │✓ Biople.│ │✓ Carbon.│          ║
║  │         │ │         │ │         │ │         │          ║
║  │Benefits:│ │Benefits:│ │Benefits:│ │Benefits:│          ║
║  │Stronger │ │Faster g.│ │Carbon-n.│ │Renewab..│          ║
║  └─────────┘ └─────────┘ └─────────┘ └─────────┘          ║
║                                                              ║
║  [2 more cards: 🌾 Food & Nutrition, 🧴 Cosmetics]         ║
║                                                              ║
║  ✨ Environmental Impact                                     ║
║  Hemp is one of the most sustainable crops on Earth...      ║
╚══════════════════════════════════════════════════════════════╝
```

**Visual Details**:
- 3-column grid (6 cards total, 2 rows)
- Cyan color accents
- Emoji icons for each category
- Checkmark lists for applications
- Green environmental impact card at bottom

---

## 🎯 Responsive Design

### Desktop (1024px+)
- Full 3-5 column grids
- Side-by-side layouts
- Large interactive areas
- Full navigation visible

### Tablet (640-1024px)
- 2-3 column grids
- Stacked some sections
- Medium touch targets
- Compact layouts

### Mobile (<640px)
- Single column layouts
- Full-width cards
- Stacked tabs
- Large touch areas (44x44px min)
- Reduced padding

---

## ✨ Animation Details

1. **Page Load**
   - Header fades in + slides down
   - Feature buttons fade in with stagger
   - Content loads with smooth transition

2. **Tab Switch**
   - Fade out old content
   - Brief pause
   - Fade in new content
   - Smooth, not jarring

3. **Interactive Features**
   - Scale + fade when toggling
   - Smooth height transitions
   - Button hover: scale-105, glow effect
   - Card hover: border brightens

4. **Quiz/Game Interactions**
   - Answer selection: immediate visual feedback
   - Correct/incorrect: color change + icon appear
   - Progress bar: smooth width animation
   - Question change: slide transition

---

## 🎨 Color Examples (Dark Theme)

```
Background Shades:
██ bg-background (darkest)
██ bg-white/5 (subtle cards)
██ bg-primary/5 (primary tint)
██ bg-primary/20 (active states)

Text Colors:
██ text-foreground (primary text)
██ text-muted-foreground (secondary)
██ text-primary (accent text)
██ text-amber-400 (ancient)
██ text-emerald-400 (medical)
██ text-purple-400 (cultural)
██ text-blue-400 (legal)
██ text-cyan-400 (industrial)

Border Colors:
── border-white/5 (subtle)
── border-white/10 (visible)
── border-primary/20 (accent)
── border-green-500/30 (success)
── border-red-500/30 (error)
```

---

This mockup provides a clear vision of the visual design without requiring actual screenshots. The implementation follows these designs closely!
