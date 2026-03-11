# Phase 3: Achievement System - Research

**Researched:** 2026-03-10
**Domain:** Gamification UI, Progress Animations, TypeScript Data Architecture
**Confidence:** MEDIUM-HIGH

## Summary

The Achievement System phase requires building a gamified milestones page with unlocked/locked visual states, progress bars, categories, and satisfying animations—all derived from existing site data (library content, travel.json, projects). This research identifies the standard stack, animation patterns, data architecture, and common pitfalls for implementing achievement systems in Astro.

**Key Finding:** Use TypeScript interfaces for declarative achievement definitions, Tailwind transitions with CSS transforms for 60fps animations, CSS filters (grayscale + opacity) for locked states, and Astro's build-time computation via getCollection() to derive achievement state from real data.

**Primary recommendation:** Define achievements as TypeScript configuration objects with computed state functions, animate with CSS transitions on transform/opacity properties only, use progressive disclosure for locked achievements, and follow the existing project pattern of build-time data processing with Astro content collections.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | 5.16.11+ | Build-time data processing | Already in project; excellent for static data computation via getCollection() |
| Tailwind CSS | 3.4.19+ | Utility-first animations | Already configured; built-in animation utilities + custom keyframes |
| TypeScript | (via Astro) | Type-safe achievement definitions | Already in project; enables discriminated unions for achievement types |
| Zod | (in project) | Runtime validation for achievement data | Already used in content collections; ensures data integrity |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Astro Content Collections | Built-in | Query library/blog data | Computing reading-based achievements |
| CSS Grid + Auto-fit | Native | Responsive card layouts | Achievement card grid with no media queries needed |
| CSS Filters | Native | Locked state visual effects | Grayscale + opacity for inactive achievements |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| TypeScript config | JSON file | JSON lacks type safety, harder to maintain complex logic |
| CSS-only animations | Framer Motion/GSAP | Unnecessary bundle size for simple transitions; CSS performs better |
| Client-side computation | Build-time via Astro | Client-side adds runtime cost; build-time is faster and SEO-friendly |

**Installation:**
```bash
# No new packages required — all dependencies already in project
# Verify existing setup:
npm list astro tailwindcss typescript
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── data/
│   └── achievements.ts      # Achievement definitions and computation logic
├── pages/
│   └── achievements.astro   # Main achievements page
├── components/
│   └── achievements/
│       ├── AchievementCard.astro
│       ├── ProgressBar.astro
│       └── CategoryFilter.astro
└── types/
    └── achievement.ts       # TypeScript interfaces
```

### Pattern 1: Declarative Achievement Definitions

**What:** Define achievements as TypeScript configuration objects with metadata and computed state functions.

**When to use:** For maintainability and easy addition of new achievements without touching component code.

**Example:**
```typescript
// src/types/achievement.ts
export type AchievementCategory = 'travel' | 'reading' | 'projects' | 'personal';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'legendary';
  requirement: number;
  computeProgress: (data: SiteData) => number;
  unlockedMessage?: string;
}

// src/data/achievements.ts
import { getCollection } from 'astro:content';
import travelData from './travel.json';

export const achievements: Achievement[] = [
  {
    id: 'globe-trotter',
    title: 'Globe Trotter',
    description: 'Visit 50 countries',
    category: 'travel',
    icon: '🌍',
    tier: 'gold',
    requirement: 50,
    computeProgress: (data) => data.countries.length,
    unlockedMessage: 'You\'ve explored half a hundred nations!'
  },
  {
    id: 'bookworm',
    title: 'Bookworm',
    description: 'Read 100 books',
    category: 'reading',
    icon: '📚',
    tier: 'silver',
    requirement: 100,
    computeProgress: (data) => data.books.filter(b => b.data.type === 'book').length
  },
  {
    id: 's-tier-collector',
    title: 'S-Tier Collector',
    description: 'Rate 10 items as S or S+',
    category: 'reading',
    icon: '⭐',
    tier: 'legendary',
    requirement: 10,
    computeProgress: (data) =>
      data.library.filter(i => i.data.tier === 'S' || i.data.tier === 'S+').length
  }
];

export async function computeAchievementStates() {
  const library = await getCollection('library');
  const { countriesVisited, usStatesVisited } = travelData;

  const siteData = {
    library,
    books: library.filter(i => i.data.type === 'book'),
    countries: countriesVisited,
    usStates: usStatesVisited,
  };

  return achievements.map(achievement => ({
    ...achievement,
    current: achievement.computeProgress(siteData),
    isUnlocked: achievement.computeProgress(siteData) >= achievement.requirement,
    progress: Math.min(100, (achievement.computeProgress(siteData) / achievement.requirement) * 100)
  }));
}
```

### Pattern 2: Smooth Progress Bar Animations

**What:** Use Tailwind transitions on width property with transform-based secondary animations for optimal performance.

**When to use:** For animated progress indicators that feel responsive without janking.

**Example:**
```astro
---
// src/components/achievements/ProgressBar.astro
interface Props {
  progress: number; // 0-100
  isUnlocked: boolean;
}
const { progress, isUnlocked } = Astro.props;
---

<div class="w-full bg-surface rounded-full h-2 overflow-hidden">
  <div
    class="h-full rounded-full transition-all duration-700 ease-out"
    class:list={[
      isUnlocked
        ? 'bg-gradient-to-r from-primary via-gradient-mid to-secondary'
        : 'bg-text-muted'
    ]}
    style={`width: ${progress}%`}
  >
    {isUnlocked && (
      <div class="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
    )}
  </div>
</div>

<style>
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  .animate-shimmer {
    animation: shimmer 2s infinite;
  }
</style>
```

**Performance note:** From MDN and web.dev research, using `transition-all` on width is acceptable for progress bars, but transform-based animations (translateX for shimmer) are GPU-accelerated and maintain 60fps.

### Pattern 3: Locked/Unlocked Visual States

**What:** Use CSS filters (grayscale + reduced opacity) with subtle blur for locked states; clear, vibrant colors for unlocked.

**When to use:** To communicate achievement status without relying solely on text.

**Example:**
```astro
---
// src/components/achievements/AchievementCard.astro
interface Props {
  achievement: ComputedAchievement;
}
const { achievement } = Astro.props;
const { isUnlocked, title, description, icon, tier, current, requirement, progress } = achievement;
---

<div
  class="card relative overflow-hidden"
  class:list={[
    'transition-all duration-300',
    !isUnlocked && 'filter grayscale opacity-60'
  ]}
>
  {!isUnlocked && (
    <div class="absolute top-4 right-4 text-2xl opacity-50">🔒</div>
  )}

  <div class="text-4xl mb-3">{icon}</div>
  <h3 class="text-xl font-heading font-bold mb-2">{title}</h3>
  <p class="text-text-muted text-sm mb-4">{description}</p>

  <ProgressBar progress={progress} isUnlocked={isUnlocked} />

  <div class="mt-2 text-xs text-text-muted font-mono">
    {current} / {requirement}
  </div>

  {isUnlocked && (
    <div class="mt-3 text-xs text-primary font-medium">✓ Unlocked</div>
  )}
</div>
```

**From MDN research:** Grayscale and opacity are performant filters; avoid blur on hover states (causes repaints). Filters apply at GPU level in modern browsers.

### Pattern 4: Staggered Grid Animations

**What:** Use CSS animation delays with Tailwind utilities to create staggered "reveal" effect for achievement cards.

**When to use:** On initial page load to create satisfying progressive disclosure.

**Example:**
```astro
---
const achievementsWithDelay = computedAchievements.map((ach, index) => ({
  ...ach,
  animationDelay: index * 50 // 50ms stagger
}));
---

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {achievementsWithDelay.map((achievement) => (
    <div
      class="opacity-0 animate-fade-in"
      style={`animation-delay: ${achievement.animationDelay}ms`}
    >
      <AchievementCard achievement={achievement} />
    </div>
  ))}
</div>
```

**Tailwind config (already exists in project):**
```javascript
// tailwind.config.mjs
animation: {
  'fade-in': 'fadeIn 0.5s ease-out forwards',
}
keyframes: {
  fadeIn: {
    '0%': { opacity: '0', transform: 'translateY(20px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  }
}
```

### Pattern 5: Responsive Grid with Auto-Fit

**What:** Use CSS Grid with `auto-fit` and `minmax()` for responsive achievement cards without media queries.

**When to use:** Always, for achievement card grids.

**Example:**
```css
.achievement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}
```

**From MDN research:** This pattern automatically adjusts column count based on viewport width while maintaining minimum card size. Works better than Tailwind's responsive grid classes for unknown card counts.

### Anti-Patterns to Avoid

- **Animating layout properties:** Don't animate `width`, `height`, `top`, `left` directly for card movements—causes layout shifts. Use `transform: scale()` and `transform: translate()` instead.
- **Over-animating locked states:** Don't add blur or complex animations to locked cards—creates visual noise. Grayscale + opacity is sufficient.
- **Client-side achievement computation:** Don't compute achievement states in the browser—slows initial render. Use Astro's build-time processing.
- **Hardcoded achievement data:** Don't manually update achievement counts—defeats the purpose. Always derive from actual site data.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Progress bar animations | Custom JavaScript animation loop | CSS transitions on width + transform | CSS is GPU-accelerated, smoother, and simpler. Animation loops cause jank. |
| Achievement state management | Redux/Zustand store | Build-time computation with Astro | Static site = no need for runtime state. Compute once at build. |
| Responsive grid layouts | JavaScript resize handlers | CSS Grid `auto-fit` + `minmax()` | Native CSS is performant, accessible, and requires zero JS. |
| Filter/category logic | Custom filtering system | Adapt existing library page pattern | Project already has working filter UI with chips and state management. |
| Icon system | Custom SVG sprite system | Unicode emoji + Tailwind gradients | Simple, accessible, no bundle size. Matches playful achievement aesthetic. |

**Key insight:** Achievement systems seem complex but are fundamentally data + presentation. The complexity is in thoughtful milestone design, not technical implementation. Astro's build-time computation handles the "data" part; CSS handles the "presentation" part. No runtime framework needed.

## Common Pitfalls

### Pitfall 1: Layout Shift from Progress Bar Animations

**What goes wrong:** Progress bars animate from 0% to actual percentage on page load, causing content below to jump.

**Why it happens:** Animating height/width properties triggers layout recalculation.

**How to avoid:**
- Reserve space with fixed-height containers
- Use `overflow: hidden` on progress bar container
- Animate only the inner fill element's width
- Add `will-change: transform` for shimmer effects only (sparingly)

**Warning signs:** Lighthouse flags CLS issues; content "jumps" during load.

**Example prevention:**
```css
/* GOOD */
.progress-container {
  width: 100%;
  height: 8px; /* Fixed height */
  overflow: hidden;
  border-radius: 9999px;
}

.progress-fill {
  height: 100%; /* Inherits fixed height */
  transition: width 0.7s ease-out; /* Only width animates */
}

/* BAD */
.progress-fill {
  transition: all 0.7s ease-out; /* Animates height too = layout shift */
}
```

### Pitfall 2: Locked Achievement Information Scarcity

**What goes wrong:** Users can't tell what they need to do to unlock achievements—just see a grayed-out card.

**Why it happens:** Designers hide too much information to create "mystery."

**How to avoid:**
- Always show achievement title, description, and requirement (e.g., "Visit 50 countries")
- Show current progress numerically (e.g., "48 / 50")
- Use progressive disclosure for unlock messages/rewards, not basic requirements
- Make locked state visually distinct but information-rich

**Warning signs:** User testing shows confusion about what achievements mean; no clear path to unlock.

**Example:**
```astro
<!-- GOOD: Shows what's needed -->
<div class="locked-achievement">
  <h3>Globe Trotter</h3>
  <p>Visit 50 countries</p>
  <Progress current={48} total={50} />
  <p class="text-muted">48 / 50 countries visited</p>
</div>

<!-- BAD: Too mysterious -->
<div class="locked-achievement">
  <div class="blur">
    <h3>???</h3>
    <p>Keep exploring to unlock!</p>
  </div>
</div>
```

### Pitfall 3: Meaningless Milestones

**What goes wrong:** Achievement thresholds feel arbitrary (e.g., "Read 37 books") or don't reflect real accomplishments.

**Why it happens:** Gamification applied without considering user context and meaningful goals.

**How to avoid:**
- Use round numbers (10, 25, 50, 100) or culturally significant milestones
- Ensure achievements reflect genuine accomplishments, not padding
- Create tiered achievements (bronze/silver/gold) for same category
- Tie achievements to project values (exploration, learning, building)

**Warning signs:** Achievements feel like "participation trophies"; no sense of accomplishment when unlocked.

**Example milestones:**
- GOOD: "Visit all 7 continents" (meaningful, achievable)
- GOOD: "Read 100 books" (cultural milestone)
- BAD: "Visit 23 countries" (arbitrary number)
- BAD: "Read 3 books this week" (grindy, not reflecting site's purpose)

### Pitfall 4: Animation Performance on Low-End Devices

**What goes wrong:** Smooth animations on desktop become janky on mobile; users experience stuttering, battery drain.

**Why it happens:** Animating non-GPU properties or too many simultaneous animations.

**How to avoid:**
- Restrict animations to `transform` and `opacity` only
- Use `@media (prefers-reduced-motion: reduce)` to disable animations
- Stagger animations (max 50ms delay between cards)
- Test on actual mobile devices, not just DevTools throttling
- Avoid animating filters (blur, saturate) on hover/interaction

**Warning signs:** Mobile users report laggy scrolling; animations skip frames; battery drains quickly.

**Example:**
```css
/* GOOD: GPU-accelerated */
.card {
  transition: transform 0.3s ease-out, opacity 0.3s ease-out;
}
.card:hover {
  transform: translateY(-4px) scale(1.02);
}

/* BAD: Forces layout recalc */
.card {
  transition: top 0.3s ease-out, height 0.3s ease-out;
}
.card:hover {
  top: -4px;
  height: 220px;
}

/* RESPECT USER PREFERENCES */
@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }
}
```

### Pitfall 5: Stale Achievement Data

**What goes wrong:** Achievement counts don't update when content is added (e.g., "Read 50 books" still shows 48 after adding 2 new books).

**Why it happens:** Achievement computation logic isn't connected to data sources; manual updates required.

**How to avoid:**
- Always derive achievement state from actual data sources (getCollection(), travel.json, etc.)
- Use TypeScript functions that query live data, not hardcoded counts
- Add build-time validation to ensure achievement data matches reality
- Test: add content, rebuild site, verify counts updated

**Warning signs:** Achievement page shows different counts than Library page; manual updates needed after adding content.

**Example pattern:**
```typescript
// GOOD: Derives from actual data
export async function computeAchievementStates() {
  const library = await getCollection('library');
  const books = library.filter(i => i.data.type === 'book');

  return {
    booksRead: books.length, // Always current
    sTierCount: library.filter(i => ['S', 'S+'].includes(i.data.tier)).length
  };
}

// BAD: Hardcoded
const achievements = [
  { id: 'bookworm', current: 48, total: 50 } // Will be wrong after adding books
];
```

## Code Examples

Verified patterns from official sources:

### Build-Time Data Processing (Astro Content Collections)
```typescript
// Source: https://docs.astro.build/en/guides/content-collections/
// Pattern: Query and process content at build time

---
import { getCollection } from 'astro:content';

// Fetch all library items at build time
const library = await getCollection('library');

// Compute reading achievements
const bookCount = library.filter(i => i.data.type === 'book').length;
const sTierBooks = library.filter(i =>
  i.data.type === 'book' && ['S', 'S+'].includes(i.data.tier)
).length;

// Compute by year
const currentYear = new Date().getFullYear();
const booksThisYear = library.filter(i =>
  i.data.type === 'book' &&
  i.data.dateRead.includes(currentYear.toString())
).length;

const readingAchievements = [
  {
    id: 'bookworm-bronze',
    title: 'Bookworm',
    requirement: 25,
    current: bookCount,
    isUnlocked: bookCount >= 25
  },
  {
    id: 'curator',
    title: 'Curator',
    requirement: 10,
    current: sTierBooks,
    isUnlocked: sTierBooks >= 10
  }
];
---
```

### Progress Bar with Smooth Transitions (Tailwind)
```astro
<!-- Source: https://tailwindcss.com/docs/animation -->
<!-- Pattern: Width transition + transform shimmer effect -->

<div class="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
  <div
    class="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full
           transition-[width] duration-700 ease-out relative"
    style={`width: ${progress}%`}
  >
    <!-- Optional shimmer for unlocked achievements -->
    {isUnlocked && (
      <div
        class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent
               animate-[shimmer_2s_ease-in-out_infinite]"
      ></div>
    )}
  </div>
</div>

<style>
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
</style>
```

### Locked/Unlocked Card States (CSS Filters)
```astro
<!-- Source: https://developer.mozilla.org/en-US/docs/Web/CSS/filter -->
<!-- Pattern: Grayscale + opacity for locked states -->

<div
  class:list={[
    'card p-6 rounded-xl transition-all duration-300',
    !achievement.isUnlocked && 'grayscale opacity-60'
  ]}
>
  {!achievement.isUnlocked && (
    <div class="absolute top-3 right-3 text-xl opacity-40">🔒</div>
  )}

  <div class="flex items-start gap-4">
    <div class="text-5xl">{achievement.icon}</div>
    <div class="flex-1">
      <h3 class="font-heading text-xl font-bold mb-2">{achievement.title}</h3>
      <p class="text-text-muted text-sm mb-4">{achievement.description}</p>

      <ProgressBar
        progress={achievement.progress}
        isUnlocked={achievement.isUnlocked}
      />

      <div class="mt-2 flex justify-between items-center text-xs">
        <span class="font-mono text-text-muted">
          {achievement.current} / {achievement.requirement}
        </span>
        {achievement.isUnlocked && (
          <span class="text-green-400 font-medium">✓ Unlocked</span>
        )}
      </div>
    </div>
  </div>
</div>
```

### Responsive Grid Layout (CSS Grid)
```astro
<!-- Source: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout -->
<!-- Pattern: auto-fit + minmax for responsive cards -->

<div class="achievement-grid">
  {achievements.map((achievement, index) => (
    <div
      class="opacity-0 animate-fade-in"
      style={`animation-delay: ${index * 50}ms`}
    >
      <AchievementCard achievement={achievement} />
    </div>
  ))}
</div>

<style>
  .achievement-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  /* Respect reduced motion preference */
  @media (prefers-reduced-motion: reduce) {
    .animate-fade-in {
      animation: none;
      opacity: 1;
    }
  }
</style>
```

### Category Filter (Adapted from Library Pattern)
```astro
<!-- Source: Project's src/pages/library/index.astro -->
<!-- Pattern: Chip-based filters with active state -->

---
const categories: AchievementCategory[] = ['travel', 'reading', 'projects', 'personal'];
---

<div class="mb-8">
  <div class="flex flex-wrap gap-2" id="category-chips">
    <button class="chip chip-active" data-category="">All</button>
    {categories.map(cat => (
      <button class="chip" data-category={cat}>
        {cat.charAt(0).toUpperCase() + cat.slice(1)}
      </button>
    ))}
  </div>
</div>

<script>
  const chips = document.querySelectorAll('.chip');
  const cards = document.querySelectorAll('[data-category]');

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const category = chip.dataset.category || '';

      // Update active state
      chips.forEach(c => c.classList.remove('chip-active'));
      chip.classList.add('chip-active');

      // Filter cards
      cards.forEach(card => {
        const cardCategory = card.dataset.category;
        card.style.display = (!category || cardCategory === category) ? 'block' : 'none';
      });
    });
  });
</script>

<style>
  .chip {
    padding: 0.5rem 1rem;
    border-radius: 9999px;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text-muted);
    transition: all 0.2s ease;
  }

  .chip:hover {
    border-color: var(--color-primary);
    color: var(--color-text);
  }

  .chip-active {
    border-color: var(--color-primary);
    background: rgba(99, 102, 241, 0.15);
    color: var(--color-primary);
  }
</style>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JavaScript animation libraries (Velocity.js, Anime.js) | CSS transitions + transforms | ~2018-2020 | GPU acceleration, smaller bundles, better performance. CSS now handles 90% of UI animations. |
| Client-side achievement state | Build-time static generation | Jamstack era (~2019+) | Faster loads, better SEO, no runtime overhead for static sites. |
| Complex progress bar libraries | Native CSS with width transitions | ~2020+ | Simpler, no dependencies, better accessibility. |
| Media query breakpoints for grids | CSS Grid auto-fit + minmax | ~2021+ | Truly responsive without breakpoints, less CSS, more maintainable. |
| Custom filter/tag systems | Shared patterns across pages | Ongoing | Consistency, less duplicate code, familiar UX. |

**Deprecated/outdated:**
- **jQuery animations:** Replaced by CSS transitions and native JS. No longer needed for simple UI animations.
- **Achievement unlock modals:** Modern pattern favors inline feedback with subtle animations. Modals interrupt flow.
- **Pixel-perfect breakpoints:** CSS Grid's auto-fit makes most breakpoints unnecessary for card layouts.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — manual testing recommended |
| Config file | None — see Wave 0 |
| Quick run command | N/A (no test framework installed) |
| Full suite command | N/A |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ACH-01 | /achievements page exists and is accessible | smoke | Manual: Visit /achievements | ❌ Wave 0 |
| ACH-02 | Achievement cards display locked/unlocked states | visual | Manual: Inspect grayscale/opacity CSS | ❌ Wave 0 |
| ACH-03 | Categories filter achievements (travel/reading/projects/personal) | unit | Manual: Click category chips | ❌ Wave 0 |
| ACH-04 | Progress bars show accurate completion (e.g., 48/50) | unit | Manual: Verify computed vs. expected | ❌ Wave 0 |
| ACH-05 | Achievement data derives from library/travel/projects | integration | Manual: Add content, rebuild, verify count | ❌ Wave 0 |
| ACH-06 | Hover/reveal animations work smoothly | visual | Manual: Lighthouse performance check | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** Manual visual inspection of changed components
- **Per wave merge:** Full page functionality test (filters, animations, data accuracy)
- **Phase gate:** Cross-browser testing (Chrome, Firefox, Safari), mobile responsive check, Lighthouse performance audit

### Wave 0 Gaps
No automated testing infrastructure exists in the project. For Phase 3:

**Recommended approach:** Manual testing with checklist
- [ ] Visual regression: Screenshot locked vs. unlocked states
- [ ] Data accuracy: Compare achievement counts to actual library/travel data
- [ ] Performance: Lighthouse audit (target: 90+ performance score)
- [ ] Accessibility: Keyboard navigation, screen reader labels
- [ ] Responsive: Test on mobile, tablet, desktop viewports

**Optional (if time permits):**
- [ ] Install Playwright for E2E smoke tests: `npm install -D @playwright/test`
- [ ] Create `tests/achievements.spec.ts` with basic page load + filter tests

**Note:** Given static site nature and build-time computation, integration tests would primarily verify data processing logic. Most bugs will be visual/UX (alignment, animation timing, filter behavior) which are best caught through manual QA and Lighthouse audits.

## Sources

### Primary (HIGH confidence)
- [Tailwind CSS Animation Docs](https://tailwindcss.com/docs/animation) - Animation utilities, custom keyframes
- [MDN: Using CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animations/Using_CSS_animations) - Animation properties, performance
- [MDN: CSS Grid Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout) - auto-fit, minmax patterns
- [MDN: CSS filter](https://developer.mozilla.org/en-US/docs/Web/CSS/filter) - Grayscale, opacity, performance
- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/) - Build-time data processing
- [Astro Data Fetching](https://docs.astro.build/en/guides/data-fetching/) - Top-level await patterns

### Secondary (MEDIUM confidence)
- [web.dev: Animations Guide](https://web.dev/articles/animations-guide) - Transform vs. layout properties (verified with MDN)
- [web.dev: CLS](https://web.dev/articles/cls) - Layout shift prevention (verified with MDN)
- [MDN: CSS Transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_transitions/Using_CSS_transitions) - Timing functions, best practices

### Project Context (HIGH confidence)
- Project's existing library page (`src/pages/library/index.astro`) - Filter pattern, stat computation
- Project's Card component (`src/components/Card.astro`) - Existing hover effects
- Project's global CSS (`src/styles/global.css`) - Animation utilities, design tokens
- Project's Tailwind config (`tailwind.config.mjs`) - Custom animations already defined

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All tools already in project, patterns verified in docs
- Architecture: MEDIUM-HIGH - Patterns adapted from official docs + existing project code
- Pitfalls: MEDIUM - Based on general web animation best practices and performance research
- Data processing: HIGH - Astro content collections pattern is well-documented and proven in this project

**Research date:** 2026-03-10
**Valid until:** ~60 days (stable technologies; CSS and Astro patterns don't change rapidly)

**Limitations:**
- No web search available for current gamification UX trends
- Relying on general animation/performance best practices rather than achievement-specific research
- No access to case studies of similar achievement systems in personal sites

**Recommended validation:**
- Build a prototype of one achievement category to test animation performance
- User test locked vs. unlocked visual distinction (is grayscale + opacity clear enough?)
- Verify achievement milestones feel meaningful, not arbitrary
