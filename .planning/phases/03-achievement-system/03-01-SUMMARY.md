---
phase: 03-achievement-system
plan: 01
subsystem: achievement-foundation
tags: [achievements, gamification, data-architecture, ui-components]

dependency_graph:
  requires: [library-content-collection, travel-json]
  provides: [achievement-types, achievement-data, achievement-ui-components]
  affects: []

tech_stack:
  added: []
  patterns: [content-collections, discriminated-unions, computed-state]

key_files:
  created:
    - src/types/achievement.ts
    - src/data/achievements.ts
    - src/components/achievements/ProgressBar.astro
    - src/components/achievements/AchievementCard.astro
  modified: []

decisions:
  - title: "18 achievements across 4 categories"
    rationale: "Balanced coverage of travel (6), reading (6), projects (3), and personal (3) milestones"
  - title: "Real data derivation from content collections"
    rationale: "Achievement progress computed from library collection and travel.json ensures data stays synchronized"
  - title: "Continent counting helpers"
    rationale: "Simple lookup maps for country-to-continent mapping cover all 46 visited countries"
  - title: "Shimmer animation on unlocked progress bars"
    rationale: "Visual celebration for completed achievements, respects prefers-reduced-motion"
  - title: "Grayscale + opacity for locked achievements"
    rationale: "Clear visual differentiation between locked and unlocked states"

metrics:
  duration_minutes: 3
  tasks_completed: 2
  files_created: 4
  files_modified: 0
  commits: 2
  completed_date: "2026-03-11"
---

# Phase 03 Plan 01: Achievement Data Architecture & Core UI Summary

**One-liner:** TypeScript achievement types with 18 data-driven milestones across 4 categories plus animated ProgressBar and AchievementCard components

## What Was Built

Created the complete data foundation for the gamified achievement system:

**Achievement Type System:**
- Full TypeScript interface hierarchy (Achievement, ComputedAchievement, AchievementCategory, SiteData)
- Discriminated union for 4 categories: travel, reading, projects, personal
- 4 tier levels: bronze, silver, gold, legendary

**Achievement Definitions (18 total):**

*Travel (6 achievements):*
- Globe Trotter (gold) - Visit 50 countries (46/50)
- All-American (silver) - Visit 25 US states (33/25) ✓ UNLOCKED
- Nomad Life (silver) - Live in 5+ cities (10/5) ✓ UNLOCKED
- Continent Collector (gold) - Visit 5 continents (4/5)
- Mexico Explorer (bronze) - Visit 5 Mexican states (6/5) ✓ UNLOCKED
- US Roadtripper (gold) - Visit 30+ US states (33/30) ✓ UNLOCKED

*Reading (6 achievements):*
- Bookworm (bronze) - Read 10 books ✓ UNLOCKED
- Avid Reader (silver) - Read 50 books (progress TBD from actual library)
- Curator (gold) - Rate 5 items S+ (derived from library tier field)
- S-Tier Collector (silver) - Rate 10 items S or S+
- Media Connoisseur (gold) - Log 50 items total in library
- Series Devotee (silver) - Read 10+ books in single series (checks for Expeditionary Force series)

*Projects (3 achievements):*
- Builder (bronze) - Launch 3 projects (9/3) ✓ UNLOCKED
- Serial Entrepreneur (gold) - Launch 5+ projects (9/5) ✓ UNLOCKED
- Portfolio King (legendary) - Launch 10 projects (9/10)

*Personal (3 achievements):*
- World Citizen (legendary) - Live on 3+ continents (3/3) ✓ UNLOCKED
- Transformation (legendary) - Lose 100+ lbs (100/100) ✓ UNLOCKED
- Polyglot Explorer (gold) - Visit countries across 4+ continents (4/4) ✓ UNLOCKED

**Data Computation:**
- `computeAchievementStates()` async function queries library content collection and travel.json
- Continent counting helpers map country codes to continents (NA, SA, EU, AS)
- Single call to `computeProgress()` per achievement (efficient)
- Progress percentage capped at 100%

**UI Components:**

*ProgressBar.astro:*
- Fixed-height bar (h-2.5) prevents CLS
- Animated width transition (700ms ease-out)
- Unlocked: gradient fill (indigo → purple → cyan) with shimmer overlay
- Locked: muted zinc-600 fill
- Shimmer animation (translateX -100% to 100%, 2s infinite)
- Respects prefers-reduced-motion

*AchievementCard.astro:*
- Uses existing `.card` class from global.css
- Conditional grayscale + opacity-60 for locked state
- Lock icon (🔒) positioned absolute top-right when locked
- Tier badge with category-specific colors:
  - Bronze: amber-900/30 background, amber-400 text
  - Silver: zinc-600/30 background, zinc-300 text
  - Gold: yellow-900/30 background, yellow-400 text
  - Legendary: purple-900/30 background, purple-400 text with gradient-text effect
- Layout: emoji icon (4xl), title (heading font), description (muted), progress bar, stats row
- Stats row: monospace current/requirement on left, green checkmark "Unlocked" on right
- Optional unlocked message in italic primary/80 text
- Hover lift (scale-[1.02]) disabled on mobile
- `data-category` attribute for client-side filtering in Plan 02

## Deviations from Plan

None - plan executed exactly as written.

## Key Decisions

**1. 18 achievements across 4 categories**
- Balanced distribution: travel (6), reading (6), projects (3), personal (3)
- Meaningful round-number milestones: 5, 10, 25, 30, 50, 100
- Mix of locked and unlocked provides immediate satisfaction + future goals

**2. Real data derivation strategy**
- Reading achievements query `getCollection('library')` and filter by tier/type
- Travel achievements use travel.json arrays (countriesVisited, usStatesVisited, etc.)
- Projects hardcoded as 9 (no content collection exists)
- Personal "Transformation" hardcoded as 100 (not derived from content)

**3. Continent counting approach**
- Simple lookup object maps country codes to continent codes (NA, SA, EU, AS)
- Separate helper for cities (maps country names to continents)
- Covers all 46 countries in travel.json
- Returns Set.size for unique continent count

**4. Visual differentiation for locked/unlocked**
- Locked: grayscale filter + 60% opacity + lock icon + muted zinc progress bar
- Unlocked: full color + gradient progress bar + shimmer + green checkmark
- Clear at-a-glance state recognition

**5. Tier badge design**
- Small pill in top-left with tier name
- Color-coded by tier level (bronze/silver/gold/legendary)
- Legendary gets gradient-text effect for extra prestige
- Consistent with site's existing design tokens

## Testing Notes

**TypeScript Validation:**
- ✓ TypeScript types compile without errors
- ✓ No type conflicts with content collection schemas

**Data Derivation:**
- Achievement progress functions accept SiteData parameter
- computeAchievementStates() builds SiteData from real sources
- Single progress computation per achievement (no redundant calls)

**Component Structure:**
- ProgressBar handles 0%, partial, and 100% cases
- AchievementCard renders both locked and unlocked states
- Mobile hover transforms disabled via media query
- Shimmer animation respects prefers-reduced-motion

## What's Next (Plan 02)

- Create achievements page at `/achievements`
- Wire up achievement computation in page loader
- Add category filtering (All, Travel, Reading, Projects, Personal)
- Add stats summary (X/18 unlocked, breakdown by category)
- Add sort controls (tier, progress, category)
- Page hero with overall progress visualization

## Files Created

1. **src/types/achievement.ts** - TypeScript interfaces for achievement system
2. **src/data/achievements.ts** - 18 achievement definitions + computeAchievementStates function
3. **src/components/achievements/ProgressBar.astro** - Animated progress bar with shimmer
4. **src/components/achievements/AchievementCard.astro** - Card component with locked/unlocked states

## Commits

- `1f7c476`: feat(03-01): create achievement types and data definitions
- `c27b5b0`: feat(03-01): add ProgressBar and AchievementCard components

## Self-Check: PASSED

**Files created verification:**
```
✓ src/types/achievement.ts exists
✓ src/data/achievements.ts exists
✓ src/components/achievements/ProgressBar.astro exists
✓ src/components/achievements/AchievementCard.astro exists
```

**Commits verification:**
```
✓ 1f7c476 found in git log
✓ c27b5b0 found in git log
```

All deliverables confirmed present and committed.
